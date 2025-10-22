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
            var task = new AddTask
            {
                UserId = userId,
                Title = model.Title,
                Description = model.Description,
                Project = model.Project,
                DueDate = model.DueDate,
                Priority = model.Priority,
                Status = TaskStatus.Pending,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Tasks.InsertOneAsync(task);
            return task;
        }

        public async Task<List<AddTask>> GetUserTasksAsync(string userId)
        {
            // Get tasks created by the user
            var ownedTasks = await _context.Tasks
                .Find(t => t.UserId == userId)
                .ToListAsync();

            // Get projects where user is a member
            var memberProjects = await _context.ProjectMembers
                .Find(m => m.UserId == userId)
                .ToListAsync();

            // Get project names for member projects
            var memberProjectIds = memberProjects.Select(m => m.ProjectId).ToList();
            var projectNames = new List<string>();

            if (memberProjectIds.Any())
            {
                var projects = await _context.Projects
                    .Find(p => memberProjectIds.Contains(p.Id!))
                    .ToListAsync();
                projectNames = projects.Select(p => p.Name).ToList();
            }

            // Get tasks from projects where user is a member
            var sharedTasks = new List<AddTask>();
            if (projectNames.Any())
            {
                sharedTasks = await _context.Tasks
                    .Find(t => projectNames.Contains(t.Project!))
                    .ToListAsync();
            }

            // Combine both lists and remove duplicates
            var allTasks = ownedTasks.Concat(sharedTasks)
                .GroupBy(t => t.Id)
                .Select(g => g.First())
                .OrderByDescending(t => t.CreatedAt)
                .ToList();

            return allTasks;
        }

        public async Task<AddTask?> GetTaskByIdAsync(string taskId, string userId)
        {
            // First check if user owns the task
            var task = await _context.Tasks
                .Find(t => t.Id == taskId && t.UserId == userId)
                .FirstOrDefaultAsync();

            // If not owner, check if task belongs to a project where user is a member
            if (task == null)
            {
                task = await _context.Tasks
                    .Find(t => t.Id == taskId)
                    .FirstOrDefaultAsync();

                if (task != null && !string.IsNullOrEmpty(task.Project))
                {
                    // Check if the project exists and user is a member
                    var project = await _context.Projects
                        .Find(p => p.Name == task.Project)
                        .FirstOrDefaultAsync();

                    if (project != null)
                    {
                        var isMember = await _context.ProjectMembers
                            .Find(m => m.ProjectId == project.Id && m.UserId == userId)
                            .FirstOrDefaultAsync();

                        if (isMember == null)
                        {
                            // User is not a member, return null
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
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.Id, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );

            var update = Builders<AddTask>.Update
                .Set(t => t.IsCompleted, true)
                .Set(t => t.Status, TaskStatus.Completed)
                .Set(t => t.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Tasks.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteTaskAsync(string taskId, string userId)
        {
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.Id, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );

            var result = await _context.Tasks.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task<bool> UpdateTaskAsync(string taskId, CreateTaskViewModel model, string userId)
        {
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.Id, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );

            var update = Builders<AddTask>.Update
                .Set(t => t.Title, model.Title)
                .Set(t => t.Description, model.Description)
                .Set(t => t.Project, model.Project)
                .Set(t => t.DueDate, model.DueDate)
                .Set(t => t.Priority, model.Priority)
                .Set(t => t.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Tasks.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}
