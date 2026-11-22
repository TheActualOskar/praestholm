using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Praestholm.Api.Migrations
{
    /// <inheritdoc />
    public partial class BasketStapleChoices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BasketStapleChoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BasketId = table.Column<int>(type: "int", nullable: false),
                    StapleId = table.Column<int>(type: "int", nullable: false),
                    Buy = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasketStapleChoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BasketStapleChoices_Baskets_BasketId",
                        column: x => x.BasketId,
                        principalTable: "Baskets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BasketStapleChoices_BasketId_StapleId",
                table: "BasketStapleChoices",
                columns: new[] { "BasketId", "StapleId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BasketStapleChoices");
        }
    }
}
