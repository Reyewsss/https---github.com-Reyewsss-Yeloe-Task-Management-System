using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty; 

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [BsonElement("lastName")]
        public string LastName { get; set; } = string.Empty;

        [BsonElement("isEmailVerified")]
        public bool IsEmailVerified { get; set; } = false;

        [BsonElement("verificationCode")]
        public string? VerificationCode { get; set; }

        [BsonElement("verificationCodeExpiry")]
        public DateTime? VerificationCodeExpiry { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}