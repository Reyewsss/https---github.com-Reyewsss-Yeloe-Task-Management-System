using System.ComponentModel.DataAnnotations;

namespace task_management_system.ViewModels
{
    public class VerifyEmailViewModel
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(6, MinimumLength = 6, ErrorMessage = "Verification code must be 6 digits")]
        [RegularExpression(@"^[0-9]*$", ErrorMessage = "Verification code must contain only numbers")]
        public string VerificationCode { get; set; } = string.Empty;
    }
}