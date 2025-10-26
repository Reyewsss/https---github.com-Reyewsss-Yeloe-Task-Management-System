using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;
using System.ComponentModel.DataAnnotations;

namespace task_management_system.Controllers
{
    public class AccountController : Controller
    {
        private readonly IUserSessionService _userSessionService;
        private readonly IAuthService _authService;
        private readonly IWebHostEnvironment _environment;

        public AccountController(IUserSessionService userSessionService, IAuthService authService, IWebHostEnvironment environment)
        {
            _userSessionService = userSessionService;
            _authService = authService;
            _environment = environment;
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
            ViewBag.UserProfilePicture = _userSessionService.GetCurrentUserProfilePicture();
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
            ViewBag.UserProfilePicture = _userSessionService.GetCurrentUserProfilePicture();
            
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

        [HttpPost]
        public async Task<IActionResult> UploadProfilePicture(IFormFile profilePicture)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (profilePicture == null || profilePicture.Length == 0)
                {
                    return Json(new { success = false, message = "No file uploaded" });
                }

                // Validate file type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif" };
                
                if (!allowedTypes.Contains(profilePicture.ContentType.ToLowerInvariant()))
                {
                    return Json(new { success = false, message = "Invalid file type. Only JPG, PNG, and GIF are allowed." });
                }

                var userId = _userSessionService.GetCurrentUserId()!;

                // Convert image to base64
                string base64Image;
                using (var memoryStream = new MemoryStream())
                {
                    await profilePicture.CopyToAsync(memoryStream);
                    var imageBytes = memoryStream.ToArray();
                    base64Image = Convert.ToBase64String(imageBytes);
                }

                // Update user profile with base64 image data
                var result = await _authService.UpdateProfilePictureAsync(userId, base64Image, profilePicture.ContentType);

                if (result.success)
                {
                    // Return data URL for immediate display
                    var dataUrl = $"data:{profilePicture.ContentType};base64,{base64Image}";
                    
                    // Update session with new profile picture
                    _userSessionService.UpdateProfilePicture(dataUrl);
                    
                    return Json(new { success = true, message = result.message, profilePictureUrl = dataUrl });
                }

                return Json(new { success = false, message = result.message });
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