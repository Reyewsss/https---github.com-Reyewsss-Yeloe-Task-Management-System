using Microsoft.AspNetCore.Http;

namespace task_management_system.Services
{
    public interface IUserSessionService
    {
        string? GetCurrentUserId();
        string? GetCurrentUserEmail();
        string? GetCurrentUserName();
        bool IsUserLoggedIn();
        void UpdateUserSession(string email, string firstName, string lastName);
    }

    public class UserSessionService : IUserSessionService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserSessionService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? GetCurrentUserId()
        {
            return _httpContextAccessor.HttpContext?.Session.GetString("UserId");
        }

        public string? GetCurrentUserEmail()
        {
            return _httpContextAccessor.HttpContext?.Session.GetString("UserEmail");
        }

        public string? GetCurrentUserName()
        {
            return _httpContextAccessor.HttpContext?.Session.GetString("UserName");
        }

        public bool IsUserLoggedIn()
        {
            return !string.IsNullOrEmpty(GetCurrentUserId());
        }

        public void UpdateUserSession(string email, string firstName, string lastName)
        {
            if (_httpContextAccessor.HttpContext?.Session != null)
            {
                _httpContextAccessor.HttpContext.Session.SetString("UserEmail", email);
                _httpContextAccessor.HttpContext.Session.SetString("UserName", $"{firstName} {lastName}");
            }
        }
    }
}