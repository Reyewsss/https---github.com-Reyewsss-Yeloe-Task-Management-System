using Microsoft.AspNetCore.Mvc;
using task_management_system.Services;

namespace task_management_system.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskStatusController : ControllerBase
    {
        private readonly ITaskStatusLabelService _statusLabelService;

        public TaskStatusController(ITaskStatusLabelService statusLabelService)
        {
            _statusLabelService = statusLabelService;
        }

        [HttpGet("labels")]
        public async Task<IActionResult> GetStatusLabels([FromQuery] string? projectId = null)
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var labels = await _statusLabelService.GetUserStatusLabelsAsync(userId, projectId);
            return Ok(labels);
        }

        [HttpPost("labels")]
        public async Task<IActionResult> CreateStatusLabel([FromBody] CreateStatusLabelRequest request)
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            if (string.IsNullOrWhiteSpace(request.LabelName))
                return BadRequest(new { message = "Label name is required" });

            var result = await _statusLabelService.CreateStatusLabelAsync(
                userId,
                request.LabelName,
                request.LabelColor ?? "#6c757d",
                request.ProjectId
            );

            if (!result.success)
                return BadRequest(new { message = result.message });

            return Ok(new { message = result.message, statusLabel = result.statusLabel });
        }

        [HttpPut("labels/{statusLabelId}")]
        public async Task<IActionResult> UpdateStatusLabel(string statusLabelId, [FromBody] UpdateStatusLabelRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.LabelName))
                return BadRequest(new { message = "Label name is required" });

            var result = await _statusLabelService.UpdateStatusLabelAsync(
                statusLabelId,
                request.LabelName,
                request.LabelColor ?? "#6c757d"
            );

            if (!result.success)
                return BadRequest(new { message = result.message });

            return Ok(new { message = result.message });
        }

        [HttpDelete("labels/{statusLabelId}")]
        public async Task<IActionResult> DeleteStatusLabel(string statusLabelId)
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var result = await _statusLabelService.DeleteStatusLabelAsync(statusLabelId, userId);

            if (!result.success)
                return BadRequest(new { message = result.message });

            return Ok(new { message = result.message });
        }

        [HttpPost("labels/initialize")]
        public async Task<IActionResult> InitializeDefaultLabels()
        {
            var userId = HttpContext.Session.GetString("UserId");
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User not authenticated" });

            var result = await _statusLabelService.InitializeDefaultStatusLabelsAsync(userId);
            return Ok(new { message = result.message });
        }

        [HttpPost("labels/reorder")]
        public async Task<IActionResult> ReorderStatusLabels([FromBody] ReorderStatusLabelsRequest request)
        {
            if (request.StatusLabelIds == null || !request.StatusLabelIds.Any())
                return BadRequest(new { message = "Status label IDs are required" });

            var result = await _statusLabelService.ReorderStatusLabelsAsync(request.StatusLabelIds);

            if (!result.success)
                return BadRequest(new { message = result.message });

            return Ok(new { message = result.message });
        }
    }

    public class CreateStatusLabelRequest
    {
        public string LabelName { get; set; } = string.Empty;
        public string? LabelColor { get; set; }
        public string? ProjectId { get; set; }
    }

    public class UpdateStatusLabelRequest
    {
        public string LabelName { get; set; } = string.Empty;
        public string? LabelColor { get; set; }
    }

    public class ReorderStatusLabelsRequest
    {
        public List<string> StatusLabelIds { get; set; } = new List<string>();
    }
}
