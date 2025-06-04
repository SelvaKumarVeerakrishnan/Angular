import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { formatDate } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { TravelRequestService } from '../../services/travel-request.service';
import { AuthService } from '../../services/auth.service';
import { TravelRequest } from '../../models/travel-request';
import { TravelRequestStatus } from '../../models/travel-request-status.enum';
import { UserType } from '../../models/user-type.enum';
import { User } from '../../models/user';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-travel-request',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTabsModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
  ],

  templateUrl: './travel-request.component.html',
  styleUrl: './travel-request.component.scss'
})
export class TravelRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  // Subscriptions to manage
  private subscriptions: Subscription[] = [];
  // Make TravelRequestStatus available to the template
  TravelRequestStatus = TravelRequestStatus;
  // Form
  travelRequestForm: FormGroup;
  isEditMode = false;
  currentRequestId: number | null = null;
  // Tab management
  selectedTabIndex = 0;
  
  // Data
  travelRequests: TravelRequest[] = [];
  filteredRequests: TravelRequest[] = [];
  statusOptions = Object.values(TravelRequestStatus);
  currentUser: User | null = null;
  
  // Table
  displayedColumns: string[] = [
    'id', 
    'destination', 
    'startDate', 
    'endDate', 
    'purpose', 
    'estimatedCost', 
    'status', 
    'actions'
  ];
  
  // Loading
  isLoading = false;
  isSubmitting = false;
  
  // Filter
  statusFilter: TravelRequestStatus | 'all' = 'all';
  searchText: string = '';
  
  // Pagination and sorting
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  constructor(
    private formBuilder: FormBuilder,
    private travelRequestService: TravelRequestService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.travelRequestForm = this.formBuilder.group({
      destination: ['', [Validators.required, Validators.minLength(2)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(5)]],
      estimatedCost: ['', [Validators.required, Validators.min(0)]],
      status: [{ value: TravelRequestStatus.Pending, disabled: !this.isAdmin() }]
    }, { validators: this.dateRangeValidator });
  }
  
  ngOnInit(): void {
    // Subscribe to user changes
    const userSub = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.loadTravelRequests();
    });
    this.subscriptions.push(userSub);

    // Initialize the form with validators
    this.initForm();
    
    // Check for tab index in query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      this.selectedTabIndex = parseInt(tabParam, 10) || 0;
    }
  }
  
  /**
   * Clean up subscriptions on component destruction
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    // Set up sorting and pagination after view is initialized
    if (this.sort && this.paginator) {
      this.setupSortingAndPagination();
    }
  }

  /**
   * Initialize the travel request form with validators
   */
  private initForm(): void {
    this.travelRequestForm = this.formBuilder.group({
      destination: ['', [Validators.required, Validators.minLength(2)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      purpose: ['', [Validators.required, Validators.minLength(5)]],
      estimatedCost: ['', [Validators.required, Validators.min(0)]],
      status: [{ value: TravelRequestStatus.Pending, disabled: !this.isAdmin() }]
    }, { validators: this.dateRangeValidator });
  }

  /**
   * Set up sorting and pagination
   */
  private setupSortingAndPagination(): void {
    // Setup sorting
    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0;
      this.sortData(this.sort);
    });

    // Setup pagination
    this.paginator.page.subscribe((event: PageEvent) => {
      // Handle pagination events if needed
      // For server-side pagination, you would call your API here
    });
  }
  
  /**
   * Validates that the end date is after the start date
   * @param formGroup The form group to validate
   * @returns Validation error object or null
   */
  dateRangeValidator(formGroup: FormGroup) {
    const start = formGroup.get('startDate')?.value;
    const end = formGroup.get('endDate')?.value;
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      if (startDate > endDate) {
        formGroup.get('endDate')?.setErrors({ 'dateRange': true });
        return { 'dateRange': true };
      } else {
        // Clear the error if dates are now valid
        const endDateControl = formGroup.get('endDate');
        if (endDateControl?.hasError('dateRange')) {
          const errors = { ...endDateControl.errors };
          delete errors['dateRange'];
          endDateControl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    }
    
    return null;
  }
  /**
   * Load travel requests from the service
   */
  loadTravelRequests(): void {
    this.isLoading = true;
    this.travelRequests = []; // Clear existing data
    this.filteredRequests = []; // Clear filtered data
    
    console.log('Loading travel requests...');
    console.log('API URL:', environment.apiUrl);
    
    // For development without API
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // Use mock data service
      console.log('Using mock data service');
      this.travelRequestService.getMockTravelRequests().subscribe({
        next: (data) => {
          this.travelRequests = data;
          this.applyFilters();
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel requests loading error:', error);
          
          this.snackBar.open('Error loading travel requests: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Use real API service
      console.log('Using real API service');
      this.travelRequestService.getTravelRequests().subscribe({
        next: (data) => {
          console.log('Travel requests loaded successfully:', data);
          this.travelRequests = Array.isArray(data) ? data : [];
          this.applyFilters();
          
          if (this.travelRequests.length === 0) {
            console.log('No travel requests found.');
            this.snackBar.open('No travel requests found.', 'Close', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel requests loading error:', error);
          
          this.snackBar.open('Error loading travel requests: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLoading = false;
          console.log('Travel request loading complete.');
          
          // If we have a sort already applied, re-apply it
          if (this.sort && this.sort.active && this.sort.direction) {
            this.sortData({
              active: this.sort.active,
              direction: this.sort.direction
            });
          }
        }
      });
    }
  }
  
  /**
   * Submit the travel request form
   * Creates a new request or updates an existing one
   */
  submitRequest(): void {
    // Mark all form controls as touched to trigger validation
    if (this.travelRequestForm.invalid) {
      this.markFormGroupTouched(this.travelRequestForm);
      return;
    }
    
    this.isSubmitting = true;
    
    const formValues = this.travelRequestForm.value;
    
    const request: Partial<TravelRequest> = {
      id: this.isEditMode ? this.currentRequestId || undefined : undefined,
      destination: formValues.destination,
      startDate: formValues.startDate instanceof Date ? formValues.startDate.toISOString() : formValues.startDate,
      endDate: formValues.endDate instanceof Date ? formValues.endDate.toISOString() : formValues.endDate,
      purpose: formValues.purpose,
      estimatedCost: formValues.estimatedCost,
      // For new requests, always set Pending status; for edit mode, get status from form if admin, otherwise don't change it
      status: this.isEditMode 
        ? (this.isAdmin() ? formValues.status : undefined)
        : TravelRequestStatus.Pending,
      createdAt: new Date().toISOString(),
      userId: this.currentUser?.id
    };
    
    if (this.isEditMode && this.currentRequestId) {
      // Update existing request
      this.updateTravelRequest(this.currentRequestId, request);
    } else {
      // Create new request
      this.createTravelRequest(request);
    }
  }
  
  /**
   * Mark all controls in a form group as touched
   * @param formGroup The form group to touch
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity();
        }
      }
    });
  }
  
  /**
   * Initialize form state by resetting validation states
   */
  private initializeFormState(): void {
    // Reset validation states
    Object.keys(this.travelRequestForm.controls).forEach(key => {
      const control = this.travelRequestForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
    
    // Reset form state
    this.travelRequestForm.markAsPristine();
    this.travelRequestForm.markAsUntouched();
    
    // Update validity
    this.travelRequestForm.updateValueAndValidity();
  }
  
  /**
   * Create a new travel request
   * @param request The request to create
   */
  createTravelRequest(request: Partial<TravelRequest>): void {
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // Mock implementation for development
      const newRequest: TravelRequest = {
        ...request as TravelRequest,
        id: this.travelRequests.length + 1,
        status: TravelRequestStatus.Pending,
        userId: this.currentUser?.id
      };
      
      this.travelRequests.unshift(newRequest);
      this.applyFilters();
      
      this.snackBar.open('Travel request created successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
      this.resetForm();
      this.isSubmitting = false;
    } else {
      // Real API implementation
      // Ensure userId is set
      if (!request.userId && this.currentUser) {
        request.userId = this.currentUser.id;
      }
      
      // Log the request being sent to the API
      console.log('Creating travel request with data:', request);
      
      this.travelRequestService.createTravelRequest(request).subscribe({
        next: (result) => {
          this.snackBar.open('Travel request created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadTravelRequests();
          this.resetForm();
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel request creation error:', error);
          
          this.snackBar.open('Error creating travel request: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
  
  /**
   * Update an existing travel request
   * @param id The ID of the request to update
   * @param request The updated request data
   */
  updateTravelRequest(id: number, request: Partial<TravelRequest>): void {
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // Mock implementation for development
      const index = this.travelRequests.findIndex(r => r.id === id);
      
      if (index !== -1) {
        this.travelRequests[index] = {
          ...this.travelRequests[index],
          ...request
        };
        
        this.applyFilters();
        
        this.snackBar.open('Travel request updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
      
      this.resetForm();
      this.isSubmitting = false;
    } else {
      // Real API implementation
      this.travelRequestService.updateTravelRequest(id, request).subscribe({
        next: (result) => {
          this.snackBar.open('Travel request updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadTravelRequests();
          this.resetForm();
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel request update error:', error);
          
          this.snackBar.open('Error updating travel request: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    }
  }
  
  /**
   * Delete a travel request
   * @param id The ID of the request to delete
   */
  deleteTravelRequest(id: number): void {
    // Show confirmation dialog before deleting
    const confirmDelete = window.confirm('Are you sure you want to delete this travel request?');
    
    if (!confirmDelete) {
      return;
    }
    
    this.isLoading = true;
    
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // Mock implementation for development
      const index = this.travelRequests.findIndex(r => r.id === id);
      
      if (index !== -1) {
        this.travelRequests.splice(index, 1);
        this.applyFilters();
        
        this.snackBar.open('Travel request deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
      
      this.isLoading = false;
    } else {
      // Real API implementation
      this.travelRequestService.deleteTravelRequest(id).subscribe({
        next: () => {
          this.snackBar.open('Travel request deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadTravelRequests();
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel request deletion error:', error);
          
          this.snackBar.open('Error deleting travel request: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
    }
  }
  
  /**
   * Update the status of a travel request
   * @param id The ID of the request
   * @param status The new status
   */
  /**
   * Check if the current user has admin role
   * @returns boolean indicating if user is an admin
   */
  isAdmin(): boolean {
    return this.currentUser?.userType === UserType.Admin;
  }

  updateStatus(id: number, status: TravelRequestStatus): void {
    // Check if user is admin
    if (!this.isAdmin()) {
      this.snackBar.open('Only administrators can change request status', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    this.isLoading = true;
    
    if (environment.apiUrl === 'mock' || !environment.apiUrl) {
      // Mock implementation for development
      const index = this.travelRequests.findIndex(r => r.id === id);
      
      if (index !== -1) {
        this.travelRequests[index].status = status;
        this.applyFilters();
        
        this.snackBar.open(`Travel request status updated to ${status}`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
      
      this.isLoading = false;
    } else {
      // Real API implementation
      this.travelRequestService.updateStatus(id, status).subscribe({
        next: (result) => {
          this.snackBar.open(`Travel request status updated to ${status}`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadTravelRequests();
        },
        error: (error) => {
          let errorMessage = 'An unknown error occurred';
          
          // Handle error based on its type and structure
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Try to extract more meaningful error information
            if (error.error && typeof error.error === 'object') {
              if (error.error.message) {
                errorMessage = error.error.message;
              } else if (error.error.title) {
                errorMessage = error.error.title;
              } else if (error.error.detail) {
                errorMessage = error.error.detail;
              }
            } else if (error.message) {
              errorMessage = error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            } else if (error.statusText) {
              errorMessage = `${error.status}: ${error.statusText}`;
            }
          }
          
          console.error('Travel request status update error:', error);
          
          this.snackBar.open('Error updating status: ' + errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    }
  }
  
  editRequest(request: TravelRequest): void {
    console.log('Editing request:', request);
    
    try {
      // First switch to New Request tab with a slight delay to ensure tab switch is complete
      this.selectedTabIndex = 0;
      
      // Use setTimeout to ensure the tab switch and form initialization is complete
      setTimeout(() => {
        try {
          // Set edit mode and current request
          this.isEditMode = true;
          this.currentRequestId = request.id || null;
          
          // Convert date strings to Date objects for the form
          const startDate = new Date(request.startDate);
          const endDate = new Date(request.endDate);
          
          // Validate dates
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date format in request');
          }
          
          console.log('Dates being set:', { 
            start: startDate,
            end: endDate
          });
          
          // Update form with request data
          this.travelRequestForm.patchValue({
            destination: request.destination,
            startDate: startDate,
            endDate: endDate,
            purpose: request.purpose,
            estimatedCost: request.estimatedCost,
            status: request.status
          }, { emitEvent: true });  // Ensure change events are emitted

          // Enable or disable the status control based on admin status
          const statusControl = this.travelRequestForm.get('status');
          if (statusControl) {
            if (this.isAdmin()) {
              statusControl.enable();
            } else {
              statusControl.disable();
            }
          }

          // Log form values after patch
          console.log('Form values after patch:', this.travelRequestForm.value);
          
          // Ensure the form is properly initialized
          this.travelRequestForm.markAsTouched();
          this.travelRequestForm.markAsDirty();
          
          // Trigger change detection
          this.travelRequestForm.updateValueAndValidity();
        } catch (error) {
          console.error('Error while setting form values:', error);
          this.snackBar.open('Error loading request data: ' + (error instanceof Error ? error.message : 'Unknown error'), 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          // Reset form in case of error
          this.resetForm();
        }
      }, 100);  // Small delay to ensure tab switch is complete
    } catch (error) {
      console.error('Error in editRequest:', error);
      this.snackBar.open('Error loading request for editing', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      // Reset form in case of error
      this.resetForm();
    }
  }
  
  /**
   * Reset the form to its initial state
   */
  resetForm(): void {
    this.isEditMode = false;
    this.currentRequestId = null;
    this.travelRequestForm.reset({
      status: TravelRequestStatus.Pending
    });
    
    // Disable status control for non-admins
    const statusControl = this.travelRequestForm.get('status');
    if (statusControl) {
      if (this.isAdmin()) {
        statusControl.enable();
      } else {
        statusControl.disable();
      }
    }
    
    // Use the more thorough form state initialization
    this.initializeFormState();
  }
  
  applyFilters(): void {
    console.log('Applying filters to travel requests:', this.travelRequests.length);
    
    if (!Array.isArray(this.travelRequests)) {
      console.error('travelRequests is not an array:', this.travelRequests);
      this.filteredRequests = [];
      return;
    }
    
    let filtered = [...this.travelRequests];
    
    // Status filter
    if (this.statusFilter !== 'all') {
      console.log('Filtering by status:', this.statusFilter);
      filtered = filtered.filter(request => 
        request.status === this.statusFilter as TravelRequestStatus
      );
    }
    
    // Text search
    if (this.searchText) {
      console.log('Filtering by search text:', this.searchText);
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(request => 
        request.destination.toLowerCase().includes(searchLower) ||
        request.purpose.toLowerCase().includes(searchLower)
      );
    }
    
    console.log('Filtered results:', filtered.length);
    this.filteredRequests = filtered;
  }
  
  onStatusFilterChange(status: TravelRequestStatus | 'all'): void {
    this.statusFilter = status;
    this.applyFilters();
  }
  
  onSearchChange(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchText = searchValue;
    this.applyFilters();
  }
  
  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      return;
    }
    
    console.log('Sorting data by:', sort.active, 'direction:', sort.direction);
    
    if (!Array.isArray(this.filteredRequests)) {
      console.error('filteredRequests is not an array:', this.filteredRequests);
      return;
    }
    
    this.filteredRequests = this.filteredRequests.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      
      switch (sort.active) {
        case 'id': return this.compare(a.id, b.id, isAsc);
        case 'destination': return this.compare(a.destination, b.destination, isAsc);
        case 'startDate': return this.compare(new Date(a.startDate).getTime(), new Date(b.startDate).getTime(), isAsc);
        case 'endDate': return this.compare(new Date(a.endDate).getTime(), new Date(b.endDate).getTime(), isAsc);
        case 'estimatedCost': return this.compare(a.estimatedCost, b.estimatedCost, isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        default: return 0;
      }
    });
  }
  
  private compare(a: number | string | undefined, b: number | string | undefined, isAsc: boolean): number {
    if (a === undefined) return isAsc ? -1 : 1;
    if (b === undefined) return isAsc ? 1 : -1;
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
  
  getStatusClass(status: TravelRequestStatus): string {
    return `status-${status.toLowerCase()}`;
  }
  
  /**
   * Format a date string for display
   * @param dateStr The date string to format
   * @returns Formatted date string
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Load a specific request for editing
   * @param id The ID of the request to edit
   */
  loadRequestForEdit(id: number): void {
    console.log('Loading request for edit, ID:', id); // Debug log
    
    // First switch to All Requests tab
    this.selectedTabIndex = 1;
    
    // If we already have the request in the local list
    const existingRequest = this.travelRequests.find(r => r.id === id);
    if (existingRequest) {
      console.log('Found existing request:', existingRequest); // Debug log
      // Switch to New Request tab and load the request for editing
      this.selectedTabIndex = 0;
      this.editRequest(existingRequest);
      return;
    }
    
    // Otherwise, fetch the request from the service
    this.travelRequestService.getTravelRequestById(id).subscribe({
      next: (request) => {
        console.log('Fetched request from service:', request); // Debug log
        // Switch to New Request tab and load the request for editing
        this.selectedTabIndex = 0;
        this.editRequest(request);
      },
      error: (error) => {
        let errorMessage = 'An unknown error occurred';
          
        // Handle error based on its type and structure
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null) {
          // Try to extract more meaningful error information
          if (error.error && typeof error.error === 'object') {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.title) {
              errorMessage = error.error.title;
            } else if (error.error.detail) {
              errorMessage = error.error.detail;
            }
          } else if (error.message) {
            errorMessage = error.message;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.statusText) {
            errorMessage = `${error.status}: ${error.statusText}`;
          }
        }
        
        console.error('Travel request loading error:', error);
        
        this.snackBar.open('Error loading travel request: ' + errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Handle tab change events
   * @param tabIndex The index of the selected tab
   */
  onTabChange(tabIndex: number): void {
    console.log('Tab changing to:', tabIndex);
    
    // If switching away from New Request tab while editing
    if (this.selectedTabIndex === 0 && tabIndex === 1 && this.isEditMode) {
      const hasChanges = this.travelRequestForm.dirty;
      if (hasChanges) {
        const confirm = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirm) {
          return;
        }
      }
    }

    this.selectedTabIndex = tabIndex;
    
    // If switching to "All Requests" tab (index 1)
    if (tabIndex === 1) {
      if (this.isEditMode) {
        this.resetForm();
      }
      // Refresh the requests list
      this.loadTravelRequests();
    }
    
    // If switching to "New Request" tab (index 0)
    if (tabIndex === 0) {
      if (!this.isEditMode) {
        this.resetForm();
      }
      // Ensure form is properly initialized
      setTimeout(() => {
        this.travelRequestForm.updateValueAndValidity();
        if (this.isEditMode) {
          this.markFormGroupTouched(this.travelRequestForm);
        }
      }, 100);
    }
    
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabIndex.toString());
    window.history.replaceState({}, '', url.toString());
  }
  
  /**
   * Check if the form has unsaved changes
   * @returns boolean indicating if form has been modified
   */
  hasFormChanges(): boolean {
    return this.travelRequestForm.dirty;
  }

  /**
   * Navigate to a specific tab
   * @param tabIndex The tab index to navigate to
   */
  navigateToTab(tabIndex: number): void {
    this.selectedTabIndex = tabIndex;
    
    // Reset form if navigating to new request tab
    if (tabIndex === 0 && this.isEditMode) {
      this.resetForm();
    }
  }
}
