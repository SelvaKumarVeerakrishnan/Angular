import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TravelRequest } from '../models/travel-request';
import { TravelRequestStatus } from '../models/travel-request-status.enum';
import { AuthService } from './auth.service';

export interface TravelRequestStatistics {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

@Injectable({
  providedIn: 'root'
})
export class TravelRequestService {
  private apiUrl = `${environment.apiUrl}/travel`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }
  
  // Get HTTP options with current auth token
  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
      })
    };
  }

  /**
   * Get all travel requests
   * @returns Observable of TravelRequest array
   */
  getTravelRequests(): Observable<TravelRequest[]> {
    console.log(`Fetching travel requests from: ${this.apiUrl}`);
    return this.http.get<TravelRequest[]>(this.apiUrl, this.getHttpOptions())
      .pipe(
        retry(2),
        tap(data => console.log('Travel requests fetched successfully:', data)),
        catchError(this.handleError)
      );
  }

  /**
   * Get travel requests for the current user
   * @returns Observable of TravelRequest array
   */
  getUserTravelRequests(): Observable<TravelRequest[]> {
    console.log(`Fetching user travel requests from: ${this.apiUrl}/user`);
    return this.http.get<TravelRequest[]>(`${this.apiUrl}/user`, this.getHttpOptions())
      .pipe(
        retry(2),
        tap(data => console.log('User travel requests fetched successfully:', data)),
        catchError(this.handleError)
      );
  }

  /**
   * Get a travel request by ID
   * @param id Travel request ID
   * @returns Observable of TravelRequest
   */
  getTravelRequestById(id: number): Observable<TravelRequest> {
    console.log(`Fetching travel request with ID ${id} from: ${this.apiUrl}/${id}`);
    return this.http.get<TravelRequest>(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        tap(data => console.log(`Travel request with ID ${id} fetched successfully:`, data)),
        catchError(this.handleError)
      );
  }

  /**
   * Create a new travel request
   * @param request Travel request data
   * @returns Observable of created TravelRequest
   */
  createTravelRequest(request: Partial<TravelRequest>): Observable<TravelRequest> {
    return this.http.post<TravelRequest>(this.apiUrl, request, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update an existing travel request
   * @param id Travel request ID
   * @param request Updated travel request data
   * @returns Observable of updated TravelRequest
   */
  updateTravelRequest(id: number, request: Partial<TravelRequest>): Observable<TravelRequest> {
    return this.http.put<TravelRequest>(`${this.apiUrl}/${id}`, request, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Delete a travel request
   * @param id Travel request ID
   * @returns Observable of operation result
   */
  deleteTravelRequest(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHttpOptions())
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Update the status of a travel request
   * @param id Travel request ID
   * @param status New status
   * @param comments Optional comments about the status change
   * @returns Observable of updated TravelRequest
   */
  updateStatus(id: number, status: TravelRequestStatus, comments?: string): Observable<TravelRequest> {
    return this.http.patch<TravelRequest>(
      `${this.apiUrl}/${id}/status`,
      { status, comments },
      this.getHttpOptions()
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Approve a travel request
   * @param id Travel request ID
   * @param comments Optional approval comments
   * @returns Observable of updated TravelRequest
   */
  approveRequest(id: number, comments?: string): Observable<TravelRequest> {
    return this.updateStatus(id, TravelRequestStatus.Approved, comments);
  }

  /**
   * Reject a travel request
   * @param id Travel request ID
   * @param comments Optional rejection reason
   * @returns Observable of updated TravelRequest
   */
  rejectRequest(id: number, comments?: string): Observable<TravelRequest> {
    return this.updateStatus(id, TravelRequestStatus.Rejected, comments);
  }

  /**
   * Cancel a travel request
   * @param id Travel request ID
   * @param comments Optional cancellation reason
   * @returns Observable of updated TravelRequest
   */
  cancelRequest(id: number, comments?: string): Observable<TravelRequest> {
    return this.updateStatus(id, TravelRequestStatus.Cancelled, comments);
  }

  /**
   * Handle HTTP errors
   * @param error HTTP error response
   * @returns Observable with error message
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      
      // First, try to extract detailed error information from the response
      try {
        // If error.error is an object with message property
        if (typeof error.error === 'object' && error.error !== null) {
          if (error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          } else if (error.error.title) {
            // ASP.NET Core often returns error details in 'title'
            errorMessage = `Error: ${error.error.title}`;
          } else if (error.error.detail) {
            // Sometimes error details are in 'detail'
            errorMessage = `Error: ${error.error.detail}`;
          }
        }
      } catch (e) {
        // If parsing fails, fall back to default error format
        console.warn('Failed to parse error response:', e);
      }
      
      // If we couldn't extract a message from the error object, use default formatting
      if (!errorMessage) {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message || 'An error occurred'}`;
      }
      
      // Provide more context based on status codes
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Travel request not found.';
          break;
        case 500:
          // Try to extract more detailed server error information
          if (typeof error.error === 'object' && error.error !== null) {
            if (error.error.message) {
              errorMessage = `Server error: ${error.error.message}`;
            } else if (error.error.detail) {
              errorMessage = `Server error: ${error.error.detail}`;
            } else if (error.error.title) {
              errorMessage = `Server error: ${error.error.title}`;
            } else {
              errorMessage = 'Server error. Please try again later.';
            }
          } else if (typeof error.error === 'string' && error.error) {
            errorMessage = `Server error: ${error.error}`;
          } else {
            errorMessage = 'Server error. Please try again later.';
          }
          break;
      }
    }
    
    // Add more specific network error handling
    if (error.status === 0) {
      errorMessage = 'Network error. Please check your internet connection and ensure the API server is running.';
      console.error('Network error:', error);
    } else {
      console.error('Travel Request Service Error:', error);
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // For local testing without API
  getMockTravelRequests(): Observable<TravelRequest[]> {
    const today = new Date();
    const mockRequests: TravelRequest[] = [
      {
        id: 1,
        destination: 'New York',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString(),
        purpose: 'Business Meeting with potential clients to discuss new partnership opportunities',
        status: TravelRequestStatus.Approved,
        estimatedCost: 1500,
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString()
      },
      {
        id: 2,
        destination: 'San Francisco',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21).toISOString(),
        purpose: 'Annual Tech Conference for networking and learning about industry trends',
        status: TravelRequestStatus.Pending,
        estimatedCost: 2000,
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString()
      },
      {
        id: 3,
        destination: 'Chicago',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25).toISOString(),
        purpose: 'Professional training workshop on advanced project management',
        status: TravelRequestStatus.Rejected,
        estimatedCost: 1200,
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10).toISOString()
      },
      {
        id: 4,
        destination: 'Miami',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 35).toISOString(),
        purpose: 'Client visit to present quarterly results and plan next steps',
        status: TravelRequestStatus.Approved,
        estimatedCost: 1800,
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7).toISOString()
      },
      {
        id: 5,
        destination: 'Seattle',
        startDate: new Date(today.getFullYear(), today.getMonth() + 1, 5).toISOString(),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 9).toISOString(),
        purpose: 'Team building retreat to improve collaboration and morale',
        status: TravelRequestStatus.Pending,
        estimatedCost: 1600,
        createdAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString()
      }
    ];

    return of(mockRequests).pipe(
      tap(() => console.log('Fetched mock travel requests')),
      catchError(this.handleError)
    );
  }
  // Alias methods with different names from the second implementation
  
  /**
   * Get all travel records - alias for getTravelRequests
   * @returns Observable of TravelRequest array
   */
  getAllTravels(): Observable<TravelRequest[]> {
    return this.getTravelRequests();
  }
  
  /**
   * Get travel by ID - alias for getTravelRequestById
   * @param id Travel request ID
   * @returns Observable of TravelRequest
   */
  getTravelById(id: number): Observable<TravelRequest> {
    return this.getTravelRequestById(id);
  }
  
  /**
   * Create travel - alias for createTravelRequest
   * @param travel Travel request data
   * @returns Observable of created TravelRequest
   */
  createTravel(travel: TravelRequest): Observable<TravelRequest> {
    return this.createTravelRequest(travel);
  }
  
  /**
   * Update travel - alias for updateTravelRequest with void return type
   * @param id Travel request ID
   * @param travel Updated travel request data
   * @returns Observable of void
   */
  updateTravel(id: number, travel: TravelRequest): Observable<void> {
    return this.updateTravelRequest(id, travel).pipe(
      tap(() => {}),
      catchError(this.handleError)
    ) as unknown as Observable<void>;
  }
  
  /**
   * Delete travel - alias for deleteTravelRequest with void return type
   * @param id Travel request ID
   * @returns Observable of void
   */
  deleteTravel(id: number): Observable<void> {
    return this.deleteTravelRequest(id).pipe(
      tap(() => {}),
      catchError(this.handleError)
    ) as unknown as Observable<void>;
  }

  /**
   * Get statistics about travel requests
   * @returns Observable of TravelRequestStatistics
   */
  getStatistics(): Observable<TravelRequestStatistics> {
    return (environment.apiUrl === 'mock' || !environment.apiUrl ? 
      this.getMockTravelRequests() : 
      this.getTravelRequests()
    ).pipe(
      map(requests => ({
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === TravelRequestStatus.Pending).length,
        approvedRequests: requests.filter(r => r.status === TravelRequestStatus.Approved).length,
        rejectedRequests: requests.filter(r => r.status === TravelRequestStatus.Rejected).length
      })),
      catchError(this.handleError)
    );
  }
}
