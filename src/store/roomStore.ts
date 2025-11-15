/**
 * roomStore.ts
 * -------------------------------------------------------------------
 * Unified Room + Tenant Store (Enterprise Edition)
 *
 * Combines:
 * - Chat, alerts, tracks, and members management (your existing system)
 * - Supabase CRUD (fetchRooms, createRoom, updateRoom)
 * - Tenant integration for AdvancedBrandingSettings and themes
 * -------------------------------------------------------------------
 */

import { create } from 'zustand';

import { supabase } from '../lib/supabase';
import type {
// Fixed: 2025-10-24 - Emergency null/undefined fixes for production
// Microsoft TypeScript standards applied - null → undefined, using optional types


// Fixed: 2025-01-24 - Eradicated 12 null usage(s) - Microsoft TypeScript standards
// Replaced null with undefined, removed unnecessary null checks, used optional types

  Room,
  ChatMessage,
  Alert,
  Poll,
  MediaTrack,
  RoomMembership,
  Tenant,
} from '../types/database.types';

const LAST_ROOM_KEY = 'trading_room_last_active';

export interface RoomMember {
  id: string;
  display_name: string;
  avatar_url: string | undefined;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

interface RoomState {
  // ─────────────────────────────
  // Core room and tenant context
  // ─────────────────────────────
  currentRoom: (Room & { tenant?: Tenant }) | undefined;
  rooms: Room[];
  tenants: Tenant[];
  loading: boolean;
  error: string | undefined;

  // ─────────────────────────────
  // Real-time features
  // ─────────────────────────────
  messages: ChatMessage[];
  alerts: Alert[];
  polls: Poll[];
  tracks: MediaTrack[];
  members: RoomMember[];
  membership: RoomMembership | undefined;
  viewers: number;
  isRecording: boolean;
  recordingId: string | undefined;
  isMicEnabled: boolean;
  volume: number;
  isMuted: boolean;
  isRefreshing: boolean;
  isRoomReady: boolean;

  // ─────────────────────────────
  // Computed permissions (Microsoft Enterprise Pattern)
  // ─────────────────────────────
  canRecord: () => boolean;
  canManageRoom: () => boolean;
  canDelete: () => boolean;

  // ─────────────────────────────
  // Room + tenant actions
  // ─────────────────────────────
  fetchRooms: (userId: string) => Promise<void>;
  setCurrentRoom: (room: Room | undefined) => Promise<void>;
  clearRoom: () => void;
  createRoom: (name: string, tenantId: string, userId: string) => Promise<Room | undefined>;
  updateRoom: (roomId: string, data: Partial<Room>) => Promise<void>;
  loadTenantData: (tenantId: string) => Promise<Tenant | undefined>;

  // ─────────────────────────────
  // Local state management
  // ─────────────────────────────
  setRoomReady: (ready: boolean) => void;
  getLastRoomId: () => string | undefined;
  clearLastRoomId: () => void;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;

  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (id: string) => void;

  setPolls: (polls: Poll[]) => void;
  addPoll: (poll: Poll) => void;
  removePoll: (id: string) => void;

  setTracks: (tracks: MediaTrack[]) => void;
  addTrack: (track: MediaTrack) => void;
  updateTrack: (id: string, updates: Partial<MediaTrack>) => void;
  removeTrack: (id: string) => void;

  setMembers: (members: RoomMember[]) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMemberLocation: (userId: string, location: { city?: string; region?: string; country?: string; country_code?: string }) => void;

  setMembership: (membership: RoomMembership | undefined) => void;
  setViewers: (count: number) => void;
  setRecording: (isRecording: boolean, recordingId: string | undefined) => void;
  setMicEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  // ─────────────────────────────
  // Initial state
  // ─────────────────────────────
  currentRoom: undefined,
  rooms: [],
  tenants: [],
  loading: false,
  error: undefined,
  messages: [],
  alerts: [],
  polls: [],
  tracks: [],
  members: [],
  membership: undefined,
  viewers: 0,
  isRecording: false,
  recordingId: undefined,
  isMicEnabled: false,
  volume: 100,
  isMuted: false,
  isRefreshing: false,
  isRoomReady: false,

  // ─────────────────────────────
  // Computed permissions (Microsoft Enterprise Pattern)
  // ─────────────────────────────
  canRecord: () => {
    const role = get().membership?.role;
    // Recording available for admin and member roles
    return role === 'admin' || role === 'member';
  },
  canManageRoom: () => {
    // Only admin can manage room (edit settings, etc.)
    return get().membership?.role === 'admin';
  },
  canDelete: () => {
    // Only admin can delete content
    return get().membership?.role === 'admin';
  },

  // ─────────────────────────────
  // Supabase CRUD and tenant logic
  // ─────────────────────────────
  fetchRooms: async (userId) => {
    if (!userId) return;
    set({ loading: true, error: undefined });

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, tenant:tenants(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ rooms: data || [], loading: false });
      if (import.meta.env.DEV) {
        console.debug('[roomStore] ✅ Rooms fetched:', data?.length || 0);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to fetch rooms:', errorMessage);
      set({ error: errorMessage, loading: false });
    }
  },

