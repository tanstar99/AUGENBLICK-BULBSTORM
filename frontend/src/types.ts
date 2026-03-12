// Re-export all types from types/index.ts
export * from "./types/index";

// Legacy types (kept for backward compatibility)
export interface MaterialListing {
  id: string;
  name: string;
  category: string;
  weight: number;
  co2Saved: number;
  arModelUrl?: string;
}

export interface PassportBlock {
  hash: string;
  prevHash: string;
  timestamp: string | number;
  action: string;
}
