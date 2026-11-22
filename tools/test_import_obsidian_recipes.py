"""Tests for the Obsidian recipe parser. Run: python3 -I -m unittest discover -s tools"""

import unittest

from import_obsidian_recipes import parse_body, parse_ingredient, parse_number


class ParseNumberTests(unittest.TestCase):
    def test_formats(self):
        self.assertEqual(parse_number("2"), 2)
        self.assertEqual(parse_number("2,3"), 2.3)
        self.assertEqual(parse_number("1½"), 1.5)
        self.assertEqual(parse_number("½"), 0.5)
        self.assertEqual(parse_number("1/2"), 0.5)


class ParseIngredientTests(unittest.TestCase):
    def check(self, line, amount, unit, name, note):
        got = parse_ingredient(line, None)
        self.assertEqual((got["amount"], got["unit"], got["name"], got["note"]), (amount, unit, name, note))

    def test_amount_unit_name_note(self):
        self.check("2 stk løg, finthakket", 2, "stk", "løg", "finthakket")
        self.check("800 g hakkede tomater (2 dåser)", 800, "g", "hakkede tomater", "2 dåser")
        self.check("1½ dl piskefløde", 1.5, "dl", "piskefløde", None)
        self.check("2,3 g peber", 2.3, "g", "peber", None)
        self.check("2 kg nakkefilet af svin (eller svinebov)", 2, "kg", "nakkefilet af svin", "eller svinebov")

    def test_no_amount(self):
        self.check("salt og peber", None, None, "salt og peber", None)
        self.check("olivenolie til servering", None, None, "olivenolie til servering", None)

    def test_amount_without_unit(self):
        self.check("3 æg", 3, None, "æg", None)

    def test_range_uses_upper_bound(self):
        self.check("2-3 fed hvidløg", 3, "fed", "hvidløg", "2–3")


class ParseBodyTests(unittest.TestCase):
    BODY = """> Kræver planlægning.

## Ingredienser
- 70 g bacon

### Til servering
- 75 g parmesan, friskrevet

## Fremgangsmåde
**Dag 1**
1. Steg bacon.
2. Server.
   Med parmesan.

### Samling
3. Saml.

## Rester og restebrug
- Rest parmesan → lasagne.

## Noter
-
"""

    def test_sections(self):
        out = parse_body(self.BODY)
        self.assertEqual(out["intro"], "> Kræver planlægning.")
        self.assertEqual([i["section"] for i in out["ingredients"]], [None, "Til servering"])
        self.assertEqual(
            out["steps"],
            [
                {"section": "Dag 1", "text": "Steg bacon."},
                {"section": "Dag 1", "text": "Server.\nMed parmesan."},
                {"section": "Samling", "text": "Saml."},
            ],
        )
        self.assertEqual(out["leftovers"], "- Rest parmesan → lasagne.")
        self.assertIsNone(out["notes"])


if __name__ == "__main__":
    unittest.main()
