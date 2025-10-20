using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IDatabaseMigrationService
    {
        Task AddUserIdToExistingProjects(string defaultUserId);
        Task ValidateUserDataIntegrity();
    }

    public class DatabaseMigrationService : IDatabaseMigrationService
    {
        private readonly MongoDbContext _context;
        private readonly ILogger<DatabaseMigrationService> _logger;

        public DatabaseMigrationService(MongoDbContext context, ILogger<DatabaseMigrationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Adds UserId to existing projects that don't have one
        /// </summary>
        /// <param name="defaultUserId">The default user ID to assign to projects without a UserId</param>
        public async Task AddUserIdToExistingProjects(string defaultUserId)
        {
            try
            {
                // Find projects without UserId field
                var filter = Builders<Project>.Filter.Or(
                    Builders<Project>.Filter.Eq(p => p.UserId, null),
                    Builders<Project>.Filter.Eq(p => p.UserId, "")
                );

                var update = Builders<Project>.Update.Set(p => p.UserId, defaultUserId);

                var result = await _context.Projects.UpdateManyAsync(filter, update);

                _logger.LogInformation("Updated {Count} projects with default UserId {UserId}", 
                    result.ModifiedCount, defaultUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to migrate existing projects");
                throw;
            }
        }

        /// <summary>
        /// Validates that all projects and tasks have valid UserIds
        /// </summary>
        public async Task ValidateUserDataIntegrity()
        {
            try
            {
                // Check projects without UserId
                var projectsWithoutUserId = await _context.Projects
                    .Find(p => p.UserId == null || p.UserId == "")
                    .CountDocumentsAsync();

                // Check tasks without UserId
                var tasksWithoutUserId = await _context.Tasks
                    .Find(t => t.UserId == null || t.UserId == "")
                    .CountDocumentsAsync();

                _logger.LogInformation("Data integrity check: {ProjectsWithoutUserId} projects and {TasksWithoutUserId} tasks without UserId", 
                    projectsWithoutUserId, tasksWithoutUserId);

                if (projectsWithoutUserId > 0 || tasksWithoutUserId > 0)
                {
                    _logger.LogWarning("Data integrity issues found. Consider running migration scripts.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate data integrity");
                throw;
            }
        }
    }
}
