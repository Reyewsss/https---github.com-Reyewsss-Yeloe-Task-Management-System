using MongoDB.Driver;
using task_management_system.Data;
using task_management_system.Models;

namespace task_management_system.Services
{
    public interface IAuthService
    {
        Task<(bool success, string message)> RegisterAsync(string email, string password, string firstName, string lastName);
        Task<User?> LoginAsync(string email, string password);
        Task<(bool success, string message)> SendEmailVerificationAsync(string email);
        Task<(bool success, string message)> VerifyEmailAsync(string email, string verificationCode);
        Task<(bool success, string message)> SendPasswordResetEmailAsync(string email, string baseUrl);
        Task<(bool success, string message)> ResetPasswordAsync(string email, string token, string newPassword);
        Task<bool> ValidatePasswordResetTokenAsync(string email, string token);
        Task<User?> GetUserByEmailAsync(string email);
        Task<(bool success, string message)> UpdateProfileAsync(string userId, string firstName, string lastName, string email);
        Task<(bool success, string message)> ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }

    public class AuthService : IAuthService
    {
        private readonly MongoDbContext _context;
        private readonly IPasswordService _passwordService;
        private readonly IEmailService _emailService;

        public AuthService(MongoDbContext context, IPasswordService passwordService, IEmailService emailService)
        {
            _context = context;
            _passwordService = passwordService;
            _emailService = emailService;
        }

