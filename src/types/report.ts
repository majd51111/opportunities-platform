export type ReportType = "engagement" | "opportunities" | "users";

export type ReportSummary = {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: string;
};
