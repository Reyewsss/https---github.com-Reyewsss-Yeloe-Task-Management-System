using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace task_management_system.Attributes
{
    public class StrongPasswordAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            if (value == null || string.IsNullOrEmpty(value.ToString()))
                return false;

            string password = value.ToString()!;

            // Check minimum length (8 characters)
            if (password.Length < 8)
            {
                ErrorMessage = "Password must be at least 8 characters long.";
                return false;
            }

            // Check for lowercase letter
            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                ErrorMessage = "Password must contain at least one lowercase letter.";
                return false;
            }

            // Check for uppercase letter
            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                ErrorMessage = "Password must contain at least one uppercase letter.";
                return false;
            }

            // Check for number
            if (!Regex.IsMatch(password, @"[0-9]"))
            {
                ErrorMessage = "Password must contain at least one number.";
                return false;
            }

            // Check for special character
            if (!Regex.IsMatch(password, @"[!@#$%^&*(),.?""':;{}|<>]"))
            {
                ErrorMessage = "Password must contain at least one special character (!@#$%^&*(),.?\"':;{}|<>).";
                return false;
            }

            return true;
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (!IsValid(value))
            {
                return new ValidationResult(ErrorMessage);
            }
            return ValidationResult.Success;
        }
    }
}
