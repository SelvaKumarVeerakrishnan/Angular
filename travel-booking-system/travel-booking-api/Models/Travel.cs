using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace travel_booking_api.Models
{
    public class Travel
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        
        [Required]
        public string Destination { get; set; } = string.Empty;
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        [Required]
        public string Purpose { get; set; } = string.Empty;
        
        [Required]
        public decimal EstimatedCost { get; set; }
        
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public int? RejectedBy { get; set; }
        public DateTime? RejectedAt { get; set; }
        public string? Comments { get; set; }
    }
}
