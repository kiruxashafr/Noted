export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
}

export interface AccountResponse {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
