using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("userActivities")]
    public class UserActivity
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("activity_type")]
        public string ActivityType { get; set; } = string.Empty;

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("ip_address")]
        public string? IpAddress { get; set; }

        [BsonElement("user_agent")]
        public string? UserAgent { get; set; }

        [BsonElement("metadata")]
        public Dictionary<string, string>? Metadata { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public static class ActivityTypes
    {
        public const string Login = "Login";
        public const string Logout = "Logout";
        public const string ProfileUpdate = "ProfileUpdate";
        public const string PasswordChange = "PasswordChange";
        public const string ProfilePictureUpdate = "ProfilePictureUpdate";
        public const string EmailVerification = "EmailVerification";
        public const string PasswordReset = "PasswordReset";
        public const string TaskCreated = "TaskCreated";
        public const string TaskUpdated = "TaskUpdated";
        public const string TaskDeleted = "TaskDeleted";
        public const string ProjectCreated = "ProjectCreated";
        public const string ProjectUpdated = "ProjectUpdated";
        public const string ProjectDeleted = "ProjectDeleted";
        public const string CommentAdded = "CommentAdded";
        public const string WorkSubmitted = "WorkSubmitted";
    }
}
