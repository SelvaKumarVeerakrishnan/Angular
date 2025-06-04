import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserType } from '../models/user-type.enum';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.userType === UserType.Admin) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
