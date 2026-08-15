export type OpportunityStatus = "draft" | "published" | "archived";

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  status: OpportunityStatus;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityFilters = {
  query?: string;
  status?: OpportunityStatus;
};
