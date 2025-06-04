import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LoginDto } from '../../../models/auth.model';
import { environment } from '../../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize the login form with validators
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    // Return if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Check authentication state before login attempt
    console.log('Auth state before login attempt:', { 
      isAuthenticated: this.authService.isAuthenticated(),
      currentUser: this.authService.getCurrentUser(),
      token: this.authService.getToken()
    });
    const email = this.f['email'].value;
    const password = this.f['password'].value;

    const loginDto: LoginDto = {
      email: email,
      password: password
    };
    console.log('Attempting login with:', { email: loginDto.email });
    
    // Log the HTTP request details
    console.log('Login request URL:', `${environment.apiUrl}/auth/login`);
    console.log('Login request payload:', loginDto);
    
    this.authService.login(loginDto)
      .subscribe({
        next: (response) => {
          console.log('Login successful:', response);
          this.isLoading = false;
          
          // Verify authentication state before navigation
          const isAuthenticated = this.authService.isAuthenticated();
          console.log('Is authenticated after login:', isAuthenticated);
          
          if (isAuthenticated) {
            // Log token and user details
            console.log('Token after login:', this.authService.getToken());
            console.log('User details after login:', this.authService.getCurrentUser());
            
            // Verify routes are correctly loaded
            console.log('Available routes:', this.router.config.map(r => r.path));
            
            console.log('Navigating to dashboard...');
            this.router.navigate(['/dashboard']).then(success => {
              console.log('Navigation result:', success ? 'successful' : 'failed');
              
              // If navigation fails, check route configuration
              if (!success) {
                console.error('Navigation failed. Current routes:', this.router.config);
                console.error('Attempting alternative navigation...');
                // Try navigating with a different approach
                window.location.href = '/dashboard';
              }
            });
          } else {
            console.error('Authentication state not set correctly after successful login');
            this.errorMessage = 'Login succeeded but authentication state was not set correctly';
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isLoading = false;
          
          // Detailed error tracking
          if (error instanceof HttpErrorResponse) {
            console.error('HTTP Error Details:', {
              status: error.status,
              statusText: error.statusText,
              url: error.url,
              headers: error.headers?.keys().map(key => `${key}: ${error.headers?.get(key)}`),
              error: error.error,
              message: error.message
            });
          }
          
          // Provide more detailed error information
          if (error.status === 0) {
            this.errorMessage = 'Cannot connect to the server. Please check your network connection.';
            console.error('Network error - cannot reach the API server');
            
            // Check CORS configuration
            console.error('Possible CORS issue. Check if API allows requests from:', window.location.origin);
          } else if (error.status === 401) {
            this.errorMessage = 'Invalid username or password';
            console.error('Authentication failed - invalid credentials');
          } else if (error.status === 404) {
            this.errorMessage = 'Login API endpoint not found. Check API URL configuration.';
            console.error('API endpoint not found:', `${environment.apiUrl}/auth/login`);
          } else {
            this.errorMessage = error.message || (error.error && typeof error.error === 'string' ? error.error : JSON.stringify(error.error)) || 'An unknown error occurred during login';
            console.error('Other error during login:', error.status, error.message);
          }
          
          // Check final authentication state after error
          console.log('Auth state after failed login attempt:', { 
            isAuthenticated: this.authService.isAuthenticated(),
            token: this.authService.getToken()
          });
        }
      });
  }
}
