using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class ProjectMember
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("projectId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProjectId { get; set; } = string.Empty;

        [BsonElement("userId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("userEmail")]
        public string UserEmail { get; set; } = string.Empty;

        [BsonElement("userName")]
        public string UserName { get; set; } = string.Empty;

        [BsonElement("role")]
        public ProjectRole Role { get; set; } = ProjectRole.Viewer;

        [BsonElement("joinedAt")]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("addedByUserId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AddedByUserId { get; set; } = string.Empty;
    }
}
