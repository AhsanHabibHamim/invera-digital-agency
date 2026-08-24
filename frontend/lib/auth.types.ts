export interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'team' | 'client';
  avatarUrl?: string;
  company?: string;
  phone?: string;
  bio?: string;
  nickname?: string;
  designation?: string;
  country?: string;
  timezone?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
