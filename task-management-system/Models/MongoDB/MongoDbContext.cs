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

        public IMongoCollection<User> Users => _database.GetCollection<User>("users");
        public IMongoCollection<EmailVerificationToken> EmailVerificationTokens => _database.GetCollection<EmailVerificationToken>("emailVerificationTokens");
        public IMongoCollection<PasswordResetToken> PasswordResetTokens => _database.GetCollection<PasswordResetToken>("passwordResetTokens");
        public IMongoCollection<Notification> Notifications => _database.GetCollection<Notification>("notifications");
        public IMongoCollection<AddTask> Tasks => _database.GetCollection<AddTask>("tasks");
        public IMongoCollection<Project> Projects => _database.GetCollection<Project>("projects");
        public IMongoCollection<ProjectInvitation> ProjectInvitations => _database.GetCollection<ProjectInvitation>("projectInvitations");
        public IMongoCollection<ProjectMember> ProjectMembers => _database.GetCollection<ProjectMember>("projectMembers");
        public IMongoCollection<Comment> Comments => _database.GetCollection<Comment>("comments");
        public IMongoCollection<WorkLog> WorkLogs => _database.GetCollection<WorkLog>("workLogs");
    }
}