using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;
using task_management_system.Models.ViewModels;
using TaskStatus = task_management_system.Models.TaskStatus;

namespace task_management_system.Services
{
    public interface ITaskService
    {
        Task<AddTask> CreateTaskAsync(CreateTaskViewModel model, string userId);
        Task<List<AddTask>> GetUserTasksAsync(string userId);
        Task<List<AddTask>> GetTasksByProjectNameAsync(string projectName);
        Task<AddTask?> GetTaskByIdAsync(string taskId, string userId);
        Task<bool> CompleteTaskAsync(string taskId, string userId);
        Task<bool> DeleteTaskAsync(string taskId, string userId);
        Task<bool> UpdateTaskAsync(string taskId, CreateTaskViewModel model, string userId);
    }

    public class TaskService : ITaskService
    {
        private readonly MongoDbContext _context;

        public TaskService(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<AddTask> CreateTaskAsync(CreateTaskViewModel model, string userId)
        {
            // Get assigned user's name if AssignedTo is provided
            string? assignedToName = null;
            if (!string.IsNullOrEmpty(model.AssignedTo))
            {
                var assignedUser = await _context.Users
                    .Find(u => u.UserId == model.AssignedTo)
                    .FirstOrDefaultAsync();
                
                if (assignedUser != null)
                {
                    assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                }
            }

            var task = new AddTask
            {
                UserId = userId,
                TaskTitle = model.Title,
                Description = model.Description,
                ProjectId = model.Project, // Store project name
                AssignedToUserId = model.AssignedTo,
                AssignedUserName = assignedToName,
                DueDate = model.DueDate,
                Priority = model.Priority,
                TaskStatus = TaskStatus.Pending,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Handle file attachment
            if (model.Attachment != null && model.Attachment.Length > 0)
            {
                var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "tasks");
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{model.Attachment.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.Attachment.CopyToAsync(stream);
                }

                task.AttachmentFileName = model.Attachment.FileName;
                task.AttachmentFileUrl = $"/uploads/tasks/{uniqueFileName}";
                task.AttachmentFileType = model.Attachment.ContentType;
                task.AttachmentFileSize = model.Attachment.Length;
            }

            await _context.Tasks.InsertOneAsync(task);
            return task;
        }

        public async Task<List<AddTask>> GetUserTasksAsync(string userId)
        {
            // Get tasks created by the user (user is the owner)
            var ownedTasks = await _context.Tasks
                .Find(t => t.UserId == userId)
                .ToListAsync();

            // Get projects where user is a member (not owner)
            var memberProjects = await _context.ProjectMembers
                .Find(m => m.UserId == userId)
                .ToListAsync();

            // Get project names for member projects
            var memberProjectIds = memberProjects.Select(m => m.ProjectId).ToList();
            var memberProjectNames = new List<string>();

            if (memberProjectIds.Any())
            {
                var projects = await _context.Projects
                    .Find(p => memberProjectIds.Contains(p.ProjectId!))
                    .ToListAsync();
                memberProjectNames = projects.Select(p => p.ProjectName).ToList();
            }

            // Get tasks assigned to the user from projects where they are a member
            // Members can only see tasks assigned to them, not all project tasks
            var assignedTasks = new List<AddTask>();
            if (memberProjectNames.Any())
            {
                assignedTasks = await _context.Tasks
                    .Find(t => memberProjectNames.Contains(t.ProjectId!) && t.AssignedToUserId == userId)
                    .ToListAsync();
            }

            // Combine owned tasks and assigned tasks, remove duplicates
            var allTasks = ownedTasks.Concat(assignedTasks)
                .GroupBy(t => t.TaskId)
                .Select(g => g.First())
                .OrderByDescending(t => t.CreatedAt)
                .ToList();

            return allTasks;
        }

        public async Task<List<AddTask>> GetTasksByProjectNameAsync(string projectName)
        {
            // Get all tasks for a specific project by project name
            var tasks = await _context.Tasks
                .Find(t => t.ProjectId == projectName)
                .SortByDescending(t => t.CreatedAt)
                .ToListAsync();

            return tasks;
        }

        public async Task<AddTask?> GetTaskByIdAsync(string taskId, string userId)
        {
            // First check if user owns the task
            var task = await _context.Tasks
                .Find(t => t.TaskId == taskId && t.UserId == userId)
                .FirstOrDefaultAsync();

            // If not owner, check if task is assigned to the user and belongs to a project where user is a member
            if (task == null)
            {
                task = await _context.Tasks
                    .Find(t => t.TaskId == taskId)
                    .FirstOrDefaultAsync();

                if (task != null && !string.IsNullOrEmpty(task.ProjectId))
                {
                    // Check if the project exists and user is a member
                    var project = await _context.Projects
                        .Find(p => p.ProjectName == task.ProjectId)
                        .FirstOrDefaultAsync();

                    if (project != null)
                    {
                        var isMember = await _context.ProjectMembers
                            .Find(m => m.ProjectId == project.ProjectId && m.UserId == userId)
                            .FirstOrDefaultAsync();

                        // User must be a member AND task must be assigned to them
                        if (isMember == null || task.AssignedToUserId != userId)
                        {
                            // User is not a member or task is not assigned to them
                            task = null;
                        }
                    }
                    else
                    {
                        // Project doesn't exist, return null
                        task = null;
                    }
                }
                else
                {
                    // Task has no project or doesn't exist
                    task = null;
                }
            }

            return task;
        }

        public async Task<bool> CompleteTaskAsync(string taskId, string userId)
        {
            // Allow completion if user owns the task OR if task is assigned to them
            var task = await _context.Tasks
                .Find(t => t.TaskId == taskId)
                .FirstOrDefaultAsync();

            if (task == null)
            {
                return false;
            }

            // Check if user owns the task or if it's assigned to them
            if (task.UserId != userId && task.AssignedToUserId != userId)
            {
                return false;
            }

            var filter = Builders<AddTask>.Filter.Eq(t => t.TaskId, taskId);

            UpdateDefinition<AddTask> update;

            // Toggle between completed and pending
            if (task.IsCompleted)
            {
                // Unchecking - return to Pending status
                update = Builders<AddTask>.Update
                    .Set(t => t.IsCompleted, false)
                    .Set(t => t.TaskStatus, TaskStatus.Pending)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);
            }
            else
            {
                // Checking - mark as Completed
                update = Builders<AddTask>.Update
                    .Set(t => t.IsCompleted, true)
                    .Set(t => t.TaskStatus, TaskStatus.Completed)
                    .Set(t => t.UpdatedAt, DateTime.UtcNow);
            }

            var result = await _context.Tasks.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteTaskAsync(string taskId, string userId)
        {
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.TaskId, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );

            var result = await _context.Tasks.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task<bool> UpdateTaskAsync(string taskId, CreateTaskViewModel model, string userId)
        {
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.TaskId, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );

            // Get assigned user's name if AssignedTo is provided
            string? assignedToName = null;
            if (!string.IsNullOrEmpty(model.AssignedTo))
            {
                var assignedUser = await _context.Users
                    .Find(u => u.UserId == model.AssignedTo)
                    .FirstOrDefaultAsync();
                
                if (assignedUser != null)
                {
                    assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                }
            }

            var update = Builders<AddTask>.Update
                .Set(t => t.TaskTitle, model.Title)
                .Set(t => t.Description, model.Description)
                .Set(t => t.ProjectId, model.Project) // Store project name
                .Set(t => t.AssignedToUserId, model.AssignedTo)
                .Set(t => t.AssignedUserName, assignedToName)
                .Set(t => t.DueDate, model.DueDate)
                .Set(t => t.Priority, model.Priority)
                .Set(t => t.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Tasks.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}
