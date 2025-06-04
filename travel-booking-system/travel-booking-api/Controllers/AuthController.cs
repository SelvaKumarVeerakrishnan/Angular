using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using travel_booking_api.Models;
using travel_booking_api.Services;

namespace travel_booking_api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Registers a new user
        /// </summary>
        /// <param name="registerDto">User registration information</param>
        /// <returns>Authentication token and user information</returns>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // For regular registration, UserType should not be specified
            // Reset it to ensure no one can self-register as admin
            registerDto.UserType = UserType.Regular;

            var (success, message, response) = await _authService.RegisterAsync(registerDto, false);

            if (!success)
            {
                return BadRequest(message);
            }

            return Ok(response);
        }

        /// <summary>
        /// Registers a new user with admin privileges (admin only)
        /// </summary>
        /// <param name="registerDto">User registration information</param>
        /// <returns>Authentication token and user information</returns>
        [HttpPost("register-admin")]
        [Authorize]
        [ProducesResponseType(typeof(AuthResponseDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        [ProducesResponseType((int)HttpStatusCode.Forbidden)]
        public async Task<IActionResult> RegisterAdmin([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Check if current user is admin
            bool isCurrentUserAdmin = false;
            var userTypeClaimValue = User.FindFirstValue("UserType");
            
            if (userTypeClaimValue != null && 
                (userTypeClaimValue == UserType.Admin.ToString() || userTypeClaimValue == "1"))
            {
                isCurrentUserAdmin = true;
            }

            if (!isCurrentUserAdmin)
            {
                return Forbid("Only administrators can create admin accounts");
            }

            // Set user type to Admin explicitly
            registerDto.UserType = UserType.Admin;

            var (success, message, response) = await _authService.RegisterAsync(registerDto, true);

            if (!success)
            {
                return BadRequest(message);
            }

            return Ok(response);
        }

        /// <summary>
        /// Authenticates a user
        /// </summary>
        /// <param name="loginDto">User login credentials</param>
        /// <returns>Authentication token and user information</returns>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), (int)HttpStatusCode.OK)]
        [ProducesResponseType(typeof(string), (int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var (success, message, response) = await _authService.LoginAsync(loginDto);

            if (!success)
            {
                return Unauthorized(message);
            }

            return Ok(response);
        }
    }
}

