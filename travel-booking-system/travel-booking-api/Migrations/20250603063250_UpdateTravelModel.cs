using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace travel_booking_api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTravelModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Travels",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Travels",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ApprovedBy",
                table: "Travels",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Comments",
                table: "Travels",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Travels",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedCost",
                table: "Travels",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Purpose",
                table: "Travels",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RejectedAt",
                table: "Travels",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RejectedBy",
                table: "Travels",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Travels",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Travels",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "ApprovedBy",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "Comments",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "EstimatedCost",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "Purpose",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "RejectedAt",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "RejectedBy",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Travels");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Travels");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Travels",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER");
        }
    }
}
