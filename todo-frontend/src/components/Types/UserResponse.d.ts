export interface ErrorMessage {
  field: string;
  message: string;
}
export interface UserResponse {
  errors: ErrorMessage[];
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface LoginResponse {
  login: UserResponse;
}
export interface RegisterUserResponse {
  registerUser: UserResponse;
}
