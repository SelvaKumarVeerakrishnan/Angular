export enum UserType {
  Regular = 0,
  Admin = 1
}

// Helper function to check if a user is an admin
export function isAdmin(userType: UserType | undefined | null): boolean {
  return userType === UserType.Admin;
}

// Helper function to check if a user is an employee/regular user
export function isRegular(userType: UserType | undefined | null): boolean {
  return userType === UserType.Regular;
}
