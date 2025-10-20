using task_management_system.Data;
using task_management_system.Services;

var builder = WebApplication.CreateBuilder(args);

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
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IProjectService, ProjectService>(); 
builder.Services.AddScoped<IProjectInvitationService, ProjectInvitationService>();
builder.Services.AddScoped<IUserSessionService, UserSessionService>(); // Add user session service

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