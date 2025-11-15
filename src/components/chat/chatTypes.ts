/**
 * Chat Type Definitions - Microsoft Enterprise Pattern
 * Shared types for chat components
 */

import type { LoadingState } from './constants';

// ============================================================================
// ROLE STYLING
// ============================================================================
export interface RoleStyle {
  textColor: string;
  bgColor: string;
  ringClass: string;
  badge?: string;
}

// ============================================================================
// LOADING & PROGRESS
// ============================================================================
export interface LoadingStates {
  messages: LoadingState;
  sending: LoadingState;
  deleting: Set<string>;
  pinning: Set<string>;
  uploading: LoadingState;
}

export interface UploadProgress {
  percentage: number;
  bytesUploaded: number;
  totalBytes: number;
  fileName: string;
}
