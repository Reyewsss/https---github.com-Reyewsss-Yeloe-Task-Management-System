using Microsoft.AspNetCore.Mvc;
using task_management_system.Models.ViewModels;
using task_management_system.Services;

namespace task_management_system.Controllers
{
    public class ProjectsController : Controller
    {
        private readonly IProjectService _projectService;
        private readonly ITaskService _taskService;
        private readonly IUserSessionService _userSessionService;
        private readonly IProjectInvitationService _invitationService;

        public ProjectsController(
            IProjectService projectService, 
            ITaskService taskService, 
            IUserSessionService userSessionService,
            IProjectInvitationService invitationService)
        {
            _projectService = projectService;
            _taskService = taskService;
            _userSessionService = userSessionService;
            _invitationService = invitationService;
        }

        // GET: Projects
        public async Task<IActionResult> Index()
        {
            // Check if user is logged in
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login", "Auth");
            }

            // Get all projects for the current user
            var projects = await _projectService.GetUserProjectsAsync(userId);
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            return View(projects);
        }

        // GET: Projects/Dashboard/{id}
        public async Task<IActionResult> Dashboard(string id)
        {
            // Check if user is logged in
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login", "Auth");
            }

            // Get the project
            var project = await _projectService.GetProjectByIdAsync(id, userId);
            if (project == null)
            {
                return NotFound();
            }

            // Get all tasks for this project
            var allTasks = await _taskService.GetUserTasksAsync(userId);
            var projectTasks = allTasks.Where(t => t.Project == project.Name).ToList();

            // Get project members
            var members = await _invitationService.GetProjectMembersAsync(id);

            // Pass data to view
            ViewBag.Project = project;
            ViewBag.ProjectTasks = projectTasks;
            ViewBag.ProjectMembers = members;
            ViewBag.UserName = _userSessionService.GetCurrentUserName();
            ViewBag.TotalTasks = projectTasks.Count;
            ViewBag.CompletedTasks = projectTasks.Count(t => t.IsCompleted);
            ViewBag.PendingTasks = projectTasks.Count(t => !t.IsCompleted);
            ViewBag.HighPriorityTasks = projectTasks.Count(t => t.Priority == Models.TaskPriority.High);

