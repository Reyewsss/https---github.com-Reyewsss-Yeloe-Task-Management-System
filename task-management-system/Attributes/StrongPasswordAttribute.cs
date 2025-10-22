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

            if (password.Length < 8)
            {
                ErrorMessage = "Password must be at least 8 characters long.";
                return false;
            }

            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                ErrorMessage = "Password must contain at least one lowercase letter.";
                return false;
            }

            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                ErrorMessage = "Password must contain at least one uppercase letter.";
                return false;
            }

            if (!Regex.IsMatch(password, @"[0-9]"))
            {
                ErrorMessage = "Password must contain at least one number.";
                return false;
            }

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
