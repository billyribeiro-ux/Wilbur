# Daily.co Integration Setup

## 🎉 Daily.co is now integrated!

Daily.co provides **10,000 FREE minutes per month** for video/audio calls.

---

## 📋 Setup Steps

### 1. Create a Daily.co Account
1. Go to https://dashboard.daily.co/signup
2. Sign up (free, no credit card required)
3. You'll get a domain like `your-name.daily.co`

### 2. Get Your Domain
1. In the Daily.co dashboard, find your domain
2. It looks like: `your-name.daily.co`

### 3. Add to Environment Variables
Create a `.env` file (copy from `.env.example`):
```bash
VITE_DAILY_DOMAIN=your-name.daily.co
```

### 4. Enable Video/Audio
In `/src/config/features.ts`, set:
```typescript
ENABLE_LIVEKIT: true,  // Change to true
```

### 5. Create a Room
Daily.co has two options:

**Option A: Use Dashboard (Easy)**
1. Go to https://dashboard.daily.co/rooms
2. Click "Create room"
3. Copy the room URL (e.g., `https://your-name.daily.co/my-room`)

**Option B: Create Programmatically (Advanced)**
```typescript
// Get API key from dashboard
const response = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${YOUR_API_KEY}`,
  },
  body: JSON.stringify({
    name: 'my-trading-room',
    privacy: 'public', // or 'private'
  }),
});
```

---

## 💻 Usage in Your App

### Simple Example
```typescript
import { useDaily } from '../hooks/useDaily';

function VideoRoom() {
  const {
    isConnected,
    join,
    leave,
    toggleMicrophone,
    toggleCamera,
    isMicEnabled,
    isCameraEnabled,
    participants,
  } = useDaily({
    roomUrl: 'https://your-name.daily.co/my-room',
    userName: 'John Doe',
    autoJoin: true,
  });

  return (
    <div>
      {!isConnected ? (
        <button onClick={join}>Join Call</button>
      ) : (
        <>
          <button onClick={leave}>Leave</button>
          <button onClick={toggleMicrophone}>
            {isMicEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button onClick={toggleCamera}>
            {isCameraEnabled ? 'Stop Video' : 'Start Video'}
          </button>
          <p>Participants: {participants.length}</p>
        </>
      )}
    </div>
  );
}
```

### With Daily React Components (Recommended)
```typescript
import { DailyProvider, useDaily } from '@daily-co/daily-react';

function App() {
  return (
    <DailyProvider>
      <VideoRoom />
    </DailyProvider>
  );
}
```

---

## 🆚 Daily.co vs LiveKit

| Feature | Daily.co | LiveKit |
|---------|----------|---------|
| **Free Tier** | 10,000 min/mo | Limited |
| **Setup** | Easier | More complex |
| **UI Components** | Built-in | DIY |
| **Cost (after free)** | $0.0015/min | $0.0008/min |
| **Best For** | Quick setup | Cost optimization |

---

## 📚 Resources

- **Dashboard**: https://dashboard.daily.co
- **Docs**: https://docs.daily.co
- **React Hooks**: https://docs.daily.co/reference/daily-react
- **Examples**: https://github.com/daily-demos

---

## 🔧 Troubleshooting

### "Room not found"
- Make sure the room exists in your dashboard
- Check the room URL format: `https://your-domain.daily.co/room-name`

### "Permission denied"
- Browser needs camera/microphone permissions
- Check browser console for permission errors

### "Not connected"
- Make sure `ENABLE_LIVEKIT: true` in features.ts
- Check your Daily.co domain in `.env`

---

## 🎯 Next Steps

1. ✅ Daily.co is installed
2. ✅ Service layer created (`/src/services/daily.ts`)
3. ✅ React hook created (`/src/hooks/useDaily.ts`)
4. ⏳ Create Daily.co account
5. ⏳ Add domain to `.env`
6. ⏳ Enable in `features.ts`
7. ⏳ Test in your trading room!

**Need help?** Check the Daily.co docs or ask me! 🚀
