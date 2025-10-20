using System.ComponentModel.DataAnnotations;

namespace task_management_system.Models.ViewModels
{
    public class CreateProjectViewModel
    {
        [Required(ErrorMessage = "Project name is required")]
        [StringLength(200, ErrorMessage = "Project name cannot exceed 200 characters")]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        public ProjectStatus Status { get; set; } = ProjectStatus.Active;

        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        [Range(0, 100, ErrorMessage = "Progress must be between 0 and 100")]
        public int Progress { get; set; } = 0;
    }
}
