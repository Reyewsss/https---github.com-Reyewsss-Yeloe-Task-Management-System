using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_notifications")]
    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("notification_id")]
        public string NotificationId { get; set; } = string.Empty;

        [BsonElement("user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("message")]
        public string Message { get; set; } = string.Empty;

        [BsonElement("notification_type")]
        public NotificationType NotificationType { get; set; }

        [BsonElement("link")]
        public string? Link { get; set; }

        [BsonElement("is_read")]
        public bool IsRead { get; set; } = false;

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("read_at")]
        public DateTime? ReadAt { get; set; }
    }

    public enum NotificationType
    {
        AccountCreated,
        TaskAssigned,
        ProjectDeadline,
        TeamMemberJoined,
        SystemUpdate,
        PasswordReset, 
        General,
        Reminder,
        Warning,
        Alert
    }
}