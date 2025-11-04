using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_users")]
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("user_id")]
        public string UserId { get; set; } = string.Empty; 

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("password_hash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("first_name")]
        public string FirstName { get; set; } = string.Empty;

        [BsonElement("last_name")]
        public string LastName { get; set; } = string.Empty;

        [BsonElement("birth_date")]
        public DateTime? BirthDate { get; set; }

        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;

        [BsonElement("email_verified_at")]
        public DateTime? EmailVerifiedAt { get; set; }

        [BsonElement("email_verification_code")]
        public string? EmailVerificationCode { get; set; }

        [BsonElement("email_verification_expires_at")]
        public DateTime? EmailVerificationExpiresAt { get; set; }

        [BsonElement("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("profile_picture_url")]
        public string? ProfilePictureUrl { get; set; } // Stores base64 encoded image data

        [BsonElement("profile_picture_content_type")]
        public string? ProfilePictureContentType { get; set; } // Stores MIME type (e.g., "image/jpeg")

        // Computed property for Age (not stored in DB)
        [BsonIgnore]
        public int Age
        {
            get
            {
                if (!BirthDate.HasValue)
                    return 0;

                var today = DateTime.Today;
                var age = today.Year - BirthDate.Value.Year;
                if (BirthDate.Value.Date > today.AddYears(-age))
                    age--;
                return age;
            }
        }

        // Helper property to check if email is verified
        [BsonIgnore]
        public bool IsEmailVerified => EmailVerifiedAt.HasValue;
    }

    // Attribute for collection name (optional, for documentation)
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public class BsonCollectionAttribute : Attribute
    {
        public string CollectionName { get; }

        public BsonCollectionAttribute(string collectionName)
        {
            CollectionName = collectionName;
        }
    }
}