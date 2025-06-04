using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using travel_booking_api.Data;
using travel_booking_api.Models;

namespace travel_booking_api.Services
{
    public class AuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Response)> RegisterAsync(RegisterDto registerDto, bool isAdminRequest = false)
        {
            // Check if email already exists
            if (await EmailExistsAsync(registerDto.Email))
            {
                return (false, "Email already exists", null);
            }

            // Determine user type
            var userType = UserType.Regular; // Default to Regular
            
            // If UserType is specified in the request
            if (registerDto.UserType.HasValue)
            {
                // Only allow Admin creation if the request comes from an admin
                if (registerDto.UserType == UserType.Admin && !isAdminRequest)
                {
                    return (false, "Unauthorized: Only administrators can create admin accounts", null);
                }
                
                userType = registerDto.UserType.Value;
            }

            // Create new user
            var user = new User
            {
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                CreatedDate = DateTime.UtcNow,
                UserType = userType,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate token
            var token = GenerateJwtToken(user);

            // Create response
            var response = new AuthResponseDto
            {
                Token = token,
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType,
                IsActive = user.IsActive
            };

            return (true, "Registration successful", response);
        }

        public async Task<(bool Success, string Message, AuthResponseDto? Response)> LoginAsync(LoginDto loginDto)
        {
            // Find user by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
            if (user == null)
            {
                return (false, "Invalid email or password", null);
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return (false, "Invalid email or password", null);
            }

            // Update last login date
            user.LastLoginDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate token
            var token = GenerateJwtToken(user);

            // Create response
            var response = new AuthResponseDto
            {
                Token = token,
                Id = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserType = user.UserType,
                IsActive = user.IsActive
            };

            return (true, "Login successful", response);
        }

        private string GenerateJwtToken(User user)
        {
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]!);
            var tokenHandler = new JwtSecurityTokenHandler();
            
            // Determine role string based on user type
            string roleString = user.UserType == UserType.Admin ? "Admin" : "User";
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.GivenName, user.FirstName),
                    new Claim(ClaimTypes.Surname, user.LastName),
                    // Include consistent user type claims
                    new Claim("UserType", user.UserType.ToString()),
                    new Claim("userType", user.UserType.ToString()), // lowercase for JS convention
                    // Include role claims for authorization
                    new Claim(ClaimTypes.Role, roleString),
                    new Claim("role", roleString), // for frontend consumption
                    new Claim("IsActive", user.IsActive.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(double.Parse(_configuration["Jwt:ExpiryInHours"]!)),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private async Task<bool> EmailExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }
    }
}

