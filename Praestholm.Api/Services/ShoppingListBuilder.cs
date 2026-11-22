using System.Globalization;
using System.Text.RegularExpressions;
using Praestholm.Api.Models;

namespace Praestholm.Api.Services;

/// <summary>One thing to buy before merging, e.g. 400 g hakket oksekød from "Lasagne".</summary>
public record ShoppingLine(string Name, decimal? Amount, string? Unit, string Source);

/// <summary>
/// Merges recipe ingredients, staples, wishes and extras into one shopping list:
/// same name and compatible unit are added up (g/kg, ml/dl/l), piece units are rounded up,
/// and the pantry is subtracted.
/// </summary>
public static partial class ShoppingListBuilder
{
    private static readonly Dictionary<string, (string group, decimal factor)> Metric = new()
    {
        ["mg"] = ("g", 0.001m), ["g"] = ("g", 1m), ["kg"] = ("g", 1000m),
        ["ml"] = ("ml", 1m), ["cl"] = ("ml", 10m), ["dl"] = ("ml", 100m), ["l"] = ("ml", 1000m),
    };

    /// <summary>Plural -> singular, so "1 dåse" and "2 dåser" merge.</summary>
    private static readonly Dictionary<string, string> Singular = new()
    {
        ["dåser"] = "dåse", ["pakker"] = "pakke", ["skiver"] = "skive", ["stængler"] = "stængel",
        ["kviste"] = "kvist", ["bundter"] = "bundt", ["potter"] = "potte", ["bakker"] = "bakke",
    };

    /// <summary>Units you buy whole: amounts are rounded up.</summary>
    private static readonly HashSet<string> Countable =
        ["", "stk", "fed", "dåse", "pakke", "bundt", "potte", "bakke", "glas", "skive", "stængel", "kvist", "håndfuld"];

    private static readonly CompareInfo Danish = CultureInfo.GetCultureInfo("da-DK").CompareInfo;

    public static string NormalizeName(string name) => Spaces().Replace(name.Trim().ToLowerInvariant(), " ");

    private static string NormalizeUnit(string? unit)
    {
        var u = (unit ?? "").Trim().ToLowerInvariant().TrimEnd('.');
        return Singular.GetValueOrDefault(u, u);
    }

    /// <summary>Unit group and amount in the group's base unit (g, ml, or the unit itself).</summary>
    private static (string group, decimal? amount) ToBase(decimal? amount, string? unit)
    {
        var u = NormalizeUnit(unit);
        return Metric.TryGetValue(u, out var m) ? (m.group, amount * m.factor) : (u, amount);
    }

    public static string Key(string name, string? unit) => $"{NormalizeName(name)}|{ToBase(null, unit).group}";

    /// <summary>Base amount back to a readable unit: 1500 g -> 1,5 kg; 300 ml -> 3 dl.</summary>
    private static (decimal amount, string? unit) FromBase(string group, decimal amount, string? displayUnit)
    {
        switch (group)
        {
            case "g":
                return amount >= 1000 ? (Math.Round(amount / 1000, 2), "kg") : (Math.Round(amount, 0), "g");
            case "ml":
                if (amount >= 1000) return (Math.Round(amount / 1000, 2), "l");
                if (amount >= 100) return (Math.Round(amount / 100, 2), "dl");
                return (Math.Round(amount, 0), "ml");
        }

        var rounded = Countable.Contains(group) ? Math.Ceiling(amount) : Math.Round(amount, 2);
        return (rounded, displayUnit);
    }

    private sealed class Acc
    {
        public required string Key;
        public required string Name;
        public required string Group;
        public string? DisplayUnit;
        public decimal? Sum;
        public bool MissingAmount;
        public readonly List<string> Sources = [];
    }

    /// <param name="pantry">Beholdning: name, amount and unit at home.</param>
    /// <param name="checks">Manual "har det" choices by item key (true = skip, false = buy anyway).</param>
    public static List<ShoppingItemDto> Build(
        IEnumerable<ShoppingLine> lines,
        IEnumerable<(string name, decimal? amount, string? unit)> pantry,
        IReadOnlyDictionary<string, bool> checks)
    {
        var groups = new Dictionary<string, Acc>();
        foreach (var line in lines)
        {
            if (string.IsNullOrWhiteSpace(line.Name)) continue;
            var (group, baseAmount) = ToBase(line.Amount, line.Unit);
            var key = $"{NormalizeName(line.Name)}|{group}";
            if (!groups.TryGetValue(key, out var acc))
            {
                acc = new Acc { Key = key, Name = line.Name.Trim(), Group = group, DisplayUnit = line.Unit?.Trim() };
                groups[key] = acc;
            }

            if (baseAmount is { } a) acc.Sum = (acc.Sum ?? 0) + a;
            else acc.MissingAmount = true;

            // Show the plural form if any source used it ("2 dåser").
            if (line.Unit is { } u && u.Trim().Length > (acc.DisplayUnit?.Length ?? 0) && NormalizeUnit(u) == NormalizeUnit(acc.DisplayUnit))
                acc.DisplayUnit = u.Trim();

            if (!acc.Sources.Contains(line.Source)) acc.Sources.Add(line.Source);
        }

        var pantryByName = new Dictionary<string, List<(string group, decimal? amount, decimal? raw, string? unit)>>();
        foreach (var (name, amount, unit) in pantry)
        {
            var (group, baseAmount) = ToBase(amount, unit);
            var list = pantryByName.TryGetValue(NormalizeName(name), out var l) ? l : pantryByName[NormalizeName(name)] = [];
            list.Add((group, baseAmount, amount, unit));
        }

        var result = new List<ShoppingItemDto>();
        foreach (var acc in groups.Values)
        {
            var sum = acc.Sum;
            var fromPantry = false;
            string? note = acc.MissingAmount && sum is not null ? "en opskrift har ingen mængde" : null;

            if (pantryByName.TryGetValue(NormalizeName(acc.Name), out var stock))
            {
                if (stock.Any(s => s.amount is null))
                {
                    fromPantry = true; // "olivenolie" without amount: we have it
                }
                else if (stock.FirstOrDefault(s => s.group == acc.Group) is { amount: { } inStock } match && sum is { } need)
                {
                    if (inStock >= need) fromPantry = true;
                    else
                    {
                        sum = need - inStock;
                        note = $"har {Format(match.raw!.Value)} {match.unit}".TrimEnd();
                    }
                }
                else
                {
                    note = "noget i beholdningen";
                }
            }

            decimal? amount = null;
            var unit = acc.DisplayUnit;
            if (sum is { } s) (amount, unit) = FromBase(acc.Group, s, acc.DisplayUnit);
            if (string.IsNullOrEmpty(unit)) unit = null;

            var have = checks.TryGetValue(acc.Key, out var c) ? c : fromPantry;
            result.Add(new ShoppingItemDto(acc.Key, acc.Name, amount, unit, acc.Sources.ToArray(), note, have, fromPantry));
        }

        result.Sort((a, b) => Danish.Compare(a.name, b.name, CompareOptions.IgnoreCase));
        return result;
    }

    private static string Format(decimal d) => d.ToString("0.##", CultureInfo.GetCultureInfo("da-DK"));

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
