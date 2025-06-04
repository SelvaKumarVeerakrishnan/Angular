using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using Moq.EntityFrameworkCore;
using travel_booking_api.Data;
using travel_booking_api.Models;
using travel_booking_api.Services;

namespace travel_booking_api.Tests.Services
{
    [TestClass]
    public class AuthServiceTests
    {
        private Mock<ApplicationDbContext> _mockContext;
        private Mock<IConfiguration> _mockConfiguration;
        private Mock<IConfigurationSection> _mockSection;
        private AuthService _authService;
        private List<User> _users;

        [TestInitialize]
        public void Initialize()
        {
            // Setup mock users
            _users = new List<User>
            {
                new User
                {
                    Id = 1,
                    Email = "test@example.com",
                    FirstName = "Test",
                    LastName = "User",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
                    CreatedDate = DateTime.UtcNow.AddDays(-10)
                }
            };

            // Setup mock DbContext
            _mockContext = new Mock<ApplicationDbContext>();
            _mockContext.Setup(c => c.Users).ReturnsDbSet(_users);

            // Setup mock Configuration
            _mockConfiguration = new Mock<IConfiguration>();
            _mockSection = new Mock<IConfigurationSection>();

            // Configure JWT settings
            _mockSection.Setup(s => s.Value).Returns("this_is_a_very_secret_key_for_testing_purposes_only");
            _mockConfiguration.Setup(c => c["Jwt:Key"]).Returns("this_is_a_very_secret_key_for_testing_purposes_only");
            _mockConfiguration.Setup(c => c["Jwt:ExpiryInHours"]).Returns("24");
            _mockConfiguration.Setup(c => c["Jwt:Issuer"]).Returns("travel-booking-api");
            _mockConfiguration.Setup(c => c["Jwt:Audience"]).Returns("travel-booking-client");

            // Create the service with mocked dependencies
            _authService = new AuthService(_mockContext.Object, _mockConfiguration.Object);
        }

        [TestMethod]
        public async Task RegisterAsync_NewUser_ReturnsSuccess()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "newuser@example.com",
                Password = "Password123",
                FirstName = "New",
                LastName = "User"
            };

            // Mock email existence check
            _mockContext.Setup(c => c.Users.AnyAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(false);

            // Mock SaveChangesAsync
            _mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

            // Act
            var result = await _authService.RegisterAsync(registerDto);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.AreEqual("Registration successful", result.Message);
            Assert.IsNotNull(result.Response);
            Assert.AreEqual(registerDto.Email, result.Response.Email);
            Assert.AreEqual(registerDto.FirstName, result.Response.FirstName);
            Assert.AreEqual(registerDto.LastName, result.Response.LastName);
            Assert.IsFalse(string.IsNullOrEmpty(result.Response.Token));

            // Verify user was added to the database
            _mockContext.Verify(c => c.Users.Add(It.Is<User>(u => 
                u.Email == registerDto.Email && 
                u.FirstName == registerDto.FirstName && 
                u.LastName == registerDto.LastName)), 
                Times.Once);
            
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [TestMethod]
        public async Task RegisterAsync_ExistingEmail_ReturnsFailure()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com", // Already exists in _users
                Password = "Password123",
                FirstName = "Existing",
                LastName = "User"
            };

            // Mock email existence check to return true
            _mockContext.Setup(c => c.Users.AnyAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(true);

            // Act
            var result = await _authService.RegisterAsync(registerDto);

            // Assert
            Assert.IsFalse(result.Success);
            Assert.AreEqual("Email already exists", result.Message);
            Assert.IsNull(result.Response);

            // Verify user was NOT added to the database
            _mockContext.Verify(c => c.Users.Add(It.IsAny<User>()), Times.Never);
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Never);
        }

        [TestMethod]
        public async Task LoginAsync_ValidCredentials_ReturnsSuccess()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "Password123"
            };

            var existingUser = _users.First();

            // Mock FirstOrDefaultAsync to return the user
            _mockContext.Setup(c => c.Users.FirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(existingUser);

            // Mock SaveChangesAsync for updating last login date
            _mockContext.Setup(c => c.SaveChangesAsync(default)).ReturnsAsync(1);

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            Assert.IsTrue(result.Success);
            Assert.AreEqual("Login successful", result.Message);
            Assert.IsNotNull(result.Response);
            Assert.AreEqual(existingUser.Email, result.Response.Email);
            Assert.AreEqual(existingUser.FirstName, result.Response.FirstName);
            Assert.AreEqual(existingUser.LastName, result.Response.LastName);
            Assert.IsFalse(string.IsNullOrEmpty(result.Response.Token));

            // Verify LastLoginDate was updated
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [TestMethod]
        public async Task LoginAsync_InvalidEmail_ReturnsFailure()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "nonexistent@example.com",
                Password = "Password123"
            };

            // Mock FirstOrDefaultAsync to return null (user not found)
            _mockContext.Setup(c => c.Users.FirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync((User)null);

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            Assert.IsFalse(result.Success);
            Assert.AreEqual("Invalid email or password", result.Message);
            Assert.IsNull(result.Response);

            // Verify LastLoginDate was not updated
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Never);
        }

        [TestMethod]
        public async Task LoginAsync_InvalidPassword_ReturnsFailure()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "WrongPassword"
            };

            var existingUser = _users.First();

            // Mock FirstOrDefaultAsync to return the user
            _mockContext.Setup(c => c.Users.FirstOrDefaultAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(existingUser);

            // Act
            var result = await _authService.LoginAsync(loginDto);

            // Assert
            Assert.IsFalse(result.Success);
            Assert.AreEqual("Invalid email or password", result.Message);
            Assert.IsNull(result.Response);

            // Verify LastLoginDate was not updated
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Never);
        }

        [TestMethod]
        public async Task GenerateJwtToken_CreatesValidToken()
        {
            // Arrange
            var user = _users.First();

            // Configure test to expose private method using reflection
            var methodInfo = typeof(AuthService).GetMethod("GenerateJwtToken", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            // Act
            var token = methodInfo.Invoke(_authService, new object[] { user }) as string;

            // Assert
            Assert.IsNotNull(token);
            Assert.IsTrue(token.Split('.').Length == 3); // JWT has 3 parts separated by dots
        }

        [TestMethod]
        public async Task EmailExistsAsync_ExistingEmail_ReturnsTrue()
        {
            // Arrange
            string email = "test@example.com"; // Exists in mock data

            // Mock AnyAsync to return true
            _mockContext.Setup(c => c.Users.AnyAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(true);

            // Configure test to expose private method using reflection
            var methodInfo = typeof(AuthService).GetMethod("EmailExistsAsync", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            // Act
            var result = await (Task<bool>)methodInfo.Invoke(_authService, new object[] { email });

            // Assert
            Assert.IsTrue(result);
        }

        [TestMethod]
        public async Task EmailExistsAsync_NonExistingEmail_ReturnsFalse()
        {
            // Arrange
            string email = "nonexistent@example.com"; // Doesn't exist in mock data

            // Mock AnyAsync to return false
            _mockContext.Setup(c => c.Users.AnyAsync(
                It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), 
                default))
                .ReturnsAsync(false);

            // Configure test to expose private method using reflection
            var methodInfo = typeof(AuthService).GetMethod("EmailExistsAsync", 
                System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            
            // Act
            var result = await (Task<bool>)methodInfo.Invoke(_authService, new object[] { email });

            // Assert
            Assert.IsFalse(result);
        }
    }
}

