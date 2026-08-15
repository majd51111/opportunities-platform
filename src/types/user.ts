export type UserRole = "user" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};
