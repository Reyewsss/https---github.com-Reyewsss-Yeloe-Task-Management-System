using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;

namespace task_management_system.Controllers
{
    public class PlannerController : Controller
    {
        private readonly IUserSessionService _userSessionService;
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;

        public PlannerController(
            IUserSessionService userSessionService,
            ITaskService taskService,
            IProjectService projectService)
        {
            _userSessionService = userSessionService;
            _taskService = taskService;
            _projectService = projectService;
        }

        // GET: Planner
        public async Task<IActionResult> Index()
        {
            // Check if user is logged in
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login", "Auth");
            }

            // Get user's tasks and projects for the calendar
            var tasks = await _taskService.GetUserTasksAsync(userId);
            var projects = await _projectService.GetUserProjectsAsync(userId);

            ViewBag.Tasks = tasks;
            ViewBag.Projects = projects;
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            ViewBag.UserEmail = _userSessionService.GetCurrentUserEmail();

            return View();
        }

        [HttpGet]
        public async Task<IActionResult> GetCalendarEvents()
        {
            if (!_userSessionService.IsUserLoggedIn())
            {
                return Json(new { success = false, message = "User not authenticated" });
            }

            var userId = _userSessionService.GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return Json(new { success = false, message = "User not authenticated" });
            }

            try
            {
                var tasks = await _taskService.GetUserTasksAsync(userId);
                var projects = await _projectService.GetUserProjectsAsync(userId);

                var events = new List<object>();

                foreach (var task in tasks)
                {
                    if (task.DueDate.HasValue)
                    {
                        events.Add(new
                        {
                            id = task.Id,
                            title = task.Title,
                            start = task.DueDate.Value.ToString("yyyy-MM-dd"),
                            backgroundColor = task.Priority == Models.TaskPriority.High ? "#F44336" :
                                            task.Priority == Models.TaskPriority.Medium ? "#FF9800" : "#4CAF50",
                            borderColor = task.Priority == Models.TaskPriority.High ? "#F44336" :
                                        task.Priority == Models.TaskPriority.Medium ? "#FF9800" : "#4CAF50",
                            type = "task",
                            description = task.Description,
                            project = task.Project,
                            status = task.Status.ToString(),
                            isCompleted = task.IsCompleted
                        });
                    }
                }

                foreach (var project in projects)
                {
                    if (project.DueDate.HasValue)
                    {
                        events.Add(new
                        {
                            id = project.Id,
                            title = $"📁 {project.Name}",
                            start = project.StartDate?.ToString("yyyy-MM-dd") ?? project.DueDate.Value.ToString("yyyy-MM-dd"),
                            end = project.DueDate.Value.ToString("yyyy-MM-dd"),
                            backgroundColor = "#6A4018",
                            borderColor = "#4A2D10",
                            type = "project",
                            description = project.Description,
                            status = project.Status.ToString()
                        });
                    }
                }

                return Json(new { success = true, events });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error fetching events: {ex.Message}" });
            }
        }
    }
}
