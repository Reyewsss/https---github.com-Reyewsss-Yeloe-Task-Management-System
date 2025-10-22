using Microsoft.AspNetCore.Mvc;
using task_management_system.Models.ViewModels;
using task_management_system.Services;
using task_management_system.Models;
using task_management_system.Data;
using MongoDB.Driver;

namespace task_management_system.Controllers
{
    public class TaskController : Controller
    {
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;
        private readonly IUserSessionService _userSessionService;
        private readonly MongoDbContext _context;

        public TaskController(
            ITaskService taskService, 
            IProjectService projectService, 
            IUserSessionService userSessionService,
            MongoDbContext context)
        {
            _taskService = taskService;
            _projectService = projectService;
            _userSessionService = userSessionService;
            _context = context;
        }

        [HttpGet]
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

            // Get all tasks for the current user
            var tasks = await _taskService.GetUserTasksAsync(userId);
            
            // Get all projects for dropdown
            var projects = await _projectService.GetUserProjectsAsync(userId);
            ViewBag.Projects = projects;
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            
            return View(tasks);
        }

        [HttpGet]
        public async Task<IActionResult> Dashboard(string id)
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

            if (string.IsNullOrEmpty(id))
            {
                return RedirectToAction("Index");
            }

            // Get the specific task
            var task = await _taskService.GetTaskByIdAsync(id, userId);
            if (task == null)
            {
                return RedirectToAction("Index");
            }

            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            
            return View(task);
        }

        [HttpPost]
        public async Task<IActionResult> AddComment([FromBody] AddCommentRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                var userName = _userSessionService.GetCurrentUserName();

                if (string.IsNullOrEmpty(request.Comment) || string.IsNullOrEmpty(request.TaskId))
                {
                    return Json(new { success = false, message = "Comment and task ID are required" });
                }

                var comment = new Comment
                {
                    TaskId = request.TaskId,
                    UserId = userId ?? string.Empty,
                    UserName = userName ?? "Unknown User",
                    Text = request.Comment,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Comments.InsertOneAsync(comment);

                return Json(new { 
                    success = true, 
                    message = "Comment added successfully!",
                    comment = new {
                        id = comment.Id,
                        userName = comment.UserName,
                        text = comment.Text,
                        createdAt = comment.CreatedAt,
                        timeAgo = GetTimeAgo(comment.CreatedAt)
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetComments(string taskId)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(taskId))
                {
                    return Json(new { success = false, message = "Task ID is required" });
                }

                var comments = await _context.Comments
                    .Find(c => c.TaskId == taskId)
                    .SortByDescending(c => c.CreatedAt)
                    .ToListAsync();

                var commentsData = comments.Select(c => new {
                    id = c.Id,
                    userName = c.UserName,
                    text = c.Text,
                    createdAt = c.CreatedAt,
                    timeAgo = GetTimeAgo(c.CreatedAt)
                }).ToList();
                
                return Json(new { success = true, comments = commentsData });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddWork([FromForm] string taskId, [FromForm] string description, IFormFile? file)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                var userName = _userSessionService.GetCurrentUserName();

                if (string.IsNullOrEmpty(description) || string.IsNullOrEmpty(taskId))
                {
                    return Json(new { success = false, message = "Work description and task ID are required" });
                }

                string? fileName = null;
                string? fileUrl = null;
                long? fileSize = null;

                // Handle file upload
                if (file != null && file.Length > 0)
                {
                    // Create uploads directory if it doesn't exist
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "work");
                    Directory.CreateDirectory(uploadsFolder);

                    // Generate unique file name
                    var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    // Save file
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    fileName = file.FileName;
                    fileUrl = $"/uploads/work/{uniqueFileName}";
                    fileSize = file.Length;
                }

                var workLog = new WorkLog
                {
                    TaskId = taskId,
                    UserId = userId ?? string.Empty,
                    UserName = userName ?? "Unknown User",
                    Description = description,
                    FileName = fileName,
                    FileUrl = fileUrl,
                    FileSize = fileSize,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.WorkLogs.InsertOneAsync(workLog);

                return Json(new { 
                    success = true, 
                    message = "Work submitted successfully!",
                    workLog = new {
                        id = workLog.Id,
                        userName = workLog.UserName,
                        description = workLog.Description,
                        fileName = workLog.FileName,
                        fileUrl = workLog.FileUrl,
                        fileSize = workLog.FileSize,
                        createdAt = workLog.CreatedAt,
                        timeAgo = GetTimeAgo(workLog.CreatedAt)
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetWork(string taskId)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (string.IsNullOrEmpty(taskId))
                {
                    return Json(new { success = false, message = "Task ID is required" });
                }

                var workLogs = await _context.WorkLogs
                    .Find(w => w.TaskId == taskId)
                    .SortByDescending(w => w.CreatedAt)
                    .ToListAsync();

                var workLogsData = workLogs.Select(w => new {
                    id = w.Id,
                    userName = w.UserName,
                    description = w.Description,
                    fileName = w.FileName,
                    fileUrl = w.FileUrl,
                    fileSize = w.FileSize,
                    createdAt = w.CreatedAt,
                    timeAgo = GetTimeAgo(w.CreatedAt)
                }).ToList();
                
                return Json(new { success = true, workLog = workLogsData });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskViewModel model)
        {
            try
            {
                // Check if user is logged in
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                // Validate model
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return Json(new { success = false, message = "Validation failed", errors });
                }

                // Auto-create project if it doesn't exist and project name is provided
                if (!string.IsNullOrWhiteSpace(model.Project))
                {
                    var userProjects = await _projectService.GetUserProjectsAsync(userId);
                    var projectExists = userProjects.Any(p => p.Name.Equals(model.Project, StringComparison.OrdinalIgnoreCase));
                    
                    if (!projectExists)
                    {
                        // Create new project automatically
                        var newProjectModel = new CreateProjectViewModel
                        {
                            Name = model.Project,
                            Description = $"Auto-created from task: {model.Title}",
                            Status = Models.ProjectStatus.Active,
                            Priority = Models.ProjectPriority.Medium
                        };
                        await _projectService.CreateProjectAsync(newProjectModel, userId);
                    }
                }

                // Create the task
                var task = await _taskService.CreateTaskAsync(model, userId);

                return Json(new
                {
                    success = true,
                    message = "Task created successfully!",
                    task = new
                    {
                        id = task.Id,
                        title = task.Title,
                        description = task.Description,
                        project = task.Project,
                        dueDate = task.DueDate?.ToString("MMM dd, yyyy"),
                        priority = task.Priority.ToString(),
                        status = task.Status.ToString(),
                        isCompleted = task.IsCompleted
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error creating task: {ex.Message}" });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetTask(string id)
        {
            try
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

                var task = await _taskService.GetTaskByIdAsync(id, userId);
                
                if (task == null)
                {
                    return Json(new { success = false, message = "Task not found" });
                }

                return Json(new
                {
                    success = true,
                    task = new
                    {
                        id = task.Id,
                        title = task.Title,
                        description = task.Description,
                        project = task.Project,
                        dueDate = task.DueDate?.ToString("yyyy-MM-dd"),
                        priority = task.Priority.ToString(),
                        status = task.Status.ToString(),
                        isCompleted = task.IsCompleted
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error fetching task: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Update([FromBody] UpdateTaskRequest request)
        {
            try
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

                // Validate model
                if (string.IsNullOrWhiteSpace(request.Title))
                {
                    return Json(new { success = false, message = "Task title is required" });
                }

                // Auto-create project if needed
                if (!string.IsNullOrWhiteSpace(request.Project))
                {
                    var userProjects = await _projectService.GetUserProjectsAsync(userId);
                    var projectExists = userProjects.Any(p => p.Name.Equals(request.Project, StringComparison.OrdinalIgnoreCase));
                    
                    if (!projectExists)
                    {
                        var newProjectModel = new CreateProjectViewModel
                        {
                            Name = request.Project,
                            Description = $"Auto-created from task update: {request.Title}",
                            Status = Models.ProjectStatus.Active,
                            Priority = Models.ProjectPriority.Medium
                        };
                        await _projectService.CreateProjectAsync(newProjectModel, userId);
                    }
                }

                var model = new CreateTaskViewModel
                {
                    Title = request.Title,
                    Description = request.Description,
                    Project = request.Project,
                    DueDate = request.DueDate,
                    Priority = request.Priority
                };

                var success = await _taskService.UpdateTaskAsync(request.TaskId, model, userId);
                
                if (success)
                {
                    var task = await _taskService.GetTaskByIdAsync(request.TaskId, userId);
                    if (task == null)
                    {
                        return Json(new { success = false, message = "Task not found after update" });
                    }
                    
                    return Json(new
                    {
                        success = true,
                        message = "Task updated successfully!",
                        task = new
                        {
                            id = task.Id,
                            title = task.Title,
                            description = task.Description,
                            project = task.Project,
                            dueDate = task.DueDate?.ToString("MMM dd, yyyy"),
                            priority = task.Priority.ToString(),
                            status = task.Status.ToString(),
                            isCompleted = task.IsCompleted
                        }
                    });
                }
                else
                {
                    return Json(new { success = false, message = "Task not found or update failed" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating task: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Complete([FromBody] TaskActionRequest request)
        {
            try
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

                var success = await _taskService.CompleteTaskAsync(request.TaskId, userId);
                
                if (success)
                {
                    return Json(new { success = true, message = "Task completed successfully!" });
                }
                else
                {
                    return Json(new { success = false, message = "Task not found or already completed" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error completing task: {ex.Message}" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Delete([FromBody] TaskActionRequest request)
        {
            try
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

                var success = await _taskService.DeleteTaskAsync(request.TaskId, userId);
                
                if (success)
                {
                    return Json(new { success = true, message = "Task deleted successfully!" });
                }
                else
                {
                    return Json(new { success = false, message = "Task not found" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting task: {ex.Message}" });
            }
        }

        // Helper method for time formatting
        private string GetTimeAgo(DateTime dateTime)
        {
            var timeSpan = DateTime.UtcNow - dateTime;

            if (timeSpan.TotalMinutes < 1)
                return "Just now";
            if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes} minute{((int)timeSpan.TotalMinutes != 1 ? "s" : "")} ago";
            if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours} hour{((int)timeSpan.TotalHours != 1 ? "s" : "")} ago";
            if (timeSpan.TotalDays < 7)
                return $"{(int)timeSpan.TotalDays} day{((int)timeSpan.TotalDays != 1 ? "s" : "")} ago";
            if (timeSpan.TotalDays < 30)
                return $"{(int)(timeSpan.TotalDays / 7)} week{((int)(timeSpan.TotalDays / 7) != 1 ? "s" : "")} ago";
            if (timeSpan.TotalDays < 365)
                return $"{(int)(timeSpan.TotalDays / 30)} month{((int)(timeSpan.TotalDays / 30) != 1 ? "s" : "")} ago";
            
            return $"{(int)(timeSpan.TotalDays / 365)} year{((int)(timeSpan.TotalDays / 365) != 1 ? "s" : "")} ago";
        }

        // Helper class for task actions
        public class TaskActionRequest
        {
            public string TaskId { get; set; } = string.Empty;
        }

        public class UpdateTaskRequest
        {
            public string TaskId { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
            public string? Description { get; set; }
            public string? Project { get; set; }
            public DateTime? DueDate { get; set; }
            public Models.TaskPriority Priority { get; set; }
        }

        public class AddCommentRequest
        {
            public string TaskId { get; set; } = string.Empty;
            public string Comment { get; set; } = string.Empty;
        }

        public class AddWorkRequest
        {
            public string TaskId { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public decimal Hours { get; set; }
            public DateTime Date { get; set; }
        }
    }
}
