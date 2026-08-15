export const routes = {
  public: {
    home: "/",
    opportunities: "/opportunities",
    search: "/search",
  },
  auth: {
    login: "/login",
    register: "/register",
  },
  platform: {
    favorites: "/favorites",
    profile: "/profile",
    reports: "/reports",
  },
  admin: {
    dashboard: "/admin",
    opportunities: "/admin/opportunities",
    users: "/admin/users",
    reports: "/admin/reports",
  },
  api: {
    auth: "/api/auth",
    opportunities: "/api/opportunities",
    favorites: "/api/favorites",
    search: "/api/search",
    reports: "/api/reports",
    admin: "/api/admin",
  },
} as const;

export type AppRoute =
  | (typeof routes.public)[keyof typeof routes.public]
  | (typeof routes.auth)[keyof typeof routes.auth]
  | (typeof routes.platform)[keyof typeof routes.platform]
  | (typeof routes.admin)[keyof typeof routes.admin];
