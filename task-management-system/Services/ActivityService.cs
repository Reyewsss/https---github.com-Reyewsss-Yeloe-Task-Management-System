using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IActivityService
    {
        Task LogActivityAsync(string userId, string activityType, string description, string? ipAddress = null, string? userAgent = null, Dictionary<string, string>? metadata = null);
        Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int limit = 50);
        Task<int> GetActivityCountAsync(string userId);
    }

    public class ActivityService : IActivityService
    {
        private readonly MongoDbContext _context;

        public ActivityService(MongoDbContext context)
        {
            _context = context;
        }

        public async Task LogActivityAsync(string userId, string activityType, string description, string? ipAddress = null, string? userAgent = null, Dictionary<string, string>? metadata = null)
        {
            try
            {
                var activity = new UserActivity
                {
                    UserId = userId,
                    ActivityType = activityType,
                    Description = description,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Metadata = metadata,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.UserActivities.InsertOneAsync(activity);
            }
            catch (Exception)
            {
                // Log error but don't throw - activity logging shouldn't break the application
            }
        }

        public async Task<List<UserActivity>> GetUserActivitiesAsync(string userId, int limit = 50)
        {
            return await _context.UserActivities
                .Find(a => a.UserId == userId)
                .SortByDescending(a => a.CreatedAt)
                .Limit(limit)
                .ToListAsync();
        }

        public async Task<int> GetActivityCountAsync(string userId)
        {
            return (int)await _context.UserActivities
                .CountDocumentsAsync(a => a.UserId == userId);
        }
    }
}
