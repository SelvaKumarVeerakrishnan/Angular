import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user';
import { Subscription } from 'rxjs';
import { UserType, isAdmin } from '../../../models/user-type.enum';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;
  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the auth service to get user updates
    this.authSubscription = this.authService.currentUser.subscribe({
      next: (user) => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
        console.log('Authentication state updated in header:', this.isAuthenticated);
      },
      error: (error) => {
        console.error('Error in auth subscription:', error);
        this.isAuthenticated = false;
      }
    });

    // Check initial auth state
    this.checkAuthState();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Check the current authentication state
   */
  private checkAuthState(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    console.log('Initial auth state in header:', this.isAuthenticated);
  }

  /**
   * Log the user out and redirect to login page
   */
  logout(): void {
    console.log('Logging out user...');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to the dashboard page
   */
  navigateToDashboard(): void {
    console.log('Navigating to dashboard...');
    this.router.navigate(['/dashboard']);
  }

  /**
   * Navigate to the travel requests page
   */
  navigateToTravelRequests(): void {
    console.log('Navigating to travel requests...');
    this.router.navigate(['/travel-requests']);
  }

  /**
   * Navigate to the user profile page
   */
  navigateToProfile(): void {
    console.log('Navigating to profile...');
    this.router.navigate(['/profile']);
  }

  /**
   * Check if the current user is an admin
   */
  isAdmin(): boolean {
    return this.currentUser?.userType === UserType.Admin;
  }

  /**
   * Check if the current user is an employee
   */
  isRegular(): boolean {
    return this.currentUser?.userType === UserType.Regular;
  }

  /**
   * Navigate to the admin users management page
   */
  navigateToAdminUsers(): void {
    console.log('Navigating to admin users management...');
    this.router.navigate(['/admin/users']);
  }
}
