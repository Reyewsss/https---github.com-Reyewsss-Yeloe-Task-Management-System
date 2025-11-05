using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_projects")]
    public class Project
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("project_id")]
        public string? ProjectId { get; set; }

        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("project_name")]
        public string ProjectName { get; set; } = string.Empty;

        [BsonElement("description")]
        public string? Description { get; set; }

        [BsonElement("project_status")]
        public ProjectStatus ProjectStatus { get; set; } = ProjectStatus.Active;

        [BsonElement("priority")]
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;

        [BsonElement("start_date")]
        public DateTime? StartDate { get; set; }

        [BsonElement("due_date")]
        public DateTime? DueDate { get; set; }

        [BsonElement("progress_percentage")]
        public int ProgressPercentage { get; set; } = 0;

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Non-persisted properties for display purposes
        [BsonIgnore]
        public string? CreatedBy => UserId; // Alias for UserId to maintain compatibility

        [BsonIgnore]
        public string? CreatedByName { get; set; }

        [BsonIgnore]
        public string? CreatedByProfilePicture { get; set; }
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
