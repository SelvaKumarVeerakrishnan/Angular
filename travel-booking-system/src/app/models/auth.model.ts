import { UserType } from './user-type.enum';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  isActive: boolean;
}

