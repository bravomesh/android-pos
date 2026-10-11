import { useSyncExternalStore } from "react";
import SyncService from "./SyncService";

export interface SyncState {
  mode: "off" | "till" | "viewer";
  url: string;
  key: string;
  /** Changes on the shop phone that have not reached the cloud yet. */
  dirty: boolean;
  syncedAt?: string;
  busy: boolean;
  error: string;
  /** Goes up each time a viewer receives new records, so screens can reload. */
  version: number;
}

export const useSync = () => useSyncExternalStore(SyncService.subscribe, SyncService.getState) as SyncState;
