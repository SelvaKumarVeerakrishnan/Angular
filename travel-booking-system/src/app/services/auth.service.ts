import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User } from '../models/user';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { RegisterDto, LoginDto, AuthResponseDto } from '../models/auth.model';

// JWT token payload interface
interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  email?: string;
  role?: string;
  userType?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;
  private tokenKey = 'auth_token';
  private userKey = 'currentUser';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    // Initialize the behavior subject
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Restore authentication state from localStorage if available
    if (this.isBrowser) {
      const storedUser = localStorage.getItem(this.userKey);
      const token = localStorage.getItem(this.tokenKey);
      
      if (storedUser && token) {
        try {
          // Check if token is valid before restoring state
          if (this.isTokenExpired()) {
            console.log('Clearing authentication state on application startup - token expired');
            this.clearAuthData();
            return;
          }
          
          const user = JSON.parse(storedUser);
          this.currentUserSubject.next(user);
          console.log('Restored authentication state from localStorage');
        } catch (error) {
          console.error('Failed to parse stored user data', error);
          this.clearAuthData();
        }
      } else {
        console.log('Clearing authentication state on application startup - no stored credentials');
      }
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginDto: LoginDto): Observable<AuthResponseDto> {
    const loginUrl = `${this.apiUrl}/auth/login`;
    console.log(`Making login request to: ${loginUrl}`);
    console.log('Login payload:', loginDto);
    
    return this.http.post<AuthResponseDto>(loginUrl, loginDto)
      .pipe(
        tap(response => {
          console.log('Login response received:', response);
          
          if (!response.token) {
          console.log('No token received in authentication response');
            throw new Error('Authentication failed: No token received');
          }
          
          console.log('Saving authentication token...');
          this.saveToken(response.token);
          
          // Log raw auth response to verify data
          console.log('Raw auth response:', {
            id: response.id,
            email: response.email, 
            userType: response.userType,
            userTypeType: typeof response.userType
          });
          
          const user = this.createUserFromAuth(response);
          console.log('Created user from auth response:', user);
          console.log('User is admin:', user.userType === 1, 'Role:', user.role);
          
          this.setCurrentUser(user);
          console.log('User authentication state updated, current user:', this.currentUserValue);
        }),
        catchError(error => {
          console.error('Login request failed:', error);
          
          let errorMessage = 'Login failed';
          
          if (error.status === 0) {
            errorMessage = 'Cannot connect to the server. Network error.';
          } else if (error.status === 401) {
            errorMessage = 'Invalid credentials';
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  signup(registerDto: RegisterDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/register`, registerDto)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.setCurrentUser(this.createUserFromAuth(response));
        })
      );
  }

  /**
   * Extracts user information from JWT token payload if available
   * @returns User information extracted from token or null if invalid
   */
  getUserFromToken(): User | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = this.parseJwtPayload(token);
      if (!payload) return null;

      // Extract user info from token payload
      // This assumes the JWT payload contains relevant user information
      // Adjust fields based on your actual token structure
      
      // Determine user type from token - handle both numeric and string representations
      let userType;
      let userTypeSource = 'default';
      
      console.log('JWT payload user type data:', {
        UserType: payload['UserType'],
        userType: payload['userType'],
        role: payload['role'],
        allClaims: Object.keys(payload)
      });
      
      // First prioritize the 'UserType' claim from the token (server sets it this way)
      if (payload['UserType'] !== undefined) {
        userTypeSource = 'UserType claim';
        // Handle different representations
        if (typeof payload['UserType'] === 'number') {
          userType = payload['UserType'];
        } else if (typeof payload['UserType'] === 'string') {
          // It could be "Admin"/"Regular" or "1"/"0"
          const userTypeStr = payload['UserType'].toLowerCase();
          if (userTypeStr === 'admin' || userTypeStr === '1') {
            userType = 1; // UserType.Admin
          } else if (userTypeStr === 'regular' || userTypeStr === '0' || userTypeStr === 'user') {
            userType = 0; // UserType.Regular
          } else {
            // Try parsing as number
            const parsed = parseInt(payload['UserType'], 10);
            userType = isNaN(parsed) ? 0 : (parsed === 1 ? 1 : 0);
          }
        }
      }
      // Then check if lowercase 'userType' is available
      else if (payload['userType'] !== undefined) {
        userTypeSource = 'userType claim';
        // Make sure it's treated as a number
        userType = typeof payload['userType'] === 'number' 
          ? payload['userType'] 
          : parseInt(String(payload['userType']), 10);
      } 
      // If userType is not available or parsing failed, fallback to role string
      else if (payload['role']) {
        userTypeSource = 'role claim';
        // Convert role string to UserType enum
        userType = payload['role'].toLowerCase() === 'admin' ? 1 : 0;
      }
      // Default to Regular user if no role info is available
      else {
        userTypeSource = 'default';
        userType = 0; // UserType.Regular
      }
      
      // Ensure userType is valid (0 or 1)
      userType = userType === 1 ? 1 : 0;
      
      console.log('Token user type determination:', {
        source: userTypeSource,
        rawValue: userTypeSource === 'UserType claim' ? payload['UserType'] : 
                  userTypeSource === 'userType claim' ? payload['userType'] : 
                  userTypeSource === 'role claim' ? payload['role'] : null,
        parsedUserType: userType,
        isAdmin: userType === 1
      });
      
      // Derive the role string from userType for consistency
      const role = userType === 1 ? 'Admin' : 'User';
        
      return {
        id: payload['id'] || 0,
        username: payload['email'] || payload['sub'] || '',
        email: payload['email'] || '',
        firstName: payload['firstName'] || '',
        lastName: payload['lastName'] || '',
        name: payload['name'] || `${payload['firstName'] || ''} ${payload['lastName'] || ''}`.trim(),
        role: role, // Use the derived role for consistency
        userType: userType,
        isActive: true
      } as User;
    } catch (error) {
      console.error('Error extracting user data from token:', error);
      return null;
    }
  }

  private createUserFromAuth(authResponse: AuthResponseDto): User {
    // Try to extract additional data from token if available
    const tokenUser = this.getUserFromToken();
    
    // Determine user type from auth response or token
    // Process all possible sources of user type information
    let userType;
    let userTypeSource = 'default';
    
    console.log('User type inputs:', { 
      authResponseUserType: authResponse.userType,
      authResponseUserTypeType: typeof authResponse.userType,
      tokenUserType: tokenUser?.userType, 
      tokenUserRole: tokenUser?.role
    });
    
    // First prioritize the authResponse userType as it's most authoritative
    if (authResponse.userType !== undefined && authResponse.userType !== null) {
      userTypeSource = 'authResponse';
      
      // Convert to number if it's a string representation
      if (typeof authResponse.userType === 'number') {
        userType = authResponse.userType;
      } else if (typeof authResponse.userType === 'string') {
        // Handle string that might be "Admin"/"User" or "1"/"0"
        const userTypeStr = authResponse.userType as string;
        if (userTypeStr.toLowerCase() === 'admin') {
          userType = 1; // UserType.Admin
        } else if (userTypeStr.toLowerCase() === 'user' || 
                  userTypeStr.toLowerCase() === 'regular') {
          userType = 0; // UserType.Regular
        } else {
          // Try parsing as number
          const parsed = parseInt(userTypeStr, 10);
          userType = isNaN(parsed) ? 0 : parsed;
        }
      } else {
        // For any other type, try to convert to number
        try {
          userType = Number(authResponse.userType);
          if (isNaN(userType)) userType = 0;
        } catch (e) {
          console.error('Failed to convert userType', e);
          userType = 0;
        }
      }
    }
    // Second, try token userType if available
    else if (tokenUser?.userType !== undefined && tokenUser?.userType !== null) {
      userTypeSource = 'tokenUserType';
      userType = tokenUser.userType;
    }
    // Third, check role string from token
    else if (tokenUser?.role) {
      userTypeSource = 'tokenRole';
      const tokenRole = tokenUser.role.toLowerCase();
      userType = tokenRole === 'admin' ? 1 : 0;
    }
    // Last resort, default to regular user
    else {
      userTypeSource = 'default';
      userType = 0; // Default to UserType.Regular
    }
    
    // Ensure userType is either 0 or 1, nothing else
    // Important: Using === 1 ensures only admin (1) stays admin, any other value becomes regular (0)
    userType = userType === 1 ? 1 : 0;
        
    // For consistency, always set role string based on userType
    const role = userType === 1 ? 'Admin' : 'User';
    
    // Enhanced logging for debugging user type determination
    console.log('User type determination complete:', { 
      source: userTypeSource,
      responseUserType: authResponse.userType, 
      responseUserTypeType: typeof authResponse.userType,
      tokenUserType: tokenUser?.userType, 
      tokenRole: tokenUser?.role,
      finalUserType: userType, 
      finalRole: role,
      isAdmin: userType === 1,
      user: {
        id: tokenUser?.id || authResponse.id || 0,
        username: authResponse.email,
        role: role,
        userType: userType
      }
    });
    
    return {
      id: tokenUser?.id || authResponse.id || 0,
      username: authResponse.email,
      firstName: authResponse.firstName,
      lastName: authResponse.lastName,
      name: `${authResponse.firstName} ${authResponse.lastName}`,
      email: authResponse.email,
      role: role,
      userType: userType,
      isActive: true
    } as User;
  }

  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const hasUser = !!this.currentUserValue;
    const hasToken = !!this.getToken();
    const isTokenValid = !this.isTokenExpired();
    
    const isAuth = hasUser && hasToken && isTokenValid;
    console.log(`Authentication check - User: ${hasUser}, Token: ${hasToken}, TokenValid: ${isTokenValid}, IsAuthenticated: ${isAuth}`);
    
    // If token is invalid but we have user data, clear auth data
    if (hasUser && hasToken && !isTokenValid) {
      console.warn('Token expired, clearing authentication state');
      this.clearAuthData();
    }
    
    // Only consider authenticated if both user data and token exist and token is valid
    return isAuth;
  }
  
  /**
   * Checks if the current JWT token is expired
   * @returns true if token is expired or invalid, false if valid
   */
  private isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = this.parseJwtPayload(token);
      if (!payload || !payload.exp) {
        console.error('Invalid token: missing expiration claim');
        return true;
      }
      
      // exp is in seconds, Date.now() is in milliseconds
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      // Add a small buffer (30 seconds) to account for clock skew
      const isExpired = currentTime > (expirationTime - 30000);
      
      if (isExpired) {
        console.log('Token has expired', {
          expiration: new Date(expirationTime).toISOString(),
          current: new Date(currentTime).toISOString()
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }

  /**
   * Parses and validates a JWT token
   * @param token The JWT token to parse
   * @returns The decoded payload or null if token is invalid
   */
  private parseJwtPayload(token: string): JwtPayload | null {
    if (!token) return null;

    try {
      // JWT consists of three parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid token format: not a JWT token');
        return null;
      }

      // Decode the payload (middle part)
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);
      
      if (!decodedPayload) {
        console.error('Failed to decode JWT payload');
        return null;
      }

      return JSON.parse(decodedPayload) as JwtPayload;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }

  /**
   * Decodes a base64url encoded string
   * @param input The base64url encoded string
   * @returns The decoded string
   */
  private base64UrlDecode(input: string): string {
    // Replace base64url encoding specific characters
    const base64 = input
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Pad the base64 string if needed
    const padding = base64.length % 4;
    const paddedBase64 = padding ? 
      base64 + '='.repeat(4 - padding) : 
      base64;
    
    try {
      // For browser environments
      if (this.isBrowser) {
        const binary = atob(paddedBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      } else {
        // For server-side rendering (SSR)
        // This is a fallback that won't execute in SSR environments
        // but prevents errors during compilation
        console.warn('JWT decoding not available in SSR context');
        return '';
      }
    } catch (error) {
      console.error('Error decoding base64url:', error);
      return '';
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserValue;
  }

  setCurrentUser(user: User): void {
    if (this.isBrowser) {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  saveToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  clearToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
    }
  }
  
  /**
   * Clear all authentication data including token and user data
   */
  clearAuthData(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUserSubject?.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Server Error ${error.status}: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
