using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;

namespace task_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var notifications = await _notificationService.GetUserNotificationsAsync(userId);
            return Ok(notifications);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            await _notificationService.MarkAsReadAsync(id, userId);
            return Ok();
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            await _notificationService.MarkAllAsReadAsync(userId);
            return Ok();
        }
    }
}