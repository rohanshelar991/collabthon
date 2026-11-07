export type UserRole = 'student' | 'client' | 'admin';

export function readableRole(role?: UserRole) {
  switch (role) {
    case 'student':
      return 'Student';
    case 'client':
      return 'Client';
    case 'admin':
      return 'Admin';
    default:
      return 'Unknown';
  }
}
