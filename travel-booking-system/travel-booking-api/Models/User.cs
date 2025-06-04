using System;
using System.ComponentModel.DataAnnotations;

namespace travel_booking_api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string LastName { get; set; } = string.Empty;
        
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        public DateTime? LastLoginDate { get; set; }
        
        public UserType UserType { get; set; } = UserType.Regular;
        
        public bool IsActive { get; set; } = true;
    }
}

