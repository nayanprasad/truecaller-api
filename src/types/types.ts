import { z } from "zod";
import { searchByNameSchema } from "@/models/validators";

// Type for the validated search parameters
export type SearchByNameParams = z.infer<typeof searchByNameSchema>;

// Types for database query results
export interface UserSearchResult {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface ContactSearchResult {
  id: string;
  name: string;
  phoneNumber: string;
}

// Type for spam information
export interface SpamInfo {
  isLikelySpam: boolean;
  reportCount: number;
  spamLikelihood: number;
}

// Type for combined search results with source and priority
export interface SearchResultWithSource {
  id: string;
  name: string;
  phoneNumber: string;
  source: "user" | "contact";
  priority: number;
}

// Type for search results with spam information
export interface SearchResultWithSpamInfo {
  id: string;
  name: string;
  phoneNumber: string;
  source: "user" | "contact";
  priority: number;
  spamInfo: SpamInfo;
}

// Type for the final response data item
export interface SearchResponseDataItem {
  name: string;
  phoneNumber: string;
  spamInfo: SpamInfo;
}

// Type for pagination information
export interface PaginationInfo {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Type for the complete search response
export interface SearchResponse {
  success: boolean;
  pagination: PaginationInfo;
  data: SearchResponseDataItem[];
}

// Type for spam info map returned by getBulkSpamInfo
export interface SpamInfoMap {
  [phoneNumber: string]: SpamInfo;
}
