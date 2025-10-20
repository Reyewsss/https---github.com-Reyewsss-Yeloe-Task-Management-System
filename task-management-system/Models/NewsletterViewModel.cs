using System.ComponentModel.DataAnnotations;

namespace task_management_system.ViewModels
{
    public class NewsletterViewModel
    {
        [Required(ErrorMessage = "Email address is required")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        [Display(Name = "Email Address")]
        public string Email { get; set; } = string.Empty;
    }
}