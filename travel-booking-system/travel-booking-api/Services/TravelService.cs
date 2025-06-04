using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using travel_booking_api.Data;
using travel_booking_api.Models;

namespace travel_booking_api.Services
{
    public class TravelService
    {
        private readonly ApplicationDbContext _context;

        public TravelService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Travel>> GetAllTravels()
        {
            return await _context.Travels.ToListAsync();
        }

        public async Task<Travel?> GetTravelById(int id)
        {
            return await _context.Travels.FindAsync(id);
        }

        public async Task<Travel> CreateTravel(Travel travel)
        {
            _context.Travels.Add(travel);
            await _context.SaveChangesAsync();
            return travel;
        }

        public async Task<Travel> UpdateTravel(Travel travel)
        {
            _context.Travels.Update(travel);
            await _context.SaveChangesAsync();
            return travel;
        }

        public async Task DeleteTravel(int id)
        {
            var travel = await _context.Travels.FindAsync(id);
            if (travel != null)
            {
                _context.Travels.Remove(travel);
                await _context.SaveChangesAsync();
            }
        }
    }
}
