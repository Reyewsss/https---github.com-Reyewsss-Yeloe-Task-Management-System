using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    public class ProjectInvitation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("projectId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProjectId { get; set; } = string.Empty;

        [BsonElement("projectName")]
        public string ProjectName { get; set; } = string.Empty;

        [BsonElement("invitedByUserId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string InvitedByUserId { get; set; } = string.Empty;

        [BsonElement("invitedByUserName")]
        public string InvitedByUserName { get; set; } = string.Empty;

        [BsonElement("invitedUserEmail")]
        public string InvitedUserEmail { get; set; } = string.Empty;

        [BsonElement("invitedUserId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? InvitedUserId { get; set; }

        [BsonElement("status")]
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

        [BsonElement("role")]
        public ProjectRole Role { get; set; } = ProjectRole.Viewer;

        [BsonElement("invitedAt")]
        public DateTime InvitedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("respondedAt")]
        public DateTime? RespondedAt { get; set; }

        [BsonElement("expiresAt")]
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    }

    public enum InvitationStatus
    {
        Pending = 0,
        Accepted = 1,
        Declined = 2,
        Expired = 3
    }

    public enum ProjectRole
    {
        Viewer = 0,      // Can only view and submit
        Contributor = 1, // Can create and edit (future feature)
        Admin = 2,       // Can manage members (future feature)
        Owner = 3        // Full control
    }
}
