using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http; 
using task_management_system.Models;

namespace task_management_system.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;

        public HomeController(ILogger<HomeController> logger)
        {
            _logger = logger;
        }

        public IActionResult Index()
        {
            // Check if user is already logged in
            var userId = HttpContext.Session.GetString("UserId");
            
            if (!string.IsNullOrEmpty(userId))
            {
                _logger.LogInformation("User is already logged in, redirecting to dashboard");
                return RedirectToAction("Index", "Dashboard");
            }
            _logger.LogInformation("User is not logged in, showing home page");
            return View();
        }

        // Error handling action
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        [HttpPost]
        public IActionResult RedirectToRegister()
        {
            return RedirectToAction("Register", "Auth");
        }
    }
}
