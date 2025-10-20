using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IProjectInvitationService
    {
        Task<ProjectInvitation> SendInvitationAsync(string projectId, string projectName, string invitedByUserId, string invitedByUserName, string invitedUserEmail);
        Task<ProjectInvitation?> GetInvitationByIdAsync(string invitationId);
        Task<List<ProjectInvitation>> GetUserInvitationsAsync(string userEmail);
        Task<bool> AcceptInvitationAsync(string invitationId, string userId);
        Task<bool> DeclineInvitationAsync(string invitationId);
        Task<List<ProjectMember>> GetProjectMembersAsync(string projectId);
        Task<bool> IsUserProjectMemberAsync(string projectId, string userId);
        Task<ProjectRole?> GetUserRoleInProjectAsync(string projectId, string userId);
        Task<bool> RemoveMemberAsync(string projectId, string userId);
    }
}
