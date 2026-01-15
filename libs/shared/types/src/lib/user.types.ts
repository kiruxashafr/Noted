export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export enum UserAvatarKeys {
  ORIGINAL = "original",
  MINI_AVATAR = "mini_avatar",
}
