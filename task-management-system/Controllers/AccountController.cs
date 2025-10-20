using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;
using System.ComponentModel.DataAnnotations;

namespace task_management_system.Controllers
{
    public class AccountController : Controller
    {
        private readonly IUserSessionService _userSessionService;
        private readonly IAuthService _authService;

        public AccountController(IUserSessionService userSessionService, IAuthService authService)
        {
            _userSessionService = userSessionService;
            _authService = authService;
        }

        public IActionResult Settings()
        {
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userEmail = _userSessionService.GetCurrentUserEmail()!;
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            ViewBag.UserEmail = userEmail;
            ViewData["Title"] = "Settings";

            return View();
        }

        public async Task<IActionResult> Index()
        {
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId()!;
            var userEmail = _userSessionService.GetCurrentUserEmail()!;
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            ViewBag.UserEmail = userEmail;
            
            var user = await _authService.GetUserByEmailAsync(userEmail);
            ViewData["Title"] = "Account";

            return View(user);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Invalid data provided" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var result = await _authService.UpdateProfileAsync(userId, request.FirstName, request.LastName, request.Email);

                if (result.success)
                {
                    // Update session with new email if changed
                    _userSessionService.UpdateUserSession(request.Email, request.FirstName, request.LastName);
                }

                return Json(new { success = result.success, message = result.message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = "Invalid data provided" });
                }

                if (request.NewPassword != request.ConfirmPassword)
                {
                    return Json(new { success = false, message = "New passwords do not match" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var result = await _authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);

                return Json(new { success = result.success, message = result.message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }

    public class UpdateProfileRequest
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;
        
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
        
        [Required]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}