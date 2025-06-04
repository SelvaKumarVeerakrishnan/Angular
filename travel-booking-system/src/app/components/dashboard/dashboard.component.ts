import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';

import { AuthService } from '../../services/auth.service';
import { TravelRequestService, TravelRequestStatistics } from '../../services/travel-request.service';
import { TravelRequest } from '../../models/travel-request';
import { TravelRequestStatus } from '../../models/travel-request-status.enum';
import { UserType } from '../../models/user-type.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatTabsModule,
    MatTooltipModule,
    MatPaginatorModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // User info
  username: string = '';
  userType: UserType | null = null;
  UserType = UserType; // Make enum available to template
  
  // Statistics
  totalRequests: number = 0;
  pendingRequests: number = 0;
  approvedRequests: number = 0;
  rejectedRequests: number = 0;
  
  // Travel requests
  recentRequests: TravelRequest[] = [];
  allRequests: TravelRequest[] = []; // Store all requests to filter from
  displayedColumns: string[] = ['destination', 'startDate', 'endDate', 'status', 'actions'];
  
  // Filter state
  currentFilter: TravelRequestStatus | 'all' = 'all';
  
  // Loading states
  isLoading: boolean = true;
  
  // Status colors
  statusColors = {
    [TravelRequestStatus.Pending]: 'orange',
    [TravelRequestStatus.Approved]: 'green',
    [TravelRequestStatus.Rejected]: 'red',
    [TravelRequestStatus.Cancelled]: 'gray'
  };

  constructor(
    private authService: AuthService,
    private travelRequestService: TravelRequestService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user info
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.username = user.firstName;
        this.userType = user.userType;
        this.loadDashboardData();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  // Add TravelRequestStatus enum for use in the template
  get TravelRequestStatus(): typeof TravelRequestStatus {
    return TravelRequestStatus;
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load statistics and recent requests
    this.loadStatistics();
    this.loadRecentRequests();
  }

  loadStatistics(): void {
    // Get real-time statistics
    this.travelRequestService.getStatistics().subscribe({
      next: (stats: TravelRequestStatistics) => {
        this.totalRequests = stats.totalRequests;
        this.pendingRequests = stats.pendingRequests;
        this.approvedRequests = stats.approvedRequests;
        this.rejectedRequests = stats.rejectedRequests;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        // Set to zero values in case of error
        this.totalRequests = 0;
        this.pendingRequests = 0;
        this.approvedRequests = 0;
        this.rejectedRequests = 0;
      }
    });
  }

  loadRecentRequests(): void {
    // Use the actual travel request service to get real data
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // If in mock mode, get mock data
      this.travelRequestService.getMockTravelRequests().subscribe({
        next: (requests) => {
          // Sort by created date descending to get most recent first
          this.allRequests = requests.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          // Apply current filter
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading recent requests:', error);
          this.isLoading = false;
        }
      });
    } else {
      // Use the real API
      this.travelRequestService.getTravelRequests().subscribe({
        next: (requests) => {
          // Sort by created date descending to get most recent first
          this.allRequests = requests.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            
          // Apply current filter
          this.applyFilter();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading recent requests:', error);
          this.isLoading = false;
        }
      });
    }
  }

  createNewRequest(): void {
    this.router.navigate(['/travel-requests'], { queryParams: { tab: 0 } });
  }

  viewRequest(id: number): void {
    // Navigate to the travel request page with the all requests tab selected
    // and pass the request ID so it can be viewed/edited
    this.router.navigate(['/travel-requests'], { 
      queryParams: { 
        tab: 1, // All Requests tab
        requestId: id 
      }
    });
  }

  getStatusClass(status: TravelRequestStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(dateStr: string | Date): string {
    if (!dateStr) return 'N/A';
    
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  navigateToTravelRequests(): void {
    this.router.navigate(['/travel-requests'], { queryParams: { tab: 1 } }); // Navigate to All Requests tab
  }
  
  viewAllRequests(): void {
    this.router.navigate(['/travel-requests'], { queryParams: { tab: 1 } }); // Navigate to All Requests tab
  }

  /**
   * Filters requests based on the selected status
   * @param filter The status filter to apply ('all', 'pending', 'approved', 'rejected')
   */
  filterRequests(filter: TravelRequestStatus | 'all'): void {
    this.currentFilter = filter;
    this.applyFilter();
  }
  
  /**
   * Applies the current filter to the requests
   */
  private applyFilter(): void {
    let filteredRequests = [...this.allRequests];
    
    // Apply status filter
    if (this.currentFilter !== 'all') {
      filteredRequests = filteredRequests.filter(req => req.status === this.currentFilter);
    }
    
    // Take the most recent requests (up to 4)
    this.recentRequests = filteredRequests.slice(0, 4);
  }

  /**
   * Determines if a filter is currently active
   * @param filter The filter to check
   * @returns True if the filter is active
   */
  isFilterActive(filter: TravelRequestStatus | 'all'): boolean {
    return this.currentFilter === filter;
  }

  /**
   * Get a user-friendly label for the current user type
   * @returns A string representation of the user type
   */
  getUserTypeLabel(): string {
    return this.userType === UserType.Admin ? 'Administrator' : 'Regular User';
  }
}