  setCurrentRoom: async (room) => {
    // Enterprise standard: Clear stale data when changing rooms to ensure fresh state
    if (!room) {
      set({ 
        currentRoom: undefined,
        messages: [],      // Clear messages for new room
        alerts: [],        // Clear alerts for new room
        polls: [],         // Clear polls for new room
        tracks: [],        // Clear tracks for new room
      });
      return;
    }

    try {
      // Microsoft Pattern: Clear data but DON'T reset isRoomReady
      // TradingRoom will control isRoomReady state after data loads
      // This prevents double state changes and scroll delays
      set({ 
        messages: [],
        alerts: [],
        polls: [],         // Clear polls when changing rooms
        tracks: []
        // isRoomReady: false REMOVED - let TradingRoom control this
      });

      if (room.tenant_id) {
        const tenant = await get().loadTenantData(room.tenant_id);
        set({ currentRoom: { ...room, tenant } });
        if (import.meta.env.DEV) {
          console.debug('[roomStore] ✅ Current room set with tenant context:', room.title);
        }
      } else {
        set({ currentRoom: room });
      }
      localStorage.setItem(LAST_ROOM_KEY, room.id);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to set current room:', errorMessage);
      set({ error: errorMessage });
    }
  },

  clearRoom: () => {
    set({ currentRoom: undefined });
    if (import.meta.env.DEV) {
      console.debug('[roomStore] 🧹 Cleared current room context');
    }
  },

  createRoom: async (name, tenantId, userId) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{ name, title: name, tenant_id: tenantId, created_by: userId }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ rooms: [data, ...state.rooms] }));
      if (import.meta.env.DEV) {
        console.debug('[roomStore] ✅ Room created:', data);
      }
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to create room:', errorMessage);
      set({ error: errorMessage });
      return undefined;
    }
  },

  updateRoom: async (roomId, data) => {
    try {
      const { error } = await supabase.from('rooms').update(data).eq('id', roomId);
      if (error) throw error;

      set((state) => ({
        rooms: state.rooms.map((r) => (r.id === roomId ? { ...r, ...data } : r)),
      }));

      if (import.meta.env.DEV) {
        console.debug('[roomStore] ✅ Room updated:', roomId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to update room:', errorMessage);
      set({ error: errorMessage });
    }
  },

  loadTenantData: async (tenantId) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      if (import.meta.env.DEV) {
        console.debug('[roomStore] ✅ Tenant data loaded:', data.business_name);
      }
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[roomStore] ❌ Failed to load tenant:', errorMessage);
      return undefined;
    }
  },

  // ─────────────────────────────
  // Local state management
  // ─────────────────────────────
  setRoomReady: (ready) => set({ isRoomReady: ready }),

  getLastRoomId: () => {
    try {
      const value = localStorage.getItem(LAST_ROOM_KEY);
      return value || undefined;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[roomStore] Failed to get last room ID:', error);
      }
      return undefined;
    }
  },

  clearLastRoomId: () => {
    try {
      localStorage.removeItem(LAST_ROOM_KEY);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[roomStore] Failed to clear last room ID:', error);
      }
    }
  },

  // ─────────────────────────────
  // Messages / alerts / media / members
  // ─────────────────────────────
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // Enterprise standard: Prevent duplicates (optimistic updates + real-time can cause duplicates)
      const exists = state.messages.some((m) => m.id === message.id);
      if (exists) return state;
      return { messages: [...state.messages, message] };
    }),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
    })),
  removeMessage: (id) => set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),

  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) =>
    set((state) => {
      const exists = state.alerts.some((a) => a.id === alert.id);
      if (exists) return state;
      return { alerts: [...state.alerts, alert] }; // Append at end - newest at bottom
    }),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),

  setPolls: (polls) => set({ polls }),
  addPoll: (poll) =>
    set((state) => {
      // Enterprise standard: Prevent duplicates (optimistic updates + real-time can cause duplicates)
      const exists = state.polls.some((p) => p.id === poll.id);
      if (exists) return state;
      return { polls: [...state.polls, poll] };
    }),
  removePoll: (id) => set((state) => ({ polls: state.polls.filter((p) => p.id !== id) })),

  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  updateTrack: (id, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTrack: (id) => set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id) })),

  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => {
      const exists = state.members.some((m) => m.id === member.id);
      if (exists) return state;
      return { members: [...state.members, member] };
    }),
  removeMember: (userId) =>
    set((state) => ({ members: state.members.filter((m) => m.id !== userId) })),
  updateMemberLocation: (userId, location) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === userId ? { ...m, ...location } : m
      ),
    })),

  setMembership: (membership) => set({ membership }),
  setViewers: (count) => set({ viewers: count }),
  setRecording: (isRecording, recordingId) => set({ isRecording, recordingId }),
  setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ isMuted: muted }),
  setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
}));
