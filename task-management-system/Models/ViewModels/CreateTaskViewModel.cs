using System.ComponentModel.DataAnnotations;

namespace task_management_system.Models.ViewModels
{
    public class CreateTaskViewModel
    {
        [Required(ErrorMessage = "Task title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        [StringLength(100, ErrorMessage = "Project name cannot exceed 100 characters")]
        public string? Project { get; set; }

        public DateTime? DueDate { get; set; }

        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    }
}
