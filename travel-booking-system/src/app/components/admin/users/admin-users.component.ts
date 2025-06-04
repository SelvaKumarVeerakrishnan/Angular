import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService, UserListDto, UpdateUserStatusDto } from '../../../services/user.service';
import { UserType } from '../../../models/user-type.enum';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatSnackBarModule
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss'
})
export class AdminUsersComponent implements OnInit {
  users: UserListDto[] = [];
  displayedColumns: string[] = ['name', 'email', 'userType', 'status', 'actions'];
  userTypes = UserType;
  
  // Helper to display user type as string
  getUserTypeLabel(type: UserType): string {
    return type === UserType.Admin ? 'Admin' : 'Regular';
  }

  constructor(
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  updateUserStatus(userId: number, userType: UserType, isActive: boolean): void {
    const updateDto: UpdateUserStatusDto = { userType, isActive };
    
    this.userService.updateUserStatus(userId, updateDto).subscribe({
      next: () => {
        this.snackBar.open('User status updated successfully', 'Close', {
          duration: 3000
        });
        this.loadUsers(); // Reload the users list
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.snackBar.open('Failed to update user status', 'Close', {
          duration: 3000
        });
      }
    });
  }

  viewUserDetails(userId: number): void {
    console.log('Viewing user details:', userId);
    // Implement user details view functionality
  }

  // Used by mat-select to compare numeric enum values
  compareUserTypes(o1: UserType, o2: UserType): boolean {
    return o1 === o2;
  }
}
