# Travel Booking API

## Overview
The Travel Booking API is a RESTful API built using ASP.NET Core and Entity Framework. It provides endpoints for managing travel bookings, allowing users to create, retrieve, update, and delete travel records.

## Project Structure
```
travel-booking-api
├── Controllers
│   └── TravelController.cs        # Handles HTTP requests related to travel bookings
├── Data
│   ├── ApplicationDbContext.cs    # Interacts with the database using Entity Framework
│   └── Migrations                  # Contains migration files for database schema changes
├── Models
│   └── Travel.cs                   # Represents the travel booking entity
├── Services
│   └── TravelService.cs            # Contains business logic for managing travel bookings
├── Program.cs                      # Entry point of the application
├── appsettings.json                # Configuration settings for the application
├── appsettings.Development.json     # Development-specific configuration settings
└── travel-booking-api.csproj      # Project file defining dependencies and build settings
```

## Setup Instructions

1. **Clone the Repository**
   ```
   git clone <repository-url>
   cd travel-booking-api
   ```

2. **Install Dependencies**
   Ensure you have the .NET SDK installed. Run the following command to restore the dependencies:
   ```
   dotnet restore
   ```

3. **Database Configuration**
   Update the `appsettings.json` file with your database connection string.

4. **Run Migrations**
   To create the database schema, run the following command:
   ```
   dotnet ef database update
   ```

5. **Run the Application**
   Start the application using:
   ```
   dotnet run
   ```

## Usage
The API provides the following endpoints for managing travel bookings:

- `GET /api/travel` - Retrieve all travel bookings
- `GET /api/travel/{id}` - Retrieve a specific travel booking by ID
- `POST /api/travel` - Create a new travel booking
- `PUT /api/travel/{id}` - Update an existing travel booking
- `DELETE /api/travel/{id}` - Delete a travel booking

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.