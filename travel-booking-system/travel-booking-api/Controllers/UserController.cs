using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using travel_booking_api.Attributes;
using travel_booking_api.Data;
using travel_booking_api.Models;

namespace travel_booking_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/User - Get all users (admin only)
        [HttpGet]
        [AdminAuthorize]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new UserListDto
                {
                    Id = u.Id,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    UserType = u.UserType,
                    IsActive = u.IsActive
                })
                .ToListAsync();

            return Ok(users);
        }

        // GET: api/User/{id} - Get user by id (admin only)
        [HttpGet("{id}")]
        [AdminAuthorize]
        public async Task<ActionResult<UserListDto>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            var userDto = new UserListDto
            {
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType,
                IsActive = user.IsActive
            };

            return Ok(userDto);
        }

        // PUT: api/User/{id}/status - Update user status (admin only)
        [HttpPut("{id}/status")]
        [AdminAuthorize]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateUserStatusDto model)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update user type and status
            user.UserType = model.UserType;
            user.IsActive = model.IsActive;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.Id == id);
        }
    }

    // DTOs for User operations
    public class UserListDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public UserType UserType { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public UserType UserType { get; set; }
        public bool IsActive { get; set; }
    }
}

