export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  mobile: string | null;
  dob: string | null;
  gender: Gender | null;
  photoUrl: string | null;
  isProfileComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
  isProfileComplete: boolean;
}

export interface CompleteProfilePayload {
  name: string;
  mobile: string;
  dob: string;
  gender: Gender;
}

export interface BackendErrorBody {
  success: false;
  message: string;
  code?: string;
  details?: unknown;
}
