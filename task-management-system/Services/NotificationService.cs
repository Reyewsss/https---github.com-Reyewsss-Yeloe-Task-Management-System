using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface INotificationService
    {
        Task CreateNotificationAsync(string userId, string title, string message, NotificationType type, string? link = null);
        Task<List<Notification>> GetUserNotificationsAsync(string userId, int limit = 10);
        Task<int> GetUnreadCountAsync(string userId);
        Task MarkAsReadAsync(string notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);
        Task CheckAndSendDeadlineNotificationsAsync();
    }

    public class NotificationService : INotificationService
    {
        private readonly MongoDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(MongoDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task CreateNotificationAsync(string userId, string title, string message, NotificationType type, string? link = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    Link = link,
                    CreatedAt = DateTime.UtcNow
                };

                await _context.Notifications.InsertOneAsync(notification);
                _logger.LogInformation("Notification created for user {UserId}: {Title}", userId, title);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create notification for user {UserId}", userId);
            }
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(string userId, int limit = 10)
        {
            try
            {
                return await _context.Notifications
                    .Find(n => n.UserId == userId)
                    .SortByDescending(n => n.CreatedAt)
                    .Limit(limit)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get notifications for user {UserId}", userId);
                return new List<Notification>();
            }
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            try
            {
                return (int)await _context.Notifications
                    .CountDocumentsAsync(n => n.UserId == userId && !n.IsRead);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get unread count for user {UserId}", userId);
                return 0;
            }
        }

        public async Task MarkAsReadAsync(string notificationId, string userId)
        {
            try
            {
                var filter = Builders<Notification>.Filter.And(
                    Builders<Notification>.Filter.Eq(n => n.Id, notificationId),
                    Builders<Notification>.Filter.Eq(n => n.UserId, userId)
                );

                var update = Builders<Notification>.Update
                    .Set(n => n.IsRead, true);

                await _context.Notifications.UpdateOneAsync(filter, update);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to mark notification {NotificationId} as read", notificationId);
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            try
            {
                var filter = Builders<Notification>.Filter.And(
                    Builders<Notification>.Filter.Eq(n => n.UserId, userId),
                    Builders<Notification>.Filter.Eq(n => n.IsRead, false)
                );

                var update = Builders<Notification>.Update
                    .Set(n => n.IsRead, true);

                await _context.Notifications.UpdateManyAsync(filter, update);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to mark all notifications as read for user {UserId}", userId);
            }
        }

        public async Task CheckAndSendDeadlineNotificationsAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var twelveHoursFromNow = now.AddHours(12);
                var oneHourFromNow = now.AddHours(1);

                // Get all incomplete tasks with due dates
                var tasksWithDeadlines = await _context.Tasks
                    .Find(t => t.DueDate.HasValue && !t.IsCompleted)
                    .ToListAsync();

                foreach (var task in tasksWithDeadlines)
                {
                    if (!task.DueDate.HasValue) continue;

                    var dueDate = task.DueDate.Value;
                    var timeDifference = dueDate - now;

                    // Check if we need to send 12-hour notification
                    if (timeDifference.TotalHours <= 12 && timeDifference.TotalHours > 11.5)
                    {
                        await CreateNotificationAsync(
                            task.UserId,
                            "⏰ Task Deadline Reminder",
                            $"'{task.Title}' is due in 12 hours - {dueDate:MMM dd, yyyy 'at' hh:mm tt}",
                            NotificationType.Reminder,
                            $"/Task/Dashboard/{task.Id}"
                        );
                        _logger.LogInformation("Sent 12-hour deadline notification for task {TaskId}", task.Id);
                    }
                    // Check if we need to send 1-hour notification
                    else if (timeDifference.TotalHours <= 1 && timeDifference.TotalMinutes > 55)
                    {
                        await CreateNotificationAsync(
                            task.UserId,
                            "🚨 Urgent: Task Due Soon",
                            $"'{task.Title}' is due in 1 hour - {dueDate:MMM dd, yyyy 'at' hh:mm tt}",
                            NotificationType.Warning,
                            $"/Task/Dashboard/{task.Id}"
                        );
                        _logger.LogInformation("Sent 1-hour deadline notification for task {TaskId}", task.Id);
                    }
                    // Check if task is overdue
                    else if (timeDifference.TotalHours < 0 && timeDifference.TotalHours > -1)
                    {
                        await CreateNotificationAsync(
                            task.UserId,
                            "❌ Task Overdue",
                            $"'{task.Title}' was due at {dueDate:MMM dd, yyyy 'at' hh:mm tt}",
                            NotificationType.Alert,
                            $"/Task/Dashboard/{task.Id}"
                        );
                        _logger.LogInformation("Sent overdue notification for task {TaskId}", task.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check and send deadline notifications");
            }
        }
    }
}