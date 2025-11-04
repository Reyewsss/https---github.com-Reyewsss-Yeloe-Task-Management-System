using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_email_verification_tokens")]
    public class EmailVerificationToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("token_id")]
        public string TokenId { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("verification_code")]
        public string VerificationCode { get; set; } = string.Empty;

        [BsonElement("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("is_used")]
        public bool IsUsed { get; set; } = false;

        [BsonElement("used_at")]
        public DateTime? UsedAt { get; set; }
    }
}