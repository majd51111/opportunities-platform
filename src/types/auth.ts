export type AuthSession = {
  userId: string;
  role: "user" | "admin";
  expiresAt: string;
};