        public async Task<(bool success, string message)> RegisterAsync(string email, string password, string firstName, string lastName)
        {
            // Check if user already exists
            var existingUser = await _context.Users
                .Find(u => u.Email == email)
                .FirstOrDefaultAsync();

            if (existingUser != null)
                return (false, "Email already exists.");

            // Create new user (NOT verified by default)
            var user = new User
            {
                Email = email,
                PasswordHash = _passwordService.HashPassword(password),
                FirstName = firstName,
                LastName = lastName,
                IsEmailVerified = false, 
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.InsertOneAsync(user);

            // Send verification email
            var verificationResult = await SendEmailVerificationAsync(email);
            if (!verificationResult.success)
                return (false, "User created but failed to send verification email. Please try to resend verification.");

            return (true, "Please check your email for verification code.");
        }

        public async Task<User?> LoginAsync(string email, string password)
        {
            var user = await _context.Users
                .Find(u => u.Email == email)
                .FirstOrDefaultAsync();

            if (user == null || !_passwordService.VerifyPassword(password, user.PasswordHash))
                return null;

            // Check if email is verified
            if (!user.IsEmailVerified)
                return null; 

            return user;
        }

        public async Task<(bool success, string message)> SendEmailVerificationAsync(string email)
        {
            try
            {
                // Check if user exists
                var user = await _context.Users
                    .Find(u => u.Email == email)
                    .FirstOrDefaultAsync();

                if (user == null)
                    return (false, "User not found.");

                if (user.IsEmailVerified)
                    return (false, "Email is already verified.");

                // Generate 6-digit verification code
                var verificationCode = new Random().Next(100000, 999999).ToString();

                // Delete any existing tokens for this email
                await _context.EmailVerificationTokens
                    .DeleteManyAsync(t => t.Email == email);

                // Create new verification token
                var token = new EmailVerificationToken
                {
                    Email = email,
                    VerificationCode = verificationCode,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(15), 
                    CreatedAt = DateTime.UtcNow
                };

                await _context.EmailVerificationTokens.InsertOneAsync(token);

                // Send email
                await _emailService.SendEmailVerificationAsync(email, verificationCode);

                return (true, "Verification code sent successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Failed to send verification email: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> VerifyEmailAsync(string email, string verificationCode)
        {
            try
            {
                // Find the verification token
                var token = await _context.EmailVerificationTokens
                    .Find(t => t.Email == email && t.VerificationCode == verificationCode && !t.IsUsed)
                    .FirstOrDefaultAsync();

                if (token == null)
                    return (false, "Invalid verification code.");

                if (token.ExpiresAt < DateTime.UtcNow)
                    return (false, "Verification code has expired. Please request a new one.");

                // Mark token as used
                var tokenUpdate = Builders<EmailVerificationToken>.Update.Set(t => t.IsUsed, true);
                await _context.EmailVerificationTokens.UpdateOneAsync(t => t.Id == token.Id, tokenUpdate);

                // Update user's email verification status
                var userUpdate = Builders<User>.Update.Set(u => u.IsEmailVerified, true);
                var updateResult = await _context.Users.UpdateOneAsync(u => u.Email == email, userUpdate);

                if (updateResult.ModifiedCount == 0)
                    return (false, "User not found.");

                return (true, "Email verified successfully! You can now login.");
            }
            catch (Exception ex)
            {
                return (false, $"Verification failed: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> SendPasswordResetEmailAsync(string email, string baseUrl)
        {
            try
            {
                // Check if user exists and is verified
                var user = await _context.Users
                    .Find(u => u.Email == email)
                    .FirstOrDefaultAsync();

                if (user == null)
                    return (false, "If an account with this email exists, you will receive a password reset email.");

                if (!user.IsEmailVerified)
                    return (false, "Please verify your email address first before resetting your password.");

                // Generate secure reset token
                var resetToken = Guid.NewGuid().ToString("N");

                // Delete any existing password reset tokens for this email
                await _context.PasswordResetTokens
                    .DeleteManyAsync(t => t.Email == email);

                // Create new password reset token
                var token = new PasswordResetToken
                {
                    Email = email,
                    Token = resetToken,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), 
                    CreatedAt = DateTime.UtcNow
                };

                await _context.PasswordResetTokens.InsertOneAsync(token);

                // Send password reset email with dynamic baseUrl
                await _emailService.SendPasswordResetEmailAsync(email, resetToken, baseUrl);

                return (true, "If an account with this email exists, you will receive a password reset email.");
            }
            catch (Exception)
            {
                return (false, "An error occurred while processing your request. Please try again later.");
            }
        }

        public async Task<(bool success, string message)> ResetPasswordAsync(string email, string token, string newPassword)
        {
            try
            {
                // Find the password reset token
                var resetToken = await _context.PasswordResetTokens
                    .Find(t => t.Email == email && t.Token == token)
                    .FirstOrDefaultAsync();

                if (resetToken == null)
                    return (false, "Invalid or expired password reset token.");

                // Update the user's password
                var userUpdate = Builders<User>.Update
                    .Set(u => u.PasswordHash, _passwordService.HashPassword(newPassword));
                var updateResult = await _context.Users.UpdateOneAsync(u => u.Email == email, userUpdate);

                if (updateResult.ModifiedCount == 0)
                    return (false, "User not found.");

                // Delete the used password reset token
                await _context.PasswordResetTokens.DeleteOneAsync(t => t.Id == resetToken.Id);

                return (true, "Password reset successfully. You can now login with your new password.");
            }
            catch (Exception ex)
            {
                return (false, $"Password reset failed: {ex.Message}");
            }
        }

        public async Task<bool> ValidatePasswordResetTokenAsync(string email, string token)
        {
            try
            {
                var resetToken = await _context.PasswordResetTokens
                    .Find(t => t.Email == email && t.Token == token)
                    .FirstOrDefaultAsync();

                return resetToken != null && resetToken.ExpiresAt > DateTime.UtcNow;
            }
            catch
            {
                return false;
            }
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            try
            {
                return await _context.Users
                    .Find(u => u.Email == email)
                    .FirstOrDefaultAsync();
            }
            catch (Exception)
            {   
                return null;
            }
        }

        public async Task<(bool success, string message)> UpdateProfileAsync(string userId, string firstName, string lastName, string email)
        {
            try
            {
                var user = await _context.Users
                    .Find(u => u.Id == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                    return (false, "User not found.");

                // Check if new email is already taken by another user
                if (user.Email != email)
                {
                    var existingUser = await _context.Users
                        .Find(u => u.Email == email && u.Id != userId)
                        .FirstOrDefaultAsync();

                    if (existingUser != null)
                        return (false, "Email is already in use by another account.");
                }

                // Update user fields
                var update = Builders<User>.Update
                    .Set(u => u.FirstName, firstName)
                    .Set(u => u.LastName, lastName)
                    .Set(u => u.Email, email);

                var result = await _context.Users.UpdateOneAsync(
                    u => u.Id == userId,
                    update
                );

                if (result.ModifiedCount > 0)
                    return (true, "Profile updated successfully!");

                return (false, "No changes were made.");
            }
            catch (Exception ex)
            {
                return (false, $"Error updating profile: {ex.Message}");
            }
        }

        public async Task<(bool success, string message)> ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            try
            {
                var user = await _context.Users
                    .Find(u => u.Id == userId)
                    .FirstOrDefaultAsync();

                if (user == null)
                    return (false, "User not found.");

                // Verify current password
                if (!_passwordService.VerifyPassword(currentPassword, user.PasswordHash))
                    return (false, "Current password is incorrect.");

                // Hash new password
                var newPasswordHash = _passwordService.HashPassword(newPassword);

                // Update password
                var update = Builders<User>.Update
                    .Set(u => u.PasswordHash, newPasswordHash);

                var result = await _context.Users.UpdateOneAsync(
                    u => u.Id == userId,
                    update
                );

                if (result.ModifiedCount > 0)
                    return (true, "Password changed successfully!");

                return (false, "Failed to update password.");
            }
            catch (Exception ex)
            {
                return (false, $"Error changing password: {ex.Message}");
            }
        }
    }
}