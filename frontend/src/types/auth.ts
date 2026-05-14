export type UserRole = 'STUDENT' | 'ADMIN';

export type CurrentUser = {
  id: number;
  name: string;
  studentNo: string;
  role: UserRole;
};

export type LoginResult = {
  token: string;
  user: CurrentUser;
  expiresAt: string;
};
