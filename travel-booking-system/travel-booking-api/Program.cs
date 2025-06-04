using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using travel_booking_api.Data;
using travel_booking_api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Angular app URL
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Add DbContext configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Register application services
builder.Services.AddScoped<TravelService>();
builder.Services.AddScoped<AuthService>();

// Configure controllers with global route prefix
builder.Services.AddControllers();
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
    options.LowercaseQueryStrings = true;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Travel Booking API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
// Enable Swagger in all environments
app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Travel Booking API v1");
    c.RoutePrefix = "swagger";
});


// Configure routing
app.UseRouting();

// Use CORS after routing
app.UseCors("AllowAngularApp");

// Authorization middleware between UseRouting and route handlers
app.UseAuthorization();

// Use top-level route registration
app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "api/{controller=Home}/{action=Index}/{id?}");

// Add a redirect from the root to Swagger UI
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
