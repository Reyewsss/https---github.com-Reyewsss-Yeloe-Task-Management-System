using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;
using task_management_system.ViewModels;
using task_management_system.Models;

namespace task_management_system.Controllers
{
    public class AuthController : Controller
    {
        private readonly IAuthService _authService;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;

        public AuthController(IAuthService authService, INotificationService notificationService, IEmailService emailService)
        {
            _authService = authService;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        // Login functionality
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Login(LoginViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var user = await _authService.LoginAsync(model.Email, model.Password);

            if (user == null)
            {
                ModelState.AddModelError("", "Invalid email or password, or email not verified.");
                return View(model);
            }

            // Set user session
            HttpContext.Session.SetString("UserId", user.Id);
            HttpContext.Session.SetString("UserEmail", user.Email);
            HttpContext.Session.SetString("UserName", $"{user.FirstName} {user.LastName}");

            TempData["Success"] = "Login successful!";
            return RedirectToAction("Index", "Dashboard");
        }

        // Register functionality
        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            // Additional server-side password validation for security
            if (!IsValidPassword(model.Password))
            {
                ModelState.AddModelError("Password", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
                return View(model);
            }

            var result = await _authService.RegisterAsync(model.Email, model.Password, model.FirstName, model.LastName);

            if (!result.success)
            {
                ModelState.AddModelError("", result.message);
                return View(model);
            }

            TempData["Success"] = result.message;
            return RedirectToAction("VerifyEmail", new { email = model.Email });
        }

        // Password validation helper method
        private bool IsValidPassword(string password)
        {
            if (string.IsNullOrEmpty(password) || password.Length < 8)
                return false;

            bool hasLower = password.Any(char.IsLower);
            bool hasUpper = password.Any(char.IsUpper);
            bool hasDigit = password.Any(char.IsDigit);
            bool hasSpecial = password.Any(ch => "!@#$%^&*(),.?\"':;{}|<>".Contains(ch));

            return hasLower && hasUpper && hasDigit && hasSpecial;
        }

        // Email verification functionality
        [HttpGet]
        public IActionResult VerifyEmail(string email)
        {
            var model = new VerifyEmailViewModel { Email = email };
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> VerifyEmail(VerifyEmailViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var result = await _authService.VerifyEmailAsync(model.Email, model.VerificationCode);

            if (!result.success)
            {
                ModelState.AddModelError("", result.message);
                return View(model);
            }

            // Get the user after successful verification
            var user = await _authService.GetUserByEmailAsync(model.Email);
            if (user != null)
            {
                await _notificationService.CreateNotificationAsync(
                    user.Id,
                    "Welcome to Yeloe!",
                    $"Hi {user.FirstName}! Welcome to Yeloe Task Management. Your account has been successfully created and verified. Start organizing your tasks and boost your productivity!",
                    NotificationType.AccountCreated
                );

                // Set user session
                HttpContext.Session.SetString("UserId", user.Id);
                HttpContext.Session.SetString("UserEmail", user.Email);
                HttpContext.Session.SetString("UserName", $"{user.FirstName} {user.LastName}");

                // Redirect to welcome page with modal
                TempData["ShowWelcomeModal"] = true;
                TempData["UserFirstName"] = user.FirstName;
                return RedirectToAction("Welcome");
            }

            // Fallback if user retrieval fails
            TempData["Success"] = result.message;
            return RedirectToAction("Login");
        }

        // Welcome page for new users
        [HttpGet]
        public IActionResult Welcome()
        {
            // Check if user is logged in
            if (string.IsNullOrEmpty(HttpContext.Session.GetString("UserId")))
            {
                return RedirectToAction("Login");
            }

            ViewBag.ShowWelcomeModal = TempData["ShowWelcomeModal"] as bool? ?? false;
            ViewBag.UserFirstName = TempData["UserFirstName"] as string ?? "User";
            
            return View();
        }

        // Forgot password functionality
        [HttpGet]
        public IActionResult ForgotPassword()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var result = await _authService.SendPasswordResetEmailAsync(model.Email, baseUrl);

            try
            {
                var user = await _authService.GetUserByEmailAsync(model.Email);
                if (user != null && user.IsEmailVerified)
                {
                    await _notificationService.CreateNotificationAsync(
                        user.Id,
                        "Password Reset Requested",
                        $"Hi {user.FirstName}! A password reset was requested for your account. If this wasn't you, please contact support immediately. The reset link will expire in 1 hour.",
                        NotificationType.PasswordReset
                    );
                }
            }
            catch (Exception)
            {
                // Empty for now
            }

            TempData["Success"] = result.message;
            return View();
        }

        // Reset password functionality
        [HttpGet]
        public async Task<IActionResult> ResetPassword(string email, string token)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                return RedirectToAction("Login");

            var isValid = await _authService.ValidatePasswordResetTokenAsync(email, token);
            if (!isValid)
            {
                TempData["Error"] = "Invalid or expired password reset link.";
                return RedirectToAction("Login");
            }

            var model = new ResetPasswordViewModel
            {
                Email = email,
                Token = token
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> ResetPassword(ResetPasswordViewModel model)
        {
            if (!ModelState.IsValid)
                return View(model);

            var result = await _authService.ResetPasswordAsync(model.Email, model.Token, model.NewPassword);

            if (!result.success)
            {
                ModelState.AddModelError("", result.message);
                return View(model);
            }

            try
            {
                var user = await _authService.GetUserByEmailAsync(model.Email);
                if (user != null)
                {
                    await _notificationService.CreateNotificationAsync(
                        user.Id,
                        "Password Successfully Reset",
                        $"Hi {user.FirstName}! Your password has been successfully reset. If you didn't make this change, please contact support immediately.",
                        NotificationType.PasswordReset
                    );
                }
            }
            catch (Exception)
            {
                // Empty for now 
            }

            ViewBag.Email = model.Email;
            ViewBag.Message = result.message;
            return View("ResetPasswordSuccess");
        }

        [HttpGet]
        public IActionResult ResetPasswordSuccess()
        {
            return View();
        }

        // Logout functionality
        [HttpGet]
        [HttpPost]
        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Index", "Home");
        }

        // Newsletter subscription
        [HttpPost]
        public async Task<IActionResult> Newsletter(NewsletterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = "Please enter a valid email address." });
            }

