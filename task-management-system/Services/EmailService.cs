using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace task_management_system.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailVerificationAsync(string email, string verificationCode)
        {
            var subject = "Verify Your Email - Welcome to Yeloe! 🎉";
            var body = $@"
                <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' rel='stylesheet'>
                    <style>
                        body {{ font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #6A4018 0%, #8B5A2B 50%, #D2B48C 100%); color: white; padding: 40px 30px; text-align: center; }}
                        .header h1 {{ font-size: 28px; font-weight: 700; margin: 0 0 15px 0; }}
                        .header p {{ font-size: 16px; font-weight: 300; margin: 0; opacity: 0.9; }}
                        .content {{ padding: 40px 30px; }}
                        .content h2 {{ color: #6A4018; font-size: 22px; font-weight: 600; margin: 0 0 25px 0; }}
                        .verification-box {{ background: linear-gradient(135deg, #FFF9E6 0%, #F5F1E8 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #D2B48C; }}
                        .verification-code {{ font-size: 32px; font-weight: 700; color: #6A4018; letter-spacing: 3px; margin: 15px 0; font-family: 'Courier New', monospace; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 10px rgba(106, 64, 24, 0.1); }}
                        .highlight-box {{ background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #6A4018; }}
                        .highlight-box h3 {{ color: #6A4018; font-size: 18px; font-weight: 600; margin: 0 0 10px 0; }}
                        .highlight-box p {{ margin: 0; color: #555; }}
                        .timer-info {{ background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }}
                        .timer-info p {{ margin: 0; color: #856404; font-weight: 500; }}
                        .footer {{ background: #2c2c2c; color: white; padding: 25px 30px; text-align: center; }}
                        .footer p {{ margin: 0; font-size: 14px; }}
                        .footer small {{ opacity: 0.7; }}
                        .security-note {{ background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }}
                        .security-note p {{ margin: 0; color: #1976d2; font-size: 14px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>✨ Almost There!</h1>
                            <p>Just one more step to join the Yeloe family</p>
                        </div>
                        
                        <div class='content'>
                            <h2>Verify Your Email Address</h2>
                            <p>Welcome to Yeloe! We're excited to have you on board. To get started, please verify your email address by entering the code below:</p>
                            
                            <div class='verification-box'>
                                <h3 style='color: #6A4018; margin: 0 0 15px 0;'>Your Verification Code</h3>
                                <div class='verification-code'>{verificationCode}</div>
                                <p style='margin: 15px 0 0 0; color: #666; font-size: 14px;'>Enter this code on the verification page</p>
                            </div>
                            
                            <div class='timer-info'>
                                <p>This code will expire in 15 minutes for your security</p>
                            </div>
                            
                            <div class='security-note'>
                                <p><strong>Security Note:</strong> If you didn't create an account with Yeloe, please ignore this email. Your security is our priority.</p>
                            </div>
                        </div>
                        
                        <div class='footer'>
                            <p><strong>Welcome to the Yeloe family! 🎯</strong></p>
                            <p><small>© 2025 Yeloe Task Management. All rights reserved.</small></p>
                        </div>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string baseUrl)
        {
            var resetUrl = $"{baseUrl}/Auth/ResetPassword?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(resetToken)}";
            
            var subject = "Password Reset Request - Yeloe 🔐";
            var body = $@"
                <html>
                <head>
                    <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' rel='stylesheet'>
                    <style>
                        body {{ font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f7fa; }}
                        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }}
                        .header {{ background: linear-gradient(135deg, #6A4018 0%, #8B5A2B 50%, #D2B48C 100%); color: white; padding: 40px 30px; text-align: center; }}
                        .header h1 {{ font-size: 28px; font-weight: 700; margin: 0 0 15px 0; }}
                        .header p {{ font-size: 16px; font-weight: 300; margin: 0; opacity: 0.9; }}
                        .content {{ padding: 40px 30px; }}
                        .content h2 {{ color: #6A4018; font-size: 22px; font-weight: 600; margin: 0 0 25px 0; }}
                        .reset-box {{ background: linear-gradient(135deg, #FFF9E6 0%, #F5F1E8 100%); padding: 30px; border-radius: 12px; margin: 25px 0; text-align: center; border: 2px solid #D2B48C; }}
                        .cta-section {{ text-align: center; margin: 35px 0; }}
                        .btn {{ display: inline-block; padding: 18px 35px; background: linear-gradient(135deg, #6A4018 0%, #8B5A2B 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(106, 64, 24, 0.3); transition: all 0.3s ease; }}
                        .url-box {{ background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #6A4018; word-break: break-all; }}
                        .url-text {{ font-family: 'Courier New', monospace; font-size: 14px; color: #666; margin: 0; }}
                        .timer-info {{ background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }}
                        .timer-info p {{ margin: 0; color: #856404; font-weight: 500; }}
                        .security-note {{ background: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }}
                        .security-note p {{ margin: 0; color: #1976d2; font-size: 14px; }}
                        .footer {{ background: #2c2c2c; color: white; padding: 25px 30px; text-align: center; }}
                        .footer p {{ margin: 0; font-size: 14px; }}
                        .footer small {{ opacity: 0.7; }}
                        .icon-large {{ font-size: 48px; margin-bottom: 20px; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1>🔐 Password Reset</h1>
                            <p>Secure your account with a new password</p>
                        </div>
                        
                        <div class='content'>
                            <h2>Reset Your Password</h2>
                            <p>We received a request to reset your password for your Yeloe account. No worries, it happens to the best of us!</p>
                            
                            <div class='reset-box'>
                                <div class='icon-large'>🔑</div>
                                <h3 style='color: #6A4018; margin: 0 0 15px 0;'>Reset Password</h3>
                                <p style='margin: 0 0 20px 0; color: #666;'>Click the button below to create a new secure password</p>
                            </div>
                            
                            <div class='cta-section'>
                                <a href='{resetUrl}' class='btn' style='color: white;'>Reset My Password</a>
                            </div>
                            
                            <div class='timer-info'>
                                <p>This reset link will expire in 15 minutes for your security</p>
                            </div>
                            
                            <div class='security-note'>
                                <p><strong>Security Note:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged and your account stays secure.</p>
                            </div>
                        </div>
                        
                        <div class='footer'>
                            <p><strong>Stay secure with Yeloe! 🛡️</strong></p>
                            <p><small>© 2025 Yeloe Task Management. All rights reserved.</small></p>
                        </div>
                    </div>
                </body>
                </html>";

            await SendEmailAsync(email, subject, body);
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(
                    _configuration["EmailSettings:FromName"] ?? "Yeloe Task Management",
                    _configuration["EmailSettings:FromEmail"]));

                message.To.Add(new MailboxAddress("", to));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = body };
                message.Body = builder.ToMessageBody();

                using var client = new SmtpClient();
                await client.ConnectAsync(
                    _configuration["EmailSettings:SmtpServer"],
                    int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587"),
                    SecureSocketOptions.StartTls);

                await client.AuthenticateAsync(
                    _configuration["EmailSettings:Username"],
                    _configuration["EmailSettings:Password"]);

                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Email sent successfully to {Email}", to);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", to);
                throw;
            }
        }
    }
}