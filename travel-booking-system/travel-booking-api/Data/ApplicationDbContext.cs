using Microsoft.EntityFrameworkCore;
using travel_booking_api.Models;

namespace travel_booking_api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Travel> Travels { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Travel entity
            modelBuilder.Entity<Travel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Destination).IsRequired();
                entity.Property(e => e.StartDate).IsRequired();
                entity.Property(e => e.EndDate).IsRequired();
                entity.Property(e => e.UserId).IsRequired();
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedDate).IsRequired();
            });
        }
    }
}
