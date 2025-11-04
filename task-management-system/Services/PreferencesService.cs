using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IPreferencesService
    {
        Task<UserPreferences> GetUserPreferencesAsync(string userId);
        Task<(bool success, string message)> UpdateUserPreferencesAsync(string userId, UserPreferences preferences);
    }

    public class PreferencesService : IPreferencesService
    {
        private readonly MongoDbContext _context;

        public PreferencesService(MongoDbContext context)
        {
            _context = context;
        }

        public async Task<UserPreferences> GetUserPreferencesAsync(string userId)
        {
            var preferences = await _context.UserPreferences
                .Find(p => p.UserId == userId)
                .FirstOrDefaultAsync();

            // If no preferences exist, create default ones
            if (preferences == null)
            {
                preferences = new UserPreferences
                {
                    UserId = userId,
                    EmailNotifications = true,
                    TaskReminders = true,
                    WeeklySummary = false,
                    DarkMode = false,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.UserPreferences.InsertOneAsync(preferences);
            }

            return preferences;
        }

        public async Task<(bool success, string message)> UpdateUserPreferencesAsync(string userId, UserPreferences preferences)
        {
            try
            {
                var existingPreferences = await _context.UserPreferences
                    .Find(p => p.UserId == userId)
                    .FirstOrDefaultAsync();

                preferences.UserId = userId;
                preferences.UpdatedAt = DateTime.UtcNow;

                if (existingPreferences == null)
                {
                    // Create new preferences
                    await _context.UserPreferences.InsertOneAsync(preferences);
                }
                else
                {
                    // Update existing preferences
                    preferences.Id = existingPreferences.Id;
                    var update = Builders<UserPreferences>.Update
                        .Set(p => p.EmailNotifications, preferences.EmailNotifications)
                        .Set(p => p.TaskReminders, preferences.TaskReminders)
                        .Set(p => p.WeeklySummary, preferences.WeeklySummary)
                        .Set(p => p.DarkMode, preferences.DarkMode)
                        .Set(p => p.UpdatedAt, DateTime.UtcNow);

                    await _context.UserPreferences.UpdateOneAsync(p => p.UserId == userId, update);
                }

                return (true, "Preferences updated successfully");
            }
            catch (Exception ex)
            {
                return (false, $"Error updating preferences: {ex.Message}");
            }
        }
    }
}
