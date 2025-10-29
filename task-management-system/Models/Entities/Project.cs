using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class Project
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("status")]
        public ProjectStatus Status { get; set; } = ProjectStatus.Active;

        [BsonElement("priority")]
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;

        [BsonElement("startDate")]
        public DateTime? StartDate { get; set; }

        [BsonElement("dueDate")]
        public DateTime? DueDate { get; set; }

        [BsonElement("progress")]
        public int Progress { get; set; } = 0;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum ProjectStatus
    {
        Planning,
        Active,
        OnHold,
        Completed,
        Cancelled
    }

    public enum ProjectPriority
    {
        Low,
        Medium,
        High
    }
}