            try
            {
                // Create thank you email content
                var subject = "Welcome to Yeloe Newsletter! 🎉";
                var body = $@"
                <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' rel='stylesheet'>
                    <style>
                        body {{ font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #6A4018 0%, #8B5A2B 50%, #D2B48C 100%); color: white; padding: 40px 30px; text-align: center; }}
                        .header h1 {{ font-size: 28px; font-weight: 700; margin: 0 0 15px 0; }}
                        .header p {{ font-size: 16px; font-weight: 300; margin: 0; opacity: 0.9; }}
                        .content {{ padding: 40px 30px; }}
                        .content h2 {{ color: #6A4018; font-size: 22px; font-weight: 600; margin: 0 0 25px 0; }}
                        .highlight-box {{ background: linear-gradient(135deg, #FFF9E6 0%, #F5F1E8 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #6A4018; }}
                        .highlight-box h3 {{ color: #6A4018; font-size: 18px; font-weight: 600; margin: 0 0 10px 0; }}
                        .highlight-box p {{ margin: 0; color: #555; }}
                        .cta-section {{ text-align: center; margin: 35px 0; }}
                        .btn {{ display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #6A4018 0%, #8B5A2B 100%); text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(106, 64, 24, 0.3); transition: all 0.3s ease; }}
                        .features-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }}
                        .feature-item {{ background: #fafbfc; padding: 20px; border-radius: 10px; text-align: center; }}
                        .feature-item .emoji {{ font-size: 24px; margin-bottom: 10px; }}
                        .feature-item h4 {{ color: #6A4018; font-size: 16px; font-weight: 600; margin: 0 0 8px 0; }}
                        .feature-item p {{ font-size: 14px; color: #666; margin: 0; }}
                        .footer {{ background: #2c2c2c; color: white; padding: 25px 30px; text-align: center; }}
                        .footer p {{ margin: 0; font-size: 14px; }}
                        .footer small {{ opacity: 0.7; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🎉 Welcome to Yeloe!</h1>
                            <p>You're now part of our amazing community of productive people!</p>
                        </div>
                        
                        <div class='content'>
                            <h2>What's Coming Your Way:</h2>
                            
                            <div class='features-grid'>
                                <div class='feature-item'>
                                    <div class='emoji'>🚀</div>
                                    <h4>Latest Updates</h4>
                                    <p>New features & improvements</p>
                                </div>
                                <div class='feature-item'>
                                    <div class='emoji'>💡</div>
                                    <h4>Pro Tips</h4>
                                    <p>Productivity hacks & advice</p>
                                </div>
                            </div>
                            
                            <div class='highlight-box'>
                                <h3>Ready to Get Started?</h3>
                                <p>Join thousands of users who've transformed their productivity with Yeloe. Your journey to better task management starts now!</p>
                            </div>
                            
                            <div class='cta-section'>
                                <a href='{Request.Scheme}://{Request.Host}/Auth/Register' class='btn' style='color: white;'>Start Your Free Journey 🎯</a>
                            </div>
                            
                            <div style='background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 30px;'>
                                <p style='margin: 0 0 15px 0; color: #6A4018; font-weight: 600;'>🔥 What's Hot Right Now:</p>
                                <p style='margin: 5px 0; color: #555;'>✨ Beautiful dashboard with real-time updates</p>
                                <p style='margin: 5px 0; color: #555;'>📊 Smart project tracking that actually works</p>
                                <p style='margin: 5px 0; color: #555;'>🎨 Clean, modern design you'll love using</p>
                            </div>
                        </div>
                        
                        <div class='footer'>
                            <p><strong>Welcome to the Yeloe family! 🚀</strong></p>
                            <p><small>© 2025 Yeloe Task Management. All rights reserved.</small></p>
                        </div>
                    </div>
                </body>
                </html>";

                await _emailService.SendEmailAsync(model.Email, subject, body);

                return Json(new { success = true, message = "Thank you for subscribing! Check your email for a welcome message." });
            }
            catch (Exception)
            {
                return Json(new { success = false, message = "Sorry, something went wrong. Please try again later." });
            }
        }
    }
}