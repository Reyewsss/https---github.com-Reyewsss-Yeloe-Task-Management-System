using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string email, string verificationCode);
        Task SendPasswordResetEmailAsync(string email, string resetToken, string baseUrl); 
        Task SendEmailAsync(string to, string subject, string body);
    }
}