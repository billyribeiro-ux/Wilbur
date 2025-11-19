/**
 * App.tsx — Root Application Shell
 * Microsoft Enterprise Architecture version
 * 
 * CRITICAL FIX: Moved ALL component definitions outside App() to prevent re-creation
 * on every render, which was causing infinite mount/unmount cycles downstream
 */

import { useEffect, useState, type FC, type ReactNode } from 'react';
import '../icons/fa';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FluentProvider, webDarkTheme, Spinner, type Theme } from '@fluentui/react-components';
import { WhiteboardSurface } from '../features/whiteboard/components/WhiteboardSurface';
import { WhiteboardCanvas } from '../features/whiteboard/components/WhiteboardCanvas';
import { WhiteboardToolbar } from '../features/whiteboard/components/WhiteboardToolbar';
import { useWhiteboardStore } from '../features/whiteboard/state/whiteboardStore';

// Removed unused supabase import - authStore.initialize() is single source of truth
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { NotesView } from '../components/trading/NotesView';
import { TestTradingRoomShell } from '../components/trading/TestTradingRoomShell';
import type { Session, User } from '@supabase/supabase-js';
import { ToastContainer } from '../components/ToastContainer';
import { EnhancedAuthPage } from '../components/icons/EnhancedAuthPage';
import { ImageModal } from '../components/modals/ImageModal';
import { RoomSelector } from '../components/rooms/RoomSelector';
import { TradingRoomWrapper } from '../components/trading/TradingRoomWrapper';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// 🔥 CRITICAL: Hoist ProtectedRoute outside to prevent recreation
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { session, initialized } = useAuthStore();
  
  if (!initialized) {
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    // Fast-path: allow test whiteboard route to render immediately without auth/session
    if (path.startsWith('/__test_whiteboard')) {
      return (
        <FluentProvider theme={webDarkTheme} dir="ltr">
          <TestWhiteboard />
        </FluentProvider>
      );
    }
    return (
      <FluentProvider theme={webDarkTheme} dir="ltr">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#111827',
          }}
        >
          <Spinner label="Loading Trading Platform..." />
        </div>
      </FluentProvider>
    );
  }

  if (!session) {
    console.log('[ProtectedRoute] No session, redirecting to login');
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Test-session injector for E2E routes (bypasses real auth for deterministic tests)
const InjectTestSession: FC<{ children: ReactNode }> = ({ children }) => {
  const { initialized, session } = useAuthStore();
  useEffect(() => {
    if (initialized && !session) {
      // Minimal fake user/session (satisfies TradingRoom + ProtectedRoute expectations)
      const fakeUser: Partial<User> = {
        id: 'test-user',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        is_anonymous: false,
        user_metadata: {},
        app_metadata: {},
      };
      const fakeSession: Partial<Session> = {
        access_token: 'test-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'test-refresh-token',
        user: fakeUser as User,
      };
      // Directly set session in store
      useAuthStore.getState().setSession(fakeSession as Session);
    }
  }, [initialized, session]);
  return <>{children}</>;
};

// Test Trading Room route wrapper (grabs param and renders room wrapper)
const TestTradingRoom: FC = () => {
  return (
    <InjectTestSession>
      <TestTradingRoomShell />
    </InjectTestSession>
  );
};

// Test Whiteboard route wrapper - Microsoft-quality test harness
const TestWhiteboard: FC = () => {
  // Get viewport dimensions
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  // Expose store for E2E tests
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__WB_STORE__ = useWhiteboardStore;
    }

    // Handle window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <InjectTestSession>
      <div style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        backgroundColor: '#1a1a1a'
      }}>
        <WhiteboardSurface
          width={dimensions.width}
          height={dimensions.height}
        >
          <WhiteboardCanvas
            width={dimensions.width}
            height={dimensions.height}
            canAnnotate={true}
          />
          <WhiteboardToolbar />
        </WhiteboardSurface>
      </div>
    </InjectTestSession>
  );
};

// 🔥 CRITICAL: AppRoutes component outside App() to prevent re-creation
const AppRoutes: FC = () => {
  const { session } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const navigate = useNavigate();

  return (
    <FluentProvider theme={(currentTheme as Partial<Theme>) || webDarkTheme} dir="ltr">
      <Routes>
        {/* Public routes - session-based check */}
        <Route 
          path="/auth" 
          element={!session ? <EnhancedAuthPage /> : <Navigate to="/" replace />} 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoomSelector onSelectRoom={(room) => navigate(`/room/${room.id}`)} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <ProtectedRoute>
              <TradingRoomWrapper />
            </ProtectedRoute>
          }
        />

        {/* Test-only NotesView route (now always included for E2E reliability) */}
        <Route
          path="/__test_notes"
          element={
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <NotesView
                roomId="test-room"
                roomName="Test Room"
                isAdmin={true}
                autoInit={true}
              />
            </div>
          }
        />
        {/* Test-only Trading Room route (bypasses ProtectedRoute) */}
        <Route path="/__test_trading/:roomId" element={<TestTradingRoom />} />
        {/* Test-only Whiteboard route */}
        <Route path="/__test_whiteboard" element={<TestWhiteboard />} />
        {/* Default fallback - session-based check */}
        <Route path="*" element={<Navigate to={session ? '/' : '/auth'} replace />} />
      </Routes>

      {/* Global toast notifications */}
      <ToastContainer />
      
      {/* Global image modal */}
      <ImageModal />
      
      {/* Theme switcher - only show when logged in */}
      {session && <ThemeSwitcher />}
    </FluentProvider>
  );
};

export function App() {
  const { initialized, initialize } = useAuthStore();

  // Microsoft pattern: Initialize auth on app load
  useEffect(() => {
    initialize();
  }, []);

  // Microsoft Pattern: Don't verify session here - authStore.initialize() is the single source of truth
  // Removed redundant DEBUG auth verification to prevent race conditions

  // Loading state - wait for auth initialization
  if (!initialized) {
    return (
      <FluentProvider theme={webDarkTheme} dir="ltr">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#111827',
          }}
        >
          <Spinner label="Loading Trading Platform..." />
        </div>
      </FluentProvider>
    );
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;