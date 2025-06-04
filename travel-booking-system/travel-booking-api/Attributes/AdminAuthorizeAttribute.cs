using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Linq;
using System.Security.Claims;
using travel_booking_api.Models;

namespace travel_booking_api.Attributes
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class AdminAuthorizeAttribute : AuthorizeAttribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // First, check if the user is authenticated
            if (!context.HttpContext.User.Identity.IsAuthenticated)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // Check if the user has the admin role
            // This assumes there's a role claim in the JWT token
            var userTypeClaim = context.HttpContext.User.Claims
                .FirstOrDefault(c => c.Type == "UserType");

            if (userTypeClaim == null || userTypeClaim.Value != UserType.Admin.ToString())
            {
                context.Result = new ForbidResult();
                return;
            }
        }
    }
}

