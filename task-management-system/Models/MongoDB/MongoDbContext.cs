using MongoDB.Driver;
using task_management_system.Models;

namespace task_management_system.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var client = new MongoClient(configuration.GetConnectionString("DefaultConnection"));
            _database = client.GetDatabase(configuration["DatabaseName"]);
        }

        public IMongoCollection<User> Users => _database.GetCollection<User>("tbl_users");
        public IMongoCollection<EmailVerificationToken> EmailVerificationTokens => _database.GetCollection<EmailVerificationToken>("tbl_email_verification_tokens");
        public IMongoCollection<PasswordResetToken> PasswordResetTokens => _database.GetCollection<PasswordResetToken>("tbl_password_reset_tokens");
        public IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("tbl_notifications");
        public IMongoCollection<AddTask> Tasks => _database.GetCollection<AddTask>("tbl_tasks");
        public IMongoCollection<Project> Projects => _database.GetCollection<Project>("tbl_projects");
        public IMongoCollection<ProjectInvitation> ProjectInvitations => _database.GetCollection<ProjectInvitation>("tbl_project_invitations");
        public IMongoCollection<ProjectMember> ProjectMembers => _database.GetCollection<ProjectMember>("tbl_project_members");
        public IMongoCollection<Comment> Comments => _database.GetCollection<Comment>("tbl_comments");
        public IMongoCollection<WorkLog> WorkLogs => _database.GetCollection<WorkLog>("tbl_work_logs");
        public IMongoCollection<UserActivity> UserActivities => _database.GetCollection<UserActivity>("tbl_user_activities");
        public IMongoCollection<UserPreferences> UserPreferences => _database.GetCollection<UserPreferences>("tbl_user_preferences");
        public IMongoCollection<TaskStatusLabel> TaskStatusLabels => _database.GetCollection<TaskStatusLabel>("tbl_task_status_labels");
    }
}