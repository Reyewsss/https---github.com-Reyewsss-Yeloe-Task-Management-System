using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_comments")]
    public class Comment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("comment_id")]
        public string? CommentId { get; set; }

        [BsonElement("task_id")]
        public string TaskId { get; set; } = string.Empty;

        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("user_name")]
        public string UserName { get; set; } = string.Empty;

        [BsonElement("comment_text")]
        public string CommentText { get; set; } = string.Empty;

        [BsonElement("file_name")]
        public string? FileName { get; set; }

        [BsonElement("file_url")]
        public string? FileUrl { get; set; }

        [BsonElement("file_type")]
        public string? FileType { get; set; }

        [BsonElement("file_size")]
        public long? FileSize { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
