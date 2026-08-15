const serverEnv = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;

export const env = {
  ...serverEnv,
  isDevelopment: serverEnv.nodeEnv === "development",
  isProduction: serverEnv.nodeEnv === "production",
} as const;
