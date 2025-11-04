using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace task_management_system.Models
{
    [BsonCollection("tbl_project_invitations")]
    public class ProjectInvitation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [BsonElement("invitation_id")]
        public string? InvitationId { get; set; }

        [BsonElement("project_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string ProjectId { get; set; } = string.Empty;

        [BsonElement("project_name")]
        public string ProjectName { get; set; } = string.Empty;

        [BsonElement("invited_by_user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string InvitedByUserId { get; set; } = string.Empty;

        [BsonElement("invited_by_user_name")]
        public string InvitedByUserName { get; set; } = string.Empty;

        [BsonElement("invited_user_email")]
        public string InvitedUserEmail { get; set; } = string.Empty;

        [BsonElement("invited_user_id")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? InvitedUserId { get; set; }

        [BsonElement("invitation_status")]
        public InvitationStatus InvitationStatus { get; set; } = InvitationStatus.Pending;

        [BsonElement("role")]
        public ProjectRole Role { get; set; } = ProjectRole.Viewer;

        [BsonElement("invited_at")]
        public DateTime InvitedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("responded_at")]
        public DateTime? RespondedAt { get; set; }

        [BsonElement("expires_at")]
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
        Viewer = 0,
        Contributor = 1,
        Admin = 2,
        Owner = 3
    }
}