            return View(project);
        }

        // POST: Projects/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([FromForm] CreateProjectViewModel model)
        {
            try
            {
                // Check if user is logged in
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                // Validate model
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return Json(new { success = false, message = string.Join(", ", errors) });
                }

                // Create the project
                var project = await _projectService.CreateProjectAsync(model, userId);

                return Json(new
                {
                    success = true,
                    message = "Project created successfully!",
                    project = new
                    {
                        id = project.Id,
                        name = project.Name,
                        description = project.Description,
                        status = project.Status.ToString(),
                        priority = project.Priority.ToString(),
                        startDate = project.StartDate?.ToString("yyyy-MM-dd"),
                        dueDate = project.DueDate?.ToString("yyyy-MM-dd"),
                        progress = project.Progress,
                        createdAt = project.CreatedAt.ToString("yyyy-MM-dd")
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error creating project: {ex.Message}" });
            }
        }

        // GET: Projects/GetUserProjects - For AJAX dropdown
        [HttpGet]
        public async Task<IActionResult> GetUserProjects()
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var projects = await _projectService.GetUserProjectsAsync(userId);
                
                return Json(new
                {
                    success = true,
                    projects = projects.Select(p => new
                    {
                        id = p.Id,
                        name = p.Name,
                        status = p.Status.ToString()
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error fetching projects: {ex.Message}" });
            }
        }

        // GET: Projects/GetProject
        [HttpGet]
        public async Task<IActionResult> GetProject(string id)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var project = await _projectService.GetProjectByIdAsync(id, userId);
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found" });
                }

                return Json(new
                {
                    success = true,
                    project = new
                    {
                        id = project.Id,
                        name = project.Name,
                        description = project.Description,
                        status = project.Status.ToString(),
                        priority = project.Priority.ToString(),
                        startDate = project.StartDate?.ToString("yyyy-MM-dd"),
                        dueDate = project.DueDate?.ToString("yyyy-MM-dd"),
                        progress = project.Progress
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error fetching project: {ex.Message}" });
            }
        }

        // POST: Projects/Update
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(string id, [FromForm] CreateProjectViewModel model)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return Json(new { success = false, message = string.Join(", ", errors) });
                }

                var success = await _projectService.UpdateProjectAsync(id, model, userId);
                if (!success)
                {
                    return Json(new { success = false, message = "Project not found or update failed" });
                }

                var project = await _projectService.GetProjectByIdAsync(id, userId);
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found after update" });
                }

                return Json(new
                {
                    success = true,
                    message = "Project updated successfully!",
                    project = new
                    {
                        id = project.Id,
                        name = project.Name,
                        description = project.Description,
                        status = project.Status.ToString(),
                        priority = project.Priority.ToString(),
                        startDate = project.StartDate?.ToString("yyyy-MM-dd"),
                        dueDate = project.DueDate?.ToString("yyyy-MM-dd"),
                        progress = project.Progress
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating project: {ex.Message}" });
            }
        }

        // POST: Projects/Delete
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var success = await _projectService.DeleteProjectAsync(id, userId);
                if (!success)
                {
                    return Json(new { success = false, message = "Project not found or delete failed" });
                }

                return Json(new { success = true, message = "Project deleted successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error deleting project: {ex.Message}" });
            }
        }

        // POST: Projects/UpdateProgress
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateProgress(string id, int progress)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var success = await _projectService.UpdateProgressAsync(id, progress, userId);
                if (!success)
                {
                    return Json(new { success = false, message = "Project not found or update failed" });
                }

                return Json(new { success = true, message = "Progress updated successfully!" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error updating progress: {ex.Message}" });
            }
        }

        // POST: Projects/SendInvitation
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SendInvitation(string projectId, string email)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                var userName = _userSessionService.GetCurrentUserName();

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userName))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                // Get project to ensure user is the owner
                var project = await _projectService.GetProjectByIdAsync(projectId, userId);
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found or you don't have permission" });
                }

                // Send invitation
                var invitation = await _invitationService.SendInvitationAsync(
                    projectId,
                    project.Name,
                    userId,
                    userName,
                    email
                );

                return Json(new
                {
                    success = true,
                    message = "Invitation sent successfully!",
                    invitation = new
                    {
                        id = invitation.Id,
                        email = invitation.InvitedUserEmail,
                        status = invitation.Status.ToString()
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        // GET: Projects/Invitation/{id}
        public async Task<IActionResult> Invitation(string id)
        {
            if (!_userSessionService.IsUserLoggedIn())
            {
                return RedirectToAction("Login", "Auth");
            }

            var userId = _userSessionService.GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Login", "Auth");
            }

            // Get invitation details
            var invitation = await _invitationService.GetInvitationByIdAsync(id);
            
            if (invitation == null)
            {
                return View(null); // Will show "Invalid Invitation" message
            }

            // Get project details to show in the invitation view
            if (!string.IsNullOrEmpty(invitation.ProjectId))
            {
                try
                {
                    var project = await _projectService.GetProjectByIdAsync(invitation.ProjectId, invitation.InvitedByUserId);
                    ViewBag.Project = project;
                }
                catch
                {
                    // Project might not be accessible, continue without it
                    ViewBag.Project = null;
                }
            }
            
            return View(invitation);
        }

        // POST: Projects/AcceptInvitation
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AcceptInvitation(string invitationId)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var userId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(userId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var success = await _invitationService.AcceptInvitationAsync(invitationId, userId);
                if (!success)
                {
                    return Json(new { success = false, message = "Invalid or expired invitation" });
                }

                return Json(new { success = true, message = "Invitation accepted! You are now a member of the project." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error accepting invitation: {ex.Message}" });
            }
        }

        // POST: Projects/DeclineInvitation
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeclineInvitation(string invitationId)
        {
            try
            {
                var success = await _invitationService.DeclineInvitationAsync(invitationId);
                if (!success)
                {
                    return Json(new { success = false, message = "Invalid invitation" });
                }

                return Json(new { success = true, message = "Invitation declined." });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error declining invitation: {ex.Message}" });
            }
        }

        // GET: Projects/GetMembers/{projectId}
        [HttpGet]
        public async Task<IActionResult> GetMembers(string projectId)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var members = await _invitationService.GetProjectMembersAsync(projectId);

                return Json(new
                {
                    success = true,
                    members = members.Select(m => new
                    {
                        id = m.Id,
                        name = m.UserName,
                        email = m.UserEmail,
                        role = m.Role.ToString(),
                        joinedAt = m.JoinedAt.ToString("MMM dd, yyyy")
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error fetching members: {ex.Message}" });
            }
        }

        // POST: Projects/RemoveMember
        [HttpPost]
        public async Task<IActionResult> RemoveMember([FromBody] RemoveMemberRequest request)
        {
            try
            {
                if (!_userSessionService.IsUserLoggedIn())
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                var currentUserId = _userSessionService.GetCurrentUserId();
                if (string.IsNullOrEmpty(currentUserId))
                {
                    return Json(new { success = false, message = "User not authenticated" });
                }

                // Get project to ensure user is the owner
                var project = await _projectService.GetProjectByIdAsync(request.ProjectId, currentUserId);
                if (project == null)
                {
                    return Json(new { success = false, message = "Project not found or you don't have permission" });
                }

                // Only project owner can remove members
                if (project.UserId != currentUserId)
                {
                    return Json(new { success = false, message = "Only the project owner can remove members" });
                }

                // Cannot remove yourself
                if (request.UserId == currentUserId)
                {
                    return Json(new { success = false, message = "You cannot remove yourself from the project" });
                }

                // Remove the member
                var success = await _invitationService.RemoveMemberAsync(request.ProjectId, request.UserId);
                
                if (!success)
                {
                    return Json(new { success = false, message = "Failed to remove member" });
                }

                return Json(new { success = true, message = "Member removed successfully" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"Error removing member: {ex.Message}" });
            }
        }
    }

    // Request model for RemoveMember
    public class RemoveMemberRequest
    {
        public required string ProjectId { get; set; }
        public required string UserId { get; set; }
    }
}
