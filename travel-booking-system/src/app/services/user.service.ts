import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserType } from '../models/user-type.enum';

export interface UserListDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  isActive: boolean;
}

export interface UpdateUserStatusDto {
  userType: UserType;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserListDto[]> {
    return this.http.get<UserListDto[]>(this.apiUrl);
  }

  updateUserStatus(userId: number, update: UpdateUserStatusDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/status`, update);
  }
}
