import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { LoginDto, RegisterDto, AuthResponseDto } from '../models/auth.model';
import { User } from '../models/user';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  // Mock JWT token for testing
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTIzLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiVXNlciIsImV4cCI6NDEwMjQ0NDgwMH0.8V2td6LgLjBJ7UMFZM-obdnx5LR-J-iNK9AKMiR_t4Y';
  
  // Sample user data
  const mockUser: User = {
    id: 123,
    username: 'test@test.com',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    name: 'Test User',
    role: 'User',
    isActive: true
  };

  // Sample auth response
  const mockAuthResponse: AuthResponseDto = {
    token: mockToken,
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User'
  };

  beforeEach(() => {
    // Create spy for Router
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'parseUrl']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    // Get service and HTTP mock controller
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Verify that no requests are outstanding
    httpMock.verify();
  });

  /**
   * Test: Service should be created
   * Category: Initialization
   * Description: Verifies that the service can be properly instantiated
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Test: Login should authenticate a user
   * Category: Authentication
   * Description: Verifies that the login method correctly processes the auth response
   */
  it('should authenticate user on login', fakeAsync(() => {
    // Arrange
    const loginDto: LoginDto = { email: 'test@test.com', password: 'password123' };
    let authResult: AuthResponseDto | undefined;
    
    // Act
    service.login(loginDto).subscribe(result => {
      authResult = result;
    });

    // Simulate server response
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);
    tick();

    // Assert
    expect(authResult).toEqual(mockAuthResponse);
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe(mockToken);
    expect(service.getCurrentUser()).toBeTruthy();
    expect(service.getCurrentUser()?.email).toBe('test@test.com');
  }));

  /**
   * Test: Signup should create a new user
   * Category: User Management
   * Description: Verifies that the signup method sends correct request and processes response
   */
  it('should register new user on signup', fakeAsync(() => {
    // Arrange
    const registerDto: RegisterDto = {
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123'
    };

    // Act
    service.signup(registerDto).subscribe();

    // Simulate server response
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(registerDto);
    req.flush(mockAuthResponse);
    tick();

    // Assert
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getToken()).toBe(mockToken);
  }));

  /**
   * Test: Logout should clear authentication data
   * Category: Authentication
   * Description: Verifies that logout clears user data and token
   */
  it('should clear auth data on logout', () => {
    // Arrange
    // Setup authenticated state first
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    service.setCurrentUser(mockUser);
    
    // Act
    service.logout();
    
    // Assert
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  /**
   * Test: isAuthenticated should verify token validity
   * Category: Security
   * Description: Verifies that isAuthenticated checks both token presence and validity
   */
  it('should check token validity in isAuthenticated', () => {
    // Arrange - set up with valid user but no token
    service.setCurrentUser(mockUser);
    
    // Assert - should not be authenticated without token
    expect(service.isAuthenticated()).toBeFalse();
    
    // Arrange - add token
    service.saveToken(mockToken);
    
    // Assert - should be authenticated with both user and valid token
    expect(service.isAuthenticated()).toBeTrue();
  });

  /**
   * Test: Token parsing should extract user data
   * Category: Security
   * Description: Verifies that JWT token parsing correctly extracts user information
   */
  it('should extract user data from token', () => {
    // Arrange
    service.saveToken(mockToken);
    
    // Act
    const user = service.getUserFromToken();
    
    // Assert
    expect(user).toBeTruthy();
    expect(user?.id).toBe(123);
    expect(user?.email).toBe('test@test.com');
    expect(user?.role).toBe('User');
  });

  /**
   * Test: Login error handling
   * Category: Error Handling
   * Description: Verifies proper error handling during login process
   */
  it('should handle login errors appropriately', fakeAsync(() => {
    // Arrange
    const loginDto: LoginDto = { email: 'test@test.com', password: 'wrong-password' };
    let errorMessage: string | undefined;
    
    // Act
    service.login(loginDto).subscribe(
      () => fail('Expected error, got success'),
      error => {
        errorMessage = error.message;
      }
    );

    // Simulate server error response
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(
      { message: 'Invalid credentials' },
      { status: 401, statusText: 'Unauthorized' }
    );
    tick();

    // Assert
    expect(errorMessage).toBe('Invalid credentials');
    expect(service.isAuthenticated()).toBeFalse();
  }));

  /**
   * Test: Automatically restore authentication from localStorage
   * Category: Persistence
   * Description: Verifies that authentication state is restored from localStorage on startup
   */
  it('should restore auth state from localStorage', () => {
    // Arrange - setup localStorage with auth data
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    
    // Act - create a new instance to test initialization logic
    TestBed.resetTestingModule();
    const routerSpy = jasmine.createSpyObj('Router', ['navigate', 'parseUrl']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    
    const newService = TestBed.inject(AuthService);
    
    // Assert
    expect(newService.isAuthenticated()).toBeTrue();
    expect(newService.getCurrentUser()).toBeTruthy();
    expect(newService.getCurrentUser()?.id).toBe(123);
  });
});

import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
