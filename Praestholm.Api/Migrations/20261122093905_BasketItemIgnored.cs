using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class BasketItemIgnored : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Ignored",
                table: "BasketItems",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ignored",
                table: "BasketItems");
        }
    }
}
