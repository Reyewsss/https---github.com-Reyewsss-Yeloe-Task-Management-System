using Microsoft.AspNetCore.Mvc;
using task_management_system.Models;
using task_management_system.Services;

namespace task_management_system.Controllers
{
    public class DashboardController : Controller
    {
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;
        private readonly IUserSessionService _userSessionService;

        public DashboardController(ITaskService taskService, IProjectService projectService, IUserSessionService userSessionService)
        {
            _taskService = taskService;
            _projectService = projectService;
            _userSessionService = userSessionService;
        }

        public async Task<IActionResult> Index()
        {
            // Check authentication
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId()!;

            // Get user info for display
            ViewBag.UserEmail = _userSessionService.GetCurrentUserEmail();
            ViewBag.UserName = _userSessionService.GetCurrentUserName() ?? "User";
            ViewData["Title"] = "Dashboard";

            // Get user-specific dashboard data
            var allUserTasks = await _taskService.GetUserTasksAsync(userId);
            var allUserProjects = await _projectService.GetUserProjectsAsync(userId);
            
            // Get recent items (limit to 5)
            var recentTasks = allUserTasks.Take(5).ToList();
            var recentProjects = allUserProjects.Take(5).ToList();

            // Calculate statistics
            ViewBag.TotalTasks = allUserTasks.Count;
            ViewBag.CompletedTasks = allUserTasks.Count(t => t.IsCompleted);
            ViewBag.PendingTasks = allUserTasks.Count(t => !t.IsCompleted);
            ViewBag.TotalProjects = allUserProjects.Count;
            ViewBag.CompletedProjects = allUserProjects.Count(p => p.Status == ProjectStatus.Completed);
            ViewBag.ActiveProjects = allUserProjects.Count(p => p.Status == ProjectStatus.Active);

            // Pass recent items to view
            ViewBag.RecentTasks = recentTasks;
            ViewBag.RecentProjects = recentProjects;

            return View();
        }

        // GET: Dashboard/Search
        [HttpGet]
        public async Task<IActionResult> Search(string query)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
                {
                    return Json(new { success = true, tasks = new List<object>(), projects = new List<object>() });
                }

                var userId = _userSessionService.GetCurrentUserId()!;

                // Search tasks
                var allTasks = await _taskService.GetUserTasksAsync(userId);
                var matchedTasks = allTasks
                    .Where(t => 
                        t.Title.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                        (t.Description != null && t.Description.Contains(query, StringComparison.OrdinalIgnoreCase)))
                    .Take(5)
                    .Select(t => new
                    {
                        id = t.Id,
                        title = t.Title,
                        description = t.Description,
                        status = t.Status.ToString(),
                        priority = t.Priority.ToString(),
                        dueDate = t.DueDate?.ToString("MMM dd, yyyy"),
                        isCompleted = t.IsCompleted,
                        url = Url.Action("Dashboard", "Task", new { id = t.Id })
                    })
                    .ToList();

                // Search projects
                var allProjects = await _projectService.GetUserProjectsAsync(userId);
                var matchedProjects = allProjects
                    .Where(p => 
                        p.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                        (p.Description != null && p.Description.Contains(query, StringComparison.OrdinalIgnoreCase)))
                    .Take(5)
                    .Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        description = p.Description,
                        status = p.Status.ToString(),
                        priority = p.Priority.ToString(),
                        url = Url.Action("Dashboard", "Projects", new { id = p.Id })
                    })
                    .ToList();

                return Json(new
                {
                    success = true,
                    tasks = matchedTasks,
                    projects = matchedProjects
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}