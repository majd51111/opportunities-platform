export type AuthSession = {
  userId: string;
  role: "user" | "admin" | "support";
  expiresAt: string;
};
