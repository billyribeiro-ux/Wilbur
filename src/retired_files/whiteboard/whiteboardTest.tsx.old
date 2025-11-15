/**
 * Manual Whiteboard Test Component
 * Use this to test the whiteboard functionality without test frameworks
 */

import { useState } from 'react';

import { WhiteboardOverlay } from './WhiteboardOverlay';
import type { WhiteboardEvent } from './whiteboardTypes';

export function WhiteboardTest() {
  const [events, setEvents] = useState<WhiteboardEvent[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [canAnnotate, setCanAnnotate] = useState(true);

  const handleEventEmit = (event: WhiteboardEvent) => {
    console.log('Whiteboard event emitted:', event);
    setEvents(prev => [...prev, event]);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#1e293b' }}>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, background: '#334155', padding: 20, borderRadius: 8 }}>
        <h3 style={{ color: 'white', marginBottom: 10 }}>Whiteboard Test Controls</h3>
        <button 
          onClick={() => setIsActive(!isActive)}
          style={{ marginRight: 10, padding: '5px 10px' }}
        >
          {isActive ? 'Hide' : 'Show'} Whiteboard
        </button>
        <button 
          onClick={() => setCanAnnotate(!canAnnotate)}
          style={{ marginRight: 10, padding: '5px 10px' }}
        >
          {canAnnotate ? 'Disable' : 'Enable'} Annotation
        </button>
        <button 
          onClick={() => setEvents([])}
          style={{ padding: '5px 10px' }}
        >
          Clear Events ({events.length})
        </button>
        
        <div style={{ marginTop: 10, color: 'white', fontSize: 12 }}>
          <div>Active: {isActive ? 'Yes' : 'No'}</div>
          <div>Can Annotate: {canAnnotate ? 'Yes' : 'No'}</div>
          <div>Events: {events.length}</div>
        </div>
      </div>

      <WhiteboardOverlay
        isActive={isActive}
        canAnnotate={canAnnotate}
        width={window.innerWidth}
        height={window.innerHeight}
        roomId="test-room"
        userId="test-user"
        onClose={() => setIsActive(false)}
        onEventEmit={handleEventEmit}
        incomingEvents={events}
      />
    </div>
  );
}

// Usage: Import and render this component to test the whiteboard
// import { WhiteboardTest } from './components/trading/whiteboardTest';
// <WhiteboardTest />
