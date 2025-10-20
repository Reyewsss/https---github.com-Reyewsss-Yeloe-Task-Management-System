using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public class ProjectInvitationService : IProjectInvitationService
    {
        private readonly MongoDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;

        public ProjectInvitationService(MongoDbContext context, INotificationService notificationService, IEmailService emailService)
        {
            _context = context;
            _notificationService = notificationService;
            _emailService = emailService;
        }

        public async Task<ProjectInvitation> SendInvitationAsync(string projectId, string projectName, string invitedByUserId, string invitedByUserName, string invitedUserEmail)
        {
            // Check if user exists
            var invitedUser = await _context.Users.Find(u => u.Email == invitedUserEmail).FirstOrDefaultAsync();

            if (invitedUser == null)
            {
                throw new Exception("User with this email does not exist in the system.");
            }

            // Check if invitation already exists
            var existingInvitation = await _context.ProjectInvitations
                .Find(i => i.ProjectId == projectId && i.InvitedUserEmail == invitedUserEmail && i.Status == InvitationStatus.Pending)
                .FirstOrDefaultAsync();

            if (existingInvitation != null)
            {
                throw new Exception("An invitation has already been sent to this user for this project.");
            }

            // Check if user is already a member
            var existingMember = await _context.ProjectMembers
                .Find(m => m.ProjectId == projectId && m.UserId == invitedUser.Id)
                .FirstOrDefaultAsync();

            if (existingMember != null)
            {
                throw new Exception("This user is already a member of the project.");
            }

            // Create invitation
            var invitation = new ProjectInvitation
            {
                ProjectId = projectId,
                ProjectName = projectName,
                InvitedByUserId = invitedByUserId,
                InvitedByUserName = invitedByUserName,
                InvitedUserEmail = invitedUserEmail,
                InvitedUserId = invitedUser.Id,
                Status = InvitationStatus.Pending,
                Role = ProjectRole.Viewer,
                InvitedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            await _context.ProjectInvitations.InsertOneAsync(invitation);

            // Send notification with link to invitation page
            await _notificationService.CreateNotificationAsync(
                invitedUser.Id,
                "Project Invitation",
                $"{invitedByUserName} has invited you to join the project '{projectName}'",
                NotificationType.TeamMemberJoined,
                $"/Projects/Invitation/{invitation.Id}"
            );

            // Send email invitation
            var userName = $"{invitedUser.FirstName} {invitedUser.LastName}".Trim();
            if (string.IsNullOrEmpty(userName))
            {
                userName = invitedUser.Email.Split('@')[0]; // Use email username as fallback
            }
            await SendInvitationEmailAsync(invitation, userName);

            return invitation;
        }

        private async Task SendInvitationEmailAsync(ProjectInvitation invitation, string invitedUserName)
        {
            var subject = $"You're invited to join '{invitation.ProjectName}'";
            // TODO: Replace with your actual domain URL (e.g., https://yourdomain.com)
            // For development, you can use https://localhost:5001 or your local URL
            var acceptUrl = $"https://localhost:5001/Projects/Invitation/{invitation.Id}";

            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background-color: #4F46E5; padding: 20px; text-align: center;'>
                        <h1 style='color: white; margin: 0;'>Project Invitation</h1>
                    </div>
                    <div style='padding: 30px; background-color: #f9fafb;'>
                        <p style='font-size: 16px; color: #374151;'>Hi {invitedUserName},</p>
                        <p style='font-size: 16px; color: #374151;'>
                            <strong>{invitation.InvitedByUserName}</strong> has invited you to join the project <strong>'{invitation.ProjectName}'</strong>.
                        </p>
                        <p style='font-size: 14px; color: #6b7280;'>
                            As a team member, you will have view access to the project and be able to submit updates.
                        </p>
                        <div style='text-align: center; margin: 30px 0;'>
                            <a href='{acceptUrl}' style='background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;'>
                                View Invitation
                            </a>
                        </div>
                        <p style='font-size: 12px; color: #9ca3af;'>
                            This invitation will expire in 7 days.
                        </p>
                        <p style='font-size: 12px; color: #9ca3af;'>
                            If you didn't expect this invitation, you can safely ignore this email.
                        </p>
                    </div>
                    <div style='background-color: #e5e7eb; padding: 20px; text-align: center;'>
                        <p style='margin: 0; font-size: 12px; color: #6b7280;'>
                            © 2025 Yeloe Task System. All rights reserved.
                        </p>
                    </div>
                </div>
            ";

            await _emailService.SendEmailAsync(invitation.InvitedUserEmail, subject, body);
        }

        public async Task<ProjectInvitation?> GetInvitationByIdAsync(string invitationId)
        {
            var invitation = await _context.ProjectInvitations
                .Find(i => i.Id == invitationId)
                .FirstOrDefaultAsync();

            return invitation;
        }

        public async Task<List<ProjectInvitation>> GetUserInvitationsAsync(string userEmail)
        {
            var invitations = await _context.ProjectInvitations
                .Find(i => i.InvitedUserEmail == userEmail && i.Status == InvitationStatus.Pending && i.ExpiresAt > DateTime.UtcNow)
                .SortByDescending(i => i.InvitedAt)
                .ToListAsync();

            return invitations;
        }

        public async Task<bool> AcceptInvitationAsync(string invitationId, string userId)
        {
            var invitation = await _context.ProjectInvitations.Find(i => i.Id == invitationId).FirstOrDefaultAsync();

            if (invitation == null || invitation.Status != InvitationStatus.Pending || invitation.ExpiresAt < DateTime.UtcNow)
            {
                return false;
            }

            // Update invitation status
            var update = Builders<ProjectInvitation>.Update
                .Set(i => i.Status, InvitationStatus.Accepted)
                .Set(i => i.RespondedAt, DateTime.UtcNow);

            await _context.ProjectInvitations.UpdateOneAsync(i => i.Id == invitationId, update);

            // Get user info
            var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
            
            var userName = user != null ? $"{user.FirstName} {user.LastName}".Trim() : "Unknown";
            if (string.IsNullOrEmpty(userName) && user != null)
            {
                userName = user.Email.Split('@')[0];
            }

            // Add user as project member
            var member = new ProjectMember
            {
                ProjectId = invitation.ProjectId,
                UserId = userId,
                UserEmail = invitation.InvitedUserEmail,
                UserName = userName,
                Role = invitation.Role,
                JoinedAt = DateTime.UtcNow,
                AddedByUserId = invitation.InvitedByUserId
            };

            await _context.ProjectMembers.InsertOneAsync(member);

            // Send notification to project owner with link to project dashboard
            await _notificationService.CreateNotificationAsync(
                invitation.InvitedByUserId,
                "Invitation Accepted",
                $"{userName} has accepted your invitation to join '{invitation.ProjectName}'",
                NotificationType.TeamMemberJoined,
                $"/Projects/Dashboard/{invitation.ProjectId}"
            );

            return true;
        }

        public async Task<bool> DeclineInvitationAsync(string invitationId)
        {
            var invitation = await _context.ProjectInvitations.Find(i => i.Id == invitationId).FirstOrDefaultAsync();

            if (invitation == null || invitation.Status != InvitationStatus.Pending)
            {
                return false;
            }

            var update = Builders<ProjectInvitation>.Update
                .Set(i => i.Status, InvitationStatus.Declined)
                .Set(i => i.RespondedAt, DateTime.UtcNow);

            await _context.ProjectInvitations.UpdateOneAsync(i => i.Id == invitationId, update);

            return true;
        }

        public async Task<List<ProjectMember>> GetProjectMembersAsync(string projectId)
        {
            var members = await _context.ProjectMembers
                .Find(m => m.ProjectId == projectId)
                .SortBy(m => m.JoinedAt)
                .ToListAsync();

            return members;
        }

        public async Task<bool> IsUserProjectMemberAsync(string projectId, string userId)
        {
            var member = await _context.ProjectMembers
                .Find(m => m.ProjectId == projectId && m.UserId == userId)
                .FirstOrDefaultAsync();

            return member != null;
        }

        public async Task<ProjectRole?> GetUserRoleInProjectAsync(string projectId, string userId)
        {
            var member = await _context.ProjectMembers
                .Find(m => m.ProjectId == projectId && m.UserId == userId)
                .FirstOrDefaultAsync();

            return member?.Role;
        }

        public async Task<bool> RemoveMemberAsync(string projectId, string userId)
        {
            try
            {
                // Delete the member from the project
                var result = await _context.ProjectMembers
                    .DeleteOneAsync(m => m.ProjectId == projectId && m.UserId == userId);

                if (result.DeletedCount > 0)
                {
                    // Optionally: Send notification to the removed user
                    var user = await _context.Users.Find(u => u.Id == userId).FirstOrDefaultAsync();
                    if (user != null)
                    {
                        var project = await _context.Projects.Find(p => p.Id == projectId).FirstOrDefaultAsync();
                        if (project != null)
                        {
                            await _notificationService.CreateNotificationAsync(
                                userId,
                                "Removed from Project",
                                $"You have been removed from the project '{project.Name}'.",
                                NotificationType.SystemUpdate,
                                $"/Projects/Index"
                            );
                        }
                    }

                    return true;
                }

                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}
