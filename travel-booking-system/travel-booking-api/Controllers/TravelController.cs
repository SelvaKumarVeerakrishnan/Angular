using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Net;
using travel_booking_api.Models;
using travel_booking_api.Services;
using Microsoft.AspNetCore.Authorization;

namespace travel_booking_api.Controllers
{
    [Route("api/travel")]
    // [Authorize]  // Temporarily comment out for testing
    [ApiController]
    public class TravelController : ControllerBase
    {
        private readonly TravelService _travelService;

        public TravelController(TravelService travelService)
        {
            _travelService = travelService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<Travel>), (int)HttpStatusCode.OK)]
        public async Task<ActionResult<IEnumerable<Travel>>> GetTravels()
        {
            var travels = await _travelService.GetAllTravels();
            return Ok(travels);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(Travel), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<ActionResult<Travel>> GetTravel(int id)
        {
            var travel = await _travelService.GetTravelById(id);
            if (travel == null)
            {
                return NotFound();
            }
            return Ok(travel);
        }

        [HttpPost]
        [ProducesResponseType(typeof(Travel), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        public async Task<ActionResult<Travel>> CreateTravel(Travel travel)
        {
            try
            {
                // Set default values for new requests
                travel.Status = "Pending";
                travel.CreatedAt = DateTime.UtcNow;
                
                var createdTravel = await _travelService.CreateTravel(travel);
                return CreatedAtAction(nameof(GetTravel), new { id = createdTravel.Id }, createdTravel);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = "An error occurred while creating the travel request", Error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> UpdateTravel(int id, Travel travel)
        {
            if (id != travel.Id)
            {
                return BadRequest();
            }

            var existingTravel = await _travelService.GetTravelById(id);
            if (existingTravel == null)
            {
                return NotFound();
            }

            await _travelService.UpdateTravel(travel);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        public async Task<IActionResult> DeleteTravel(int id)
        {
            var travel = await _travelService.GetTravelById(id);
            if (travel == null)
            {
                return NotFound();
            }

            await _travelService.DeleteTravel(id);
            return NoContent();
        }
    }
}