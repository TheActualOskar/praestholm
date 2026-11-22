using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class RecipeDraftsAndAuthors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "Recipes",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDraft",
                table: "Recipes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedBy",
                table: "Recipes",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "IsDraft",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                table: "Recipes");
        }
    }
}
