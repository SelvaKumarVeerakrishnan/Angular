import { UserType } from './user-type.enum';

export interface User {
  id: number;
  username: string;
  email: string;
  password?: string;  // Optional as it should only be used for registration/login
  firstName: string;
  lastName: string;
  userType: UserType;
  isActive: boolean;
  createdAt?: Date;
  name?: string; // Optional to accommodate the original interface
  role?: string; // Optional to accommodate the original interface
}
