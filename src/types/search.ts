import type { OpportunityFilters } from "./opportunity";

export type SearchParams = OpportunityFilters & {
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "title";
  sortOrder?: "asc" | "desc";
};

export type SearchResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
