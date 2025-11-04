using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_project_members")]
    public class ProjectMember
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("member_id")]
        public string? MemberId { get; set; }

        [BsonElement("project_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProjectId { get; set; } = string.Empty;

        [BsonElement("user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("user_email")]
        public string UserEmail { get; set; } = string.Empty;

        [BsonElement("user_name")]
        public string UserName { get; set; } = string.Empty;

        [BsonElement("role")]
        public ProjectRole Role { get; set; } = ProjectRole.Viewer;

        [BsonElement("joined_at")]
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("added_by_user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AddedByUserId { get; set; } = string.Empty;
    }
}
