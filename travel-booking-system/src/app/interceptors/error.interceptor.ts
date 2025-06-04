import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error) => {
      // Handle SSL/HTTPS certificate errors
      if (error instanceof HttpErrorResponse) {
        if (error.status === 0) {
          // Status 0 usually means a connection error, which could be due to SSL issues
          console.error('SSL/HTTPS Connection Error:', error);
          
          return throwError(() => ({
            message: 'Unable to connect to the server. This may be due to an SSL certificate issue. Please ensure you trust the development certificate.',
            originalError: error
          }));
        }
        
        // Handle server errors (500 range)
        if (error.status >= 500) {
          console.error('Server Error:', error);
          
          return throwError(() => ({
            message: 'The server encountered an error. Please try again later.',
            originalError: error
          }));
        }

        // Handle client errors (400 range)
        if (error.status >= 400 && error.status < 500) {
          console.error('Client Error:', error);
          
          let errorMessage = 'An error occurred';
          
          if (error.error && typeof error.error === 'object') {
            if (error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error.title) {
              errorMessage = error.error.title;
            }
          }
          
          return throwError(() => ({
            message: errorMessage,
            originalError: error
          }));
        }
      }
      
      // For other errors
      console.error('Unexpected Error:', error);
      return throwError(() => ({
        message: 'An unexpected error occurred',
        originalError: error
      }));
    })
  );
};

