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
        private readonly IEncryptionService _encryptionService;
        private readonly INotificationService _notificationService;

        public TaskController(
            ITaskService taskService, 
            IProjectService projectService, 
            IUserSessionService userSessionService,
            MongoDbContext context,
            IEncryptionService encryptionService,
            INotificationService notificationService)
        {
            _taskService = taskService;
            _projectService = projectService;
            _userSessionService = userSessionService;
            _context = context;
            _encryptionService = encryptionService;
            _notificationService = notificationService;
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
            ViewBag.UserProfilePicture = _userSessionService.GetCurrentUserProfilePicture();
            ViewBag.UserId = userId;
            
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
            ViewBag.UserProfilePicture = _userSessionService.GetCurrentUserProfilePicture();
            ViewBag.UserId = userId;
            ViewBag.IsTaskOwner = task.UserId == userId;
            
            return View(task);
        }

        [HttpPost]
        public async Task<IActionResult> AddComment([FromForm] string taskId, [FromForm] string comment, IFormFile? file)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                var userName = _userSessionService.GetCurrentUserName();

                if ((string.IsNullOrEmpty(comment) && file == null) || string.IsNullOrEmpty(taskId))
                {
                    return Json(new { success = false, message = "Comment text or file is required" });
                }

                // Encrypt the comment text before storing
                var encryptedText = !string.IsNullOrEmpty(comment) ? _encryptionService.Encrypt(comment) : string.Empty;

                var commentEntity = new Comment
                {
                    TaskId = taskId,
                    UserId = userId ?? string.Empty,
                    UserName = userName ?? "Unknown User",
                    CommentText = encryptedText,
                    CreatedAt = DateTime.UtcNow
                };

                // Handle file upload
                if (file != null && file.Length > 0)
                {
                    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "comments");
                    Directory.CreateDirectory(uploadsFolder);

                    var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    commentEntity.FileName = file.FileName;
                    commentEntity.FileUrl = $"/uploads/comments/{uniqueFileName}";
                    commentEntity.FileType = file.ContentType;
                    commentEntity.FileSize = file.Length;
                }

                await _context.Comments.InsertOneAsync(commentEntity);

                // Decrypt for response
                var decryptedText = !string.IsNullOrEmpty(commentEntity.CommentText) 
                    ? _encryptionService.Decrypt(commentEntity.CommentText) 
                    : string.Empty;

                return Json(new { 
                    success = true, 
                    message = "Comment added successfully!",
                    comment = new {
                        id = commentEntity.CommentId,
                        userName = commentEntity.UserName,
                        profilePicture = "",
                        text = decryptedText,
                        fileName = commentEntity.FileName,
                        fileUrl = commentEntity.FileUrl,
                        fileType = commentEntity.FileType,
                        createdAt = commentEntity.CreatedAt,
                        timeAgo = GetTimeAgo(commentEntity.CreatedAt)
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

                // Fetch profile pictures from users for comments
                var userIds = comments.Select(c => c.UserId).Distinct().ToList();
                var users = await _context.Users
                    .Find(u => userIds.Contains(u.UserId))
                    .ToListAsync();
                
                var userProfilePictures = users.ToDictionary(
                    u => u.UserId,
                    u => {
                        if (!string.IsNullOrEmpty(u.ProfilePictureUrl))
                        {
                            if (!u.ProfilePictureUrl.StartsWith("data:"))
                            {
                                var contentType = u.ProfilePictureContentType ?? "image/jpeg";
                                return $"data:{contentType};base64,{u.ProfilePictureUrl}";
                            }
                            return u.ProfilePictureUrl;
                        }
                        return "";
                    }
                );

                // Decrypt comment text before sending to client
                var commentsData = comments.Select(c => new {
                    id = c.CommentId,
                    userName = c.UserName,
                    profilePicture = userProfilePictures.ContainsKey(c.UserId) ? userProfilePictures[c.UserId] : "",
                    text = !string.IsNullOrEmpty(c.CommentText) ? _encryptionService.Decrypt(c.CommentText) : string.Empty,
                    fileName = c.FileName,
                    fileUrl = c.FileUrl,
                    fileType = c.FileType,
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

                // Automatically set task status to InProgress when work is submitted
                var task = await _context.Tasks.Find(t => t.TaskId == taskId).FirstOrDefaultAsync();
                if (task != null && task.TaskStatus != task_management_system.Models.TaskStatus.Completed)
                {
                    var taskFilter = Builders<AddTask>.Filter.Eq(t => t.TaskId, taskId);
                    var taskUpdate = Builders<AddTask>.Update
                        .Set(t => t.TaskStatus, task_management_system.Models.TaskStatus.InProgress)
                        .Set(t => t.UpdatedAt, DateTime.UtcNow);
                    
                    await _context.Tasks.UpdateOneAsync(taskFilter, taskUpdate);
                }

                return Json(new { 
                    success = true, 
                    message = "Work submitted successfully! Task status updated to In Progress.",
                    workLog = new {
                        id = workLog.WorkLogId,
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

                var userId = _userSessionService.GetCurrentUserId();

                if (string.IsNullOrEmpty(taskId))
                {
                    return Json(new { success = false, message = "Task ID is required" });
                }

                var workLogs = await _context.WorkLogs
                    .Find(w => w.TaskId == taskId)
                    .SortByDescending(w => w.CreatedAt)
                    .ToListAsync();

                var workLogsData = workLogs.Select(w => new {
                    id = w.WorkLogId,
                    userId = w.UserId,
                    userName = w.UserName,
                    description = w.Description,
                    fileName = w.FileName,
                    fileUrl = w.FileUrl,
                    fileSize = w.FileSize,
                    createdAt = w.CreatedAt,
                    timeAgo = GetTimeAgo(w.CreatedAt)
                }).ToList();

                // Check if current user has submitted work
                var hasSubmittedWork = workLogs.Any(w => w.UserId == userId);
                
                return Json(new { 
                    success = true, 
                    workLog = workLogsData,
                    hasSubmittedWork = hasSubmittedWork
                });
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
                    var projectExists = userProjects.Any(p => p.ProjectName.Equals(model.Project, StringComparison.OrdinalIgnoreCase));
                    
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

                // Send notification if task is assigned to someone
                if (!string.IsNullOrEmpty(model.AssignedTo))
                {
                    var currentUser = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync();
                    var assigner = currentUser != null ? $"{currentUser.FirstName} {currentUser.LastName}" : "Someone";
                    
                    await _notificationService.CreateNotificationAsync(
                        userId: model.AssignedTo,
                        title: "New Task Assigned",
                        message: $"{assigner} assigned you a new task: \"{task.TaskTitle}\"",
                        type: NotificationType.TaskAssigned,
                        link: $"/Task/Dashboard/{task.TaskId}"
                    );
                }

                return Json(new
                {
                    success = true,
                    message = "Task created successfully!",
                    task = new
                    {
                        id = task.TaskId,
                        title = task.TaskTitle,
                        description = task.Description,
                        project = task.ProjectId,
                        dueDate = task.DueDate?.ToString("MMM dd, yyyy"),
                        priority = task.Priority.ToString(),
                        status = task.TaskStatus.ToString(),
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
                        id = task.TaskId,
                        title = task.TaskTitle,
                        description = task.Description,
                        project = task.ProjectId,
                        assignedTo = task.AssignedToUserId,
                        assignedToName = task.AssignedUserName,
                        dueDate = task.DueDate?.ToString("yyyy-MM-dd"),
                        priority = task.Priority.ToString(),
                        status = task.TaskStatus.ToString(),
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
                    var projectExists = userProjects.Any(p => p.ProjectName.Equals(request.Project, StringComparison.OrdinalIgnoreCase));
                    
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
                    AssignedTo = request.AssignedTo,
                    DueDate = request.DueDate,
                    Priority = request.Priority
                };

                // Get the task before update to check if assignment changed
                var existingTask = await _taskService.GetTaskByIdAsync(request.TaskId, userId);
                var previousAssignee = existingTask?.AssignedToUserId;

                var success = await _taskService.UpdateTaskAsync(request.TaskId, model, userId);
                
                if (success)
                {
                    var task = await _taskService.GetTaskByIdAsync(request.TaskId, userId);
                    if (task == null)
                    {
                        return Json(new { success = false, message = "Task not found after update" });
                    }

                    // Send notification if task was assigned to someone new
                    if (!string.IsNullOrEmpty(request.AssignedTo) && request.AssignedTo != previousAssignee)
                    {
                        var currentUser = await _context.Users.Find(u => u.UserId == userId).FirstOrDefaultAsync();
                        var assigner = currentUser != null ? $"{currentUser.FirstName} {currentUser.LastName}" : "Someone";
                        
                        await _notificationService.CreateNotificationAsync(
                            userId: request.AssignedTo,
                            title: "New Task Assigned",
                            message: $"{assigner} assigned you a task: \"{task.TaskTitle}\"",
                            type: NotificationType.TaskAssigned,
                            link: $"/Task/Dashboard/{task.TaskId}"
                        );
                    }
                    
                    return Json(new
                    {
                        success = true,
                        message = "Task updated successfully!",
                        task = new
                        {
                            id = task.TaskId,
                            title = task.TaskTitle,
                            description = task.Description,
                            project = task.ProjectId,
                            dueDate = task.DueDate?.ToString("MMM dd, yyyy"),
                            priority = task.Priority.ToString(),
                            status = task.TaskStatus.ToString(),
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

                // Get current task state before updating
                var task = await _context.Tasks.Find(t => t.TaskId == request.TaskId).FirstOrDefaultAsync();
                if (task == null)
                {
                    return Json(new { success = false, message = "Task not found" });
                }

                bool wasCompleted = task.IsCompleted;

                var success = await _taskService.CompleteTaskAsync(request.TaskId, userId);
                
                if (success)
                {
                    string message = wasCompleted 
                        ? "Task returned to Pending. Member can resubmit work." 
                        : "Task marked as Completed!";
                    
                    return Json(new { success = true, message = message });
                }
                else
                {
                    return Json(new { success = false, message = "Failed to update task status" });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating task: {ex.Message}" });
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
            public string? AssignedTo { get; set; }
            public DateTime? DueDate { get; set; }
            public Models.TaskPriority Priority { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateTaskStatusRequest request)
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

                // Get the status label
                var statusLabel = await _context.TaskStatusLabels
                    .Find(s => s.StatusLabelId == request.StatusLabelId)
                    .FirstOrDefaultAsync();

                if (statusLabel == null)
                {
                    return Json(new { success = false, message = "Status label not found" });
                }

                // Update the task
                var update = Builders<AddTask>.Update
                    .Set(t => t.StatusLabelId, statusLabel.StatusLabelId)
                    .Set(t => t.StatusLabelName, statusLabel.LabelName)
                    .Set(t => t.StatusLabelColor, statusLabel.LabelColor)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);

                var result = await _context.Tasks.UpdateOneAsync(
                    t => t.TaskId == request.TaskId && t.UserId == userId,
                    update
                );

                if (result.ModifiedCount == 0)
                {
                    return Json(new { success = false, message = "Task not found or you don't have permission to update it" });
                }

                return Json(new { success = true, message = "Task status updated successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error: {ex.Message}" });
            }
        }

        public class UpdateTaskStatusRequest
        {
            public string TaskId { get; set; } = string.Empty;
            public string StatusLabelId { get; set; } = string.Empty;
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
