using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface ITaskStatusLabelService
    {
        Task<List<TaskStatusLabel>> GetUserStatusLabelsAsync(string userId, string? projectId = null);
        Task<TaskStatusLabel?> GetStatusLabelByIdAsync(string statusLabelId);
        Task<(bool success, string message, TaskStatusLabel? statusLabel)> CreateStatusLabelAsync(string userId, string labelName, string labelColor, string? projectId = null);
        Task<(bool success, string message)> UpdateStatusLabelAsync(string statusLabelId, string labelName, string labelColor);
        Task<(bool success, string message)> DeleteStatusLabelAsync(string statusLabelId, string userId);
        Task<(bool success, string message)> InitializeDefaultStatusLabelsAsync(string userId);
        Task<(bool success, string message)> ReorderStatusLabelsAsync(List<string> statusLabelIds);
    }

    public class TaskStatusLabelService : ITaskStatusLabelService
    {
        private readonly MongoDbContext _context;

        public TaskStatusLabelService(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<List<TaskStatusLabel>> GetUserStatusLabelsAsync(string userId, string? projectId = null)
        {
            try
            {
                var filter = Builders<TaskStatusLabel>.Filter.Eq(s => s.UserId, userId);
                
                if (!string.IsNullOrEmpty(projectId))
                {
                    var projectFilter = Builders<TaskStatusLabel>.Filter.Eq(s => s.ProjectId, projectId);
                    filter = Builders<TaskStatusLabel>.Filter.And(filter, projectFilter);
                }
                else
                {
                    // Get only global labels (not project-specific)
                    var nullProjectFilter = Builders<TaskStatusLabel>.Filter.Eq(s => s.ProjectId, null);
                    filter = Builders<TaskStatusLabel>.Filter.And(filter, nullProjectFilter);
                }

                return await _context.TaskStatusLabels
                    .Find(filter)
                    .SortBy(s => s.DisplayOrder)
                    .ToListAsync();
            }
            catch (Exception)
            {
                return new List<TaskStatusLabel>();
            }
        }

        public async Task<TaskStatusLabel?> GetStatusLabelByIdAsync(string statusLabelId)
        {
            try
            {
                return await _context.TaskStatusLabels
                    .Find(s => s.StatusLabelId == statusLabelId)
                    .FirstOrDefaultAsync();
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<(bool success, string message, TaskStatusLabel? statusLabel)> CreateStatusLabelAsync(
            string userId, string labelName, string labelColor, string? projectId = null)
        {
            try
            {
                // Check if label with same name already exists for this user/project
                var filter = Builders<TaskStatusLabel>.Filter.And(
                    Builders<TaskStatusLabel>.Filter.Eq(s => s.UserId, userId),
                    Builders<TaskStatusLabel>.Filter.Eq(s => s.LabelName, labelName),
                    Builders<TaskStatusLabel>.Filter.Eq(s => s.ProjectId, projectId)
                );

                var existing = await _context.TaskStatusLabels.Find(filter).FirstOrDefaultAsync();
                if (existing != null)
                    return (false, "A status label with this name already exists.", null);

                // Get the highest display order
                var maxOrderFilter = Builders<TaskStatusLabel>.Filter.And(
                    Builders<TaskStatusLabel>.Filter.Eq(s => s.UserId, userId),
                    Builders<TaskStatusLabel>.Filter.Eq(s => s.ProjectId, projectId)
                );
                var labels = await _context.TaskStatusLabels.Find(maxOrderFilter).ToListAsync();
                var nextOrder = labels.Any() ? labels.Max(l => l.DisplayOrder) + 1 : 0;

                var statusLabel = new TaskStatusLabel
                {
                    UserId = userId,
                    ProjectId = projectId,
                    LabelName = labelName,
                    LabelColor = labelColor,
                    DisplayOrder = nextOrder,
                    IsDefault = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.TaskStatusLabels.InsertOneAsync(statusLabel);
                return (true, "Status label created successfully.", statusLabel);
            }
            catch (Exception ex)
            {
                return (false, $"Failed to create status label: {ex.Message}", null);
            }
        }

        public async Task<(bool success, string message)> UpdateStatusLabelAsync(
            string statusLabelId, string labelName, string labelColor)
        {
            try
            {
                var update = Builders<TaskStatusLabel>.Update
                    .Set(s => s.LabelName, labelName)
                    .Set(s => s.LabelColor, labelColor)
                    .Set(s => s.UpdatedAt, DateTime.UtcNow);

                var result = await _context.TaskStatusLabels.UpdateOneAsync(
                    s => s.StatusLabelId == statusLabelId,
                    update
                );

                if (result.ModifiedCount == 0)
                    return (false, "Status label not found.");

                // Update all tasks using this status label
                var taskUpdate = Builders<AddTask>.Update
                    .Set(t => t.StatusLabelName, labelName)
                    .Set(t => t.StatusLabelColor, labelColor);

                await _context.Tasks.UpdateManyAsync(
                    t => t.StatusLabelId == statusLabelId,
                    taskUpdate
                );

                return (true, "Status label updated successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to update status label: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> DeleteStatusLabelAsync(string statusLabelId, string userId)
        {
            try
            {
                var statusLabel = await GetStatusLabelByIdAsync(statusLabelId);
                if (statusLabel == null)
                    return (false, "Status label not found.");

                if (statusLabel.UserId != userId)
                    return (false, "Unauthorized to delete this status label.");

                if (statusLabel.IsDefault)
                    return (false, "Cannot delete default status labels.");

                // Check if any tasks are using this status
                var tasksUsingStatus = await _context.Tasks
                    .Find(t => t.StatusLabelId == statusLabelId)
                    .CountDocumentsAsync();

                if (tasksUsingStatus > 0)
                    return (false, $"Cannot delete status label. {tasksUsingStatus} task(s) are using it.");

                await _context.TaskStatusLabels.DeleteOneAsync(s => s.StatusLabelId == statusLabelId);
                return (true, "Status label deleted successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to delete status label: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> InitializeDefaultStatusLabelsAsync(string userId)
        {
            try
            {
                // Check if user already has default labels
                var existing = await _context.TaskStatusLabels
                    .Find(s => s.UserId == userId && s.ProjectId == null && s.IsDefault)
                    .AnyAsync();

                if (existing)
                    return (true, "Default status labels already exist.");

                // Create default status labels
                var defaultLabels = new List<TaskStatusLabel>
                {
                    new TaskStatusLabel
                    {
                        UserId = userId,
                        LabelName = "To Do",
                        LabelColor = "#6c757d",
                        DisplayOrder = 0,
                        IsDefault = true
                    },
                    new TaskStatusLabel
                    {
                        UserId = userId,
                        LabelName = "In Progress",
                        LabelColor = "#0d6efd",
                        DisplayOrder = 1,
                        IsDefault = true
                    },
                    new TaskStatusLabel
                    {
                        UserId = userId,
                        LabelName = "Review",
                        LabelColor = "#ffc107",
                        DisplayOrder = 2,
                        IsDefault = true
                    },
                    new TaskStatusLabel
                    {
                        UserId = userId,
                        LabelName = "Completed",
                        LabelColor = "#198754",
                        DisplayOrder = 3,
                        IsDefault = true
                    }
                };

                await _context.TaskStatusLabels.InsertManyAsync(defaultLabels);
                return (true, "Default status labels initialized successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to initialize default status labels: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> ReorderStatusLabelsAsync(List<string> statusLabelIds)
        {
            try
            {
                for (int i = 0; i < statusLabelIds.Count; i++)
                {
                    var update = Builders<TaskStatusLabel>.Update
                        .Set(s => s.DisplayOrder, i)
                        .Set(s => s.UpdatedAt, DateTime.UtcNow);

                    await _context.TaskStatusLabels.UpdateOneAsync(
                        s => s.StatusLabelId == statusLabelIds[i],
                        update
                    );
                }

                return (true, "Status labels reordered successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to reorder status labels: {ex.Message}");
            }
        }
    }
}
