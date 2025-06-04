import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { TravelRequestService } from './services/travel-request.service';
import { AuthService } from './services/auth.service';
import { errorInterceptor } from './interceptors/error.interceptor';
import { authInterceptor } from './interceptors/auth.interceptor';

// Function to check auth state on application initialization
export function initializeApp(authService: AuthService) {
  return () => {
    console.log('Checking authentication state on application startup');
    
    // Only clear auth data if not authenticated (token is invalid or expired)
    if (!authService.isAuthenticated()) {
      console.log('Authentication token invalid or expired, clearing auth data');
      authService.clearAuthData();
    } else {
      console.log('Valid authentication token found, maintaining session');
    }
    
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideAnimations(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    TravelRequestService,
    AuthService,
    // Add APP_INITIALIZER to clear auth state on startup
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true
    }
  ]
};
