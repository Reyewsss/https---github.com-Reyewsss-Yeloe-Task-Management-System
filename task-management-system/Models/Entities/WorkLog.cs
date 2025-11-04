using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_work_logs")]
    public class WorkLog
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("work_log_id")]
        public string? WorkLogId { get; set; }

        [BsonElement("task_id")]
        public string TaskId { get; set; } = string.Empty;

        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("user_name")]
        public string UserName { get; set; } = string.Empty;

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("file_name")]
        public string? FileName { get; set; }

        [BsonElement("file_url")]
        public string? FileUrl { get; set; }

        [BsonElement("file_size")]
        public long? FileSize { get; set; }

        [BsonElement("file_content_type")]
        public string? FileContentType { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
