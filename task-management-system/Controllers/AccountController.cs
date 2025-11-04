using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;
using task_management_system.Models;
using System.ComponentModel.DataAnnotations;

namespace task_management_system.Controllers
{
    public class AccountController : Controller
    {
        private readonly IUserSessionService _userSessionService;
        private readonly IAuthService _authService;
        private readonly IWebHostEnvironment _environment;
        private readonly IActivityService _activityService;
        private readonly IPreferencesService _preferencesService;

        public AccountController(IUserSessionService userSessionService, IAuthService authService, IWebHostEnvironment environment, IActivityService activityService, IPreferencesService preferencesService)
        {
            _userSessionService = userSessionService;
            _authService = authService;
            _environment = environment;
            _activityService = activityService;
            _preferencesService = preferencesService;
        }

        public async Task<IActionResult> Settings()
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
            ViewData["Title"] = "Settings";

            // Get user preferences
            var preferences = await _preferencesService.GetUserPreferencesAsync(userId);
            ViewBag.Preferences = preferences;

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
                var result = await _authService.UpdateProfileAsync(userId, request.FirstName, request.LastName, request.Email, request.Age, request.Address);

                if (result.success)
                {
                    // Update session with new email if changed
                    _userSessionService.UpdateUserSession(request.Email, request.FirstName, request.LastName);
                    
                    // Log profile update activity
                    var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                    var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                    await _activityService.LogActivityAsync(userId, ActivityTypes.ProfileUpdate, "Updated profile information", ipAddress, userAgent);
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

                if (result.success)
                {
                    // Log password change activity
                    var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                    var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                    await _activityService.LogActivityAsync(userId, ActivityTypes.PasswordChange, "Changed account password", ipAddress, userAgent);
                }

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
                    
                    // Log profile picture update activity
                    var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                    var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                    await _activityService.LogActivityAsync(userId, ActivityTypes.ProfilePictureUpdate, "Updated profile picture", ipAddress, userAgent);
                    
                    return Json(new { success = true, message = result.message, profilePictureUrl = dataUrl });
                }

                return Json(new { success = false, message = result.message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserActivities()
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var activities = await _activityService.GetUserActivitiesAsync(userId, 50);

                var activitiesData = activities.Select(a => new
                {
                    id = a.Id,
                    activityType = a.ActivityType,
                    description = a.Description,
                    ipAddress = a.IpAddress,
                    userAgent = a.UserAgent,
                    metadata = a.Metadata,
                    createdAt = a.CreatedAt
                }).ToList();

                return Json(new { success = true, activities = activitiesData });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> DeleteAccount([FromBody] DeleteAccountRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(request.Password))
                {
                    return Json(new { success = false, message = "Password is required" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var userEmail = _userSessionService.GetCurrentUserEmail()!;

                // Verify password before deletion
                var user = await _authService.LoginAsync(userEmail, request.Password);
                if (user == null)
                {
                    return Json(new { success = false, message = "Incorrect password" });
                }

                // Log account deletion activity before deleting
                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                await _activityService.LogActivityAsync(userId, "AccountDeleted", "Account permanently deleted", ipAddress, userAgent);

                // Delete account and all associated data
                var result = await _authService.DeleteAccountAsync(userId);

                if (result.success)
                {
                    // Clear session
                    HttpContext.Session.Clear();
                    
                    return Json(new { success = true, message = "Account deleted successfully" });
                }

                return Json(new { success = false, message = result.message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPreferences()
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var preferences = await _preferencesService.GetUserPreferencesAsync(userId);

                return Json(new
                {
                    success = true,
                    preferences = new
                    {
                        emailNotifications = preferences.EmailNotifications,
                        taskReminders = preferences.TaskReminders,
                        weeklySummary = preferences.WeeklySummary,
                        darkMode = preferences.DarkMode
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId()!;
                var preferences = new UserPreferences
                {
                    UserId = userId,
                    EmailNotifications = request.EmailNotifications,
                    TaskReminders = request.TaskReminders,
                    WeeklySummary = request.WeeklySummary,
                    DarkMode = request.DarkMode
                };

                var result = await _preferencesService.UpdateUserPreferencesAsync(userId, preferences);

                if (result.success)
                {
                    // Log preferences update activity
                    var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                    var userAgent = HttpContext.Request.Headers["User-Agent"].ToString();
                    await _activityService.LogActivityAsync(userId, "PreferencesUpdated", "Updated account preferences", ipAddress, userAgent);
                }

                return Json(new { success = result.success, message = result.message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }
    }

    public class UpdatePreferencesRequest
    {
        public bool EmailNotifications { get; set; }
        public bool TaskReminders { get; set; }
        public bool WeeklySummary { get; set; }
        public bool DarkMode { get; set; }
    }

    public class DeleteAccountRequest
    {
        [Required]
        public string Password { get; set; } = string.Empty;
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
        
        public int Age { get; set; }
        
        public string Address { get; set; } = string.Empty;
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