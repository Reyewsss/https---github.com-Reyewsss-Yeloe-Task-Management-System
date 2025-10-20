using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class PasswordResetToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("token")]
        public string Token { get; set; } = string.Empty;

        [BsonElement("expiresAt")]
        public DateTime ExpiresAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }
    }
}
