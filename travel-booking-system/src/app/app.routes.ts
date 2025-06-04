import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login/login.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TravelRequestComponent } from './components/travel-request/travel-request.component';
import { authGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [() => authGuard()]
  },
  {
    path: 'travel-requests',
    component: TravelRequestComponent,
    canActivate: [() => authGuard()]
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./components/admin/users/admin-users.component')
          .then(m => m.AdminUsersComponent)
      }
    ]
  },
  // Fallback route for any undefined routes
  { 
    path: '**', 
    redirectTo: 'login' 
  }
];
