import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../services/auth.service';
import { UserType } from '../../../models/user-type.enum';

// Custom validator for password matching
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  return password && confirmPassword && password.value !== confirmPassword.value 
    ? { passwordMismatch: true } 
    : null;
};

// Age validator function
export function ageValidator(minAge: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    
    const today = new Date();
    const birthDate = new Date(control.value);
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Adjust age if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age < minAge ? { 'underage': true } : null;
  };
};

@Component({
  selector: 'app-signup',
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
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
  userTypes = UserType;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', [Validators.required, ageValidator(18)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
      // userType handled by backend
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validators: passwordMatchValidator });

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  get f() { return this.signupForm.controls; }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerData = {
      email: this.f['email'].value,
      firstName: this.f['firstName'].value,
      lastName: this.f['lastName'].value,
      dateOfBirth: this.f['dateOfBirth'].value,
      phoneNumber: this.f['phoneNumber'].value,
      // UserType is managed by the backend
      password: this.f['password'].value
    };

    this.authService.signup(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login'], { 
          queryParams: { registered: 'true' } 
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }
}
