using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class AddTask
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("project")]
        public string? Project { get; set; }

        [BsonElement("dueDate")]
        public DateTime? DueDate { get; set; }

        [BsonElement("priority")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [BsonElement("status")]
        public TaskStatus Status { get; set; } = TaskStatus.Pending;

        [BsonElement("isCompleted")]
        public bool IsCompleted { get; set; } = false;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
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
        Completed
    }
}
