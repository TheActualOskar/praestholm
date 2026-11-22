using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class Madkurv : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Baskets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LockedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OrderedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryDate = table.Column<DateOnly>(type: "date", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Baskets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BasketChecks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BasketId = table.Column<int>(type: "int", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Have = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketChecks_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BasketExtras",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BasketId = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AddedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketExtras", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketExtras_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BasketItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BasketId = table.Column<int>(type: "int", nullable: false),
                    Position = table.Column<int>(type: "int", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(12,3)", precision: 12, scale: 3, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Sources = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Have = table.Column<bool>(type: "bit", nullable: false),
                    FromPantry = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketItems_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BasketRecipes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BasketId = table.Column<int>(type: "int", nullable: false),
                    RecipeId = table.Column<int>(type: "int", nullable: true),
                    RecipeTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Servings = table.Column<int>(type: "int", nullable: false),
                    Day = table.Column<int>(type: "int", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    AddedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AddedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketRecipes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketRecipes_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BasketRecipes_Recipes_RecipeId",
                        column: x => x.RecipeId,
                        principalTable: "Recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "HouseholdItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Kind = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false),
                    BasketId = table.Column<int>(type: "int", nullable: true),
                    AddedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HouseholdItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HouseholdItems_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BasketChecks_BasketId_Key",
                table: "BasketChecks",
                columns: new[] { "BasketId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BasketExtras_BasketId",
                table: "BasketExtras",
                column: "BasketId");

            migrationBuilder.CreateIndex(
                name: "IX_BasketItems_BasketId_Position",
                table: "BasketItems",
                columns: new[] { "BasketId", "Position" });

            migrationBuilder.CreateIndex(
                name: "IX_BasketRecipes_BasketId",
                table: "BasketRecipes",
                column: "BasketId");

            migrationBuilder.CreateIndex(
                name: "IX_BasketRecipes_RecipeId",
                table: "BasketRecipes",
                column: "RecipeId");

            migrationBuilder.CreateIndex(
                name: "IX_Baskets_Status",
                table: "Baskets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdItems_BasketId",
                table: "HouseholdItems",
                column: "BasketId");

            migrationBuilder.CreateIndex(
                name: "IX_HouseholdItems_Kind_BasketId",
                table: "HouseholdItems",
                columns: new[] { "Kind", "BasketId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BasketChecks");

            migrationBuilder.DropTable(
                name: "BasketExtras");

            migrationBuilder.DropTable(
                name: "BasketItems");

            migrationBuilder.DropTable(
                name: "BasketRecipes");

            migrationBuilder.DropTable(
                name: "HouseholdItems");

            migrationBuilder.DropTable(
                name: "Baskets");
        }
    }
}
