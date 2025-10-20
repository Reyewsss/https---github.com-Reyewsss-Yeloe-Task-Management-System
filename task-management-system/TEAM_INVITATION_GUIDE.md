# Project Team Invitation System - User Guide

## Overview
The Team Invitation System allows project owners to invite other users to collaborate on their projects. Invited members receive notifications and emails, and can view project content and submit updates (but cannot create or edit).

## Features Implemented

### 1. **Invitation Flow**
- ✅ Project owners can invite users by email
- ✅ Invitations are sent via both notification and email
- ✅ Invited users must have an existing account
- ✅ Invitations expire after 7 days
- ✅ Duplicate invitations are prevented

### 2. **Access Control**
- **Owner**: Full project control (you)
- **Viewer**: View-only access + submit updates (invited members)
- Future roles: Contributor, Admin

### 3. **Notification System**
- In-app notification when invitation is sent
- In-app notification when invitation is accepted
- Email notification with invitation details

### 4. **Member Management**
- View all project members in Team tab
- See member roles and join dates
- Member list updates automatically

## How to Use

### Inviting a Team Member

1. **Open Your Project Dashboard**
   - Navigate to Projects page
   - Click on the project card you want to share

2. **Go to Team Tab**
   - Click on "Team Members" tab
   - You'll see yourself listed as the Owner

3. **Send Invitation**
   - Click the "Add Member" button (top right)
   - Enter the email address of the user you want to invite
   - Click "Send Invitation"
   
   **Important**: The user must already have an account in the Yeloe Task System!

4. **Confirmation**
   - You'll see a success message
   - The page will refresh to show pending status

### Receiving an Invitation

When someone invites you to a project:

1. **Notification**
   - You'll receive an in-app notification
   - You'll receive an email with invitation details

2. **Accept/Decline**
   - Click on the notification or email link
   - You'll be taken to the invitation page
   - Choose to Accept or Decline

3. **After Accepting**
   - You become a member of the project
   - Project owner receives a notification
   - You can access the project from your Projects page

### Viewing Team Members

In the Project Dashboard → Team Members tab:
- **Owner** (you): Crown icon, "Owner" badge
- **Members**: User icon, role badge (Viewer)
- Each member shows:
  - Name
  - Email
  - Join date
  - Role

## Email Template

When you send an invitation, the recipient receives a professional email:

```
Subject: You're invited to join '[Project Name]'

Hi [Name],

[Your Name] has invited you to join the project '[Project Name]'.

As a team member, you will have view access to the project and be able to submit updates.

[View Invitation Button]

This invitation will expire in 7 days.
```

## Database Collections

The system uses two new MongoDB collections:

### ProjectInvitations
Stores all invitation records:
- Invitation ID
- Project details
- Sender information
- Recipient email
- Status (Pending, Accepted, Declined, Expired)
- Role (Viewer)
- Timestamps

### ProjectMembers
Stores active project memberships:
- Member ID
- Project ID
- User details (ID, email, name)
- Role
- Join date
- Added by user ID

## API Endpoints

### POST /Projects/SendInvitation
Send a project invitation
```json
{
  "projectId": "string",
  "email": "user@example.com"
}
```

### POST /Projects/AcceptInvitation
Accept a pending invitation
```json
{
  "invitationId": "string"
}
```

### POST /Projects/DeclineInvitation
Decline a pending invitation
```json
{
  "invitationId": "string"
}
```

### GET /Projects/GetMembers/{projectId}
Get all members of a project
```json
{
  "success": true,
  "members": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "role": "Viewer",
      "joinedAt": "Oct 19, 2025"
    }
  ]
}
```

## Error Handling

The system prevents common issues:

❌ **"User with this email does not exist in the system"**
- Solution: The user must create an account first

❌ **"An invitation has already been sent to this user"**
- Solution: Wait for the user to respond or for the invitation to expire

❌ **"This user is already a member of the project"**
- Solution: No need to invite again

❌ **"Invalid or expired invitation"**
- Solution: Request a new invitation from the project owner

## Future Enhancements

### Phase 2 (Coming Soon)
- Remove member functionality
- Update member roles
- Invitation acceptance page with project preview

### Phase 3 (Planned)
- **Contributor Role**: Can create and edit tasks
- **Admin Role**: Can manage team members
- Bulk invitations
- Invitation history
- Member activity logs

## Technical Details

### Models
- `ProjectInvitation.cs`: Invitation data model
- `ProjectMember.cs`: Member data model
- `ProjectRole` enum: Owner, Viewer, Contributor, Admin

### Services
- `IProjectInvitationService`: Interface for invitation operations
- `ProjectInvitationService`: Business logic implementation

### Controllers
- `ProjectsController`: Invitation and member endpoints

### Views
- `Dashboard.cshtml`: Updated with invitation modal
- Team tab displays members dynamically

### JavaScript
- `project-dashboard.js`: Modal handling and AJAX requests

### Styling
- `project-dashboard.css`: Modal and member styling

## Security Notes

🔒 **Access Control**
- Only project owners can send invitations
- Users can only accept invitations sent to their email
- Session authentication required for all operations

🔒 **Data Validation**
- Email validation on client and server
- Anti-forgery tokens on all POST requests
- User existence verification
- Duplicate prevention

🔒 **Privacy**
- Members can only see other members of projects they belong to
- Email addresses are only visible to project owners
- Invitation links are secured with unique IDs

## Support

If you encounter issues:
1. Ensure the invited user has an account
2. Check notification panel for invitation status
3. Verify email delivery (check spam folder)
4. Confirm invitation hasn't expired (7 days)

## Testing Checklist

✅ Test these scenarios:
- [ ] Invite existing user by email
- [ ] Try to invite non-existent user (should fail)
- [ ] Try to invite same user twice (should fail)
- [ ] Accept invitation
- [ ] Decline invitation
- [ ] View members list as owner
- [ ] Access shared project as member
- [ ] Verify notification received
- [ ] Verify email received

## Best Practices

1. **Before Inviting**
   - Confirm the user has an account
   - Use the correct email address
   - Inform the user you're sending an invitation

2. **After Inviting**
   - Follow up with the user
   - Check if they received the notification
   - Remind them invitation expires in 7 days

3. **Managing Members**
   - Regularly review team member list
   - Remove inactive members (future feature)
   - Update roles as needed (future feature)

---

**Version**: 1.0
**Last Updated**: October 19, 2025
**Status**: Invitation system fully functional, focused on sending invitations with notification and email delivery.
