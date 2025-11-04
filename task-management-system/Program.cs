using task_management_system.Data;
using task_management_system.Services;

var builder = WebApplication.CreateBuilder(args);

// Load .env file
LoadEnvFile();

// Override appsettings with environment variables
builder.Configuration["ConnectionStrings:DefaultConnection"] = Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING") ?? "";
builder.Configuration["DatabaseName"] = Environment.GetEnvironmentVariable("DATABASE_NAME") ?? "task-management-system";
builder.Configuration["AppSettings:BaseUrl"] = Environment.GetEnvironmentVariable("BASE_URL") ?? "https://localhost:7279";
builder.Configuration["EmailSettings:SmtpServer"] = Environment.GetEnvironmentVariable("SMTP_SERVER") ?? "";
builder.Configuration["EmailSettings:SmtpPort"] = Environment.GetEnvironmentVariable("SMTP_PORT") ?? "";
builder.Configuration["EmailSettings:FromName"] = Environment.GetEnvironmentVariable("EMAIL_FROM_NAME") ?? "";
builder.Configuration["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("EMAIL_FROM_ADDRESS") ?? "";
builder.Configuration["EmailSettings:Username"] = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? "";
builder.Configuration["EmailSettings:Password"] = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? "";
builder.Configuration["Encryption:Key"] = Environment.GetEnvironmentVariable("ENCRYPTION_KEY") ?? "";
builder.Configuration["Encryption:IV"] = Environment.GetEnvironmentVariable("ENCRYPTION_IV") ?? "";

// Add services for MVC
builder.Services.AddControllersWithViews();

// Simple session configuration
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.IsEssential = true;
    options.Cookie.Name = "YeloeSession";
    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

// Configure MongoDB and Services
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddHttpContextAccessor(); // Required for UserSessionService
builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IProjectService, ProjectService>(); 
builder.Services.AddScoped<IProjectInvitationService, ProjectInvitationService>();
builder.Services.AddScoped<IUserSessionService, UserSessionService>(); // Add user session service
builder.Services.AddScoped<IActivityService, ActivityService>(); // Add activity tracking service
builder.Services.AddScoped<IPreferencesService, PreferencesService>(); // Add preferences service
builder.Services.AddScoped<ITaskStatusLabelService, TaskStatusLabelService>(); // Add task status label service

// Add background service for deadline notifications
builder.Services.AddHostedService<DeadlineNotificationBackgroundService>();

var app = builder.Build();

// Configure pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSession();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();

// Method to load .env file
static void LoadEnvFile()
{
    var envFilePath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
    
    if (!File.Exists(envFilePath))
    {
        Console.WriteLine("Warning: .env file not found. Using values from appsettings.json");
        return;
    }

    try
    {
        foreach (var line in File.ReadAllLines(envFilePath))
        {
            // Skip empty lines and comments
            if (string.IsNullOrWhiteSpace(line) || line.TrimStart().StartsWith("#"))
                continue;

            var parts = line.Split('=', 2);
            if (parts.Length == 2)
            {
                var key = parts[0].Trim();
                var value = parts[1].Trim();
                
                // Set environment variable
                Environment.SetEnvironmentVariable(key, value);
            }
        }
        
        Console.WriteLine("✓ Environment variables loaded from .env file");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading .env file: {ex.Message}");
    }
}