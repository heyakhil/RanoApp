export type Nullable<T> = T | null;

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export type {
  AuthSession,
  AuthUser,
  CompleteProfilePayload,
  Gender,
} from './auth';
