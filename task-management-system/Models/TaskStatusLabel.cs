using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_task_status_labels")]
    public class TaskStatusLabel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("status_label_id")]
        public string? StatusLabelId { get; set; }

        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("project_id")]
        public string? ProjectId { get; set; }

        [BsonElement("label_name")]
        public string LabelName { get; set; } = string.Empty;

        [BsonElement("label_color")]
        public string LabelColor { get; set; } = "#6c757d"; // Default gray

        [BsonElement("display_order")]
        public int DisplayOrder { get; set; } = 0;

        [BsonElement("is_default")]
        public bool IsDefault { get; set; } = false;

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
