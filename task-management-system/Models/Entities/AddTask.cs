using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_tasks")]
    public class AddTask
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("task_id")]
        public string? TaskId { get; set; }

        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("task_title")]
        public string TaskTitle { get; set; } = string.Empty;

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("project_id")]
        public string? ProjectId { get; set; }

        [BsonElement("assigned_to_user_id")]
        public string? AssignedToUserId { get; set; }

        [BsonElement("assigned_user_name")]
        public string? AssignedUserName { get; set; }

        [BsonElement("due_date")]
        public DateTime? DueDate { get; set; }

        [BsonElement("priority")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [BsonElement("task_status")]
        public TaskStatus TaskStatus { get; set; } = TaskStatus.Pending;

        [BsonElement("status_label_id")]
        public string? StatusLabelId { get; set; }

        [BsonElement("status_label_name")]
        public string? StatusLabelName { get; set; }

        [BsonElement("status_label_color")]
        public string? StatusLabelColor { get; set; }

        [BsonElement("is_completed")]
        public bool IsCompleted { get; set; } = false;

        [BsonElement("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("attachment_file_name")]
        public string? AttachmentFileName { get; set; }

        [BsonElement("attachment_file_url")]
        public string? AttachmentFileUrl { get; set; }

        [BsonElement("attachment_file_type")]
        public string? AttachmentFileType { get; set; }

        [BsonElement("attachment_file_size")]
        public long? AttachmentFileSize { get; set; }
    }

    public enum TaskPriority
    {
        Low,
        Medium,
        High
    }

    public enum TaskStatus
    {
        Pending,
        InProgress,
        Review,
        Completed
    }
}
