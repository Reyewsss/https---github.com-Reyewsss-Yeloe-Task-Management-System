using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;
using task_management_system.Models.ViewModels;

namespace task_management_system.Services
{
    public interface IProjectService
    {
        Task<Project> CreateProjectAsync(CreateProjectViewModel model, string userId);
        Task<List<Project>> GetUserProjectsAsync(string userId);
        Task<Project?> GetProjectByIdAsync(string projectId, string userId);
        Task<bool> UpdateProjectAsync(string projectId, CreateProjectViewModel model, string userId);
        Task<bool> DeleteProjectAsync(string projectId, string userId);
        Task<bool> UpdateProgressAsync(string projectId, int progress, string userId);
    }

    public class ProjectService : IProjectService
    {
        private readonly MongoDbContext _context;

        public ProjectService(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<Project> CreateProjectAsync(CreateProjectViewModel model, string userId)
        {
            var project = new Project
            {
                UserId = userId,
                Name = model.Name,
                Description = model.Description,
                Status = model.Status,
                Priority = model.Priority,
                StartDate = model.StartDate,
                DueDate = model.DueDate,
                Progress = model.Progress,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Projects.InsertOneAsync(project);
            return project;
        }

        public async Task<List<Project>> GetUserProjectsAsync(string userId)
        {
            var filter = Builders<Project>.Filter.Eq(p => p.UserId, userId);
            var projects = await _context.Projects.Find(filter)
                .SortByDescending(p => p.CreatedAt)
                .ToListAsync();
            return projects;
        }

        public async Task<Project?> GetProjectByIdAsync(string projectId, string userId)
        {
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, projectId),
                Builders<Project>.Filter.Eq(p => p.UserId, userId)
            );
            return await _context.Projects.Find(filter).FirstOrDefaultAsync();
        }

        public async Task<bool> UpdateProjectAsync(string projectId, CreateProjectViewModel model, string userId)
        {
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, projectId),
                Builders<Project>.Filter.Eq(p => p.UserId, userId)
            );

            var update = Builders<Project>.Update
                .Set(p => p.Name, model.Name)
                .Set(p => p.Description, model.Description)
                .Set(p => p.Status, model.Status)
                .Set(p => p.Priority, model.Priority)
                .Set(p => p.StartDate, model.StartDate)
                .Set(p => p.DueDate, model.DueDate)
                .Set(p => p.Progress, model.Progress)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Projects.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteProjectAsync(string projectId, string userId)
        {
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, projectId),
                Builders<Project>.Filter.Eq(p => p.UserId, userId)
            );

            var result = await _context.Projects.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public async Task<bool> UpdateProgressAsync(string projectId, int progress, string userId)
        {
            var filter = Builders<Project>.Filter.And(
                Builders<Project>.Filter.Eq(p => p.Id, projectId),
                Builders<Project>.Filter.Eq(p => p.UserId, userId)
            );

            var update = Builders<Project>.Update
                .Set(p => p.Progress, progress)
                .Set(p => p.UpdatedAt, DateTime.UtcNow);

            var result = await _context.Projects.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}
