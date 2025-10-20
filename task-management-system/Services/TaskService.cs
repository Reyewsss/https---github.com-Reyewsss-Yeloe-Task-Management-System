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
            var filter = Builders<AddTask>.Filter.Eq(t => t.UserId, userId);
            var tasks = await _context.Tasks.Find(filter)
                .SortByDescending(t => t.CreatedAt)
                .ToListAsync();
            return tasks;
        }

        public async Task<AddTask?> GetTaskByIdAsync(string taskId, string userId)
        {
            var filter = Builders<AddTask>.Filter.And(
                Builders<AddTask>.Filter.Eq(t => t.Id, taskId),
                Builders<AddTask>.Filter.Eq(t => t.UserId, userId)
            );
            return await _context.Tasks.Find(filter).FirstOrDefaultAsync();
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
