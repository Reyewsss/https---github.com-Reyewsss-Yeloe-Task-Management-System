using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_password_reset_tokens")]
    public class PasswordResetToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("token_id")]
        public string TokenId { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("token_hash")]
        public string TokenHash { get; set; } = string.Empty;

        [BsonElement("expires_at")]
        public DateTime ExpiresAt { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("used_at")]
        public DateTime? UsedAt { get; set; }
    }
}
