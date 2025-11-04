using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_user_preferences")]
    public class UserPreferences
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("email_notifications")]
        public bool EmailNotifications { get; set; } = true;

        [BsonElement("task_reminders")]
        public bool TaskReminders { get; set; } = true;

        [BsonElement("weekly_summary")]
        public bool WeeklySummary { get; set; } = false;

        [BsonElement("dark_mode")]
        public bool DarkMode { get; set; } = false;

        [BsonElement("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
