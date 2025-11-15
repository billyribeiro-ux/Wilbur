# Whiteboard Feature Test Instructions

## How to Test the Whiteboard Feature:

1. **Login as Admin**: Ensure you're logged in as an admin user for the room
2. **Navigate to TradingRoom**: Go to any trading room where you have admin privileges
3. **Start Screen Share**: Have someone share their screen (or share your own)
4. **Go to Screens Tab**: Click on the "Screens" tab in the content area
5. **Activate Whiteboard**: Click the whiteboard icon (📝) in the header toolbar
6. **Test Drawing**:
   - The toolbar should appear at the bottom
   - Select pen, highlighter, or eraser
   - Choose colors and adjust stroke width
   - Draw on the shared screen
7. **Test Real-time Sync**: 
   - Open another browser with a different user
   - Draw as admin - other users should see strokes in real-time
8. **Test Controls**:
   - Undo button removes last stroke
   - Clear button removes all strokes
   - Close button (top-right) exits whiteboard mode

## Expected Behavior:
- Only admins can see and use drawing tools
- All participants can see annotations
- Strokes appear in real-time for all users
- Whiteboard overlay matches screen share dimensions
- Toolbar is functional with all tools working

## Troubleshooting:
- If whiteboard icon doesn't appear: Check admin permissions
- If drawing doesn't work: Check LiveKit connection status
- If strokes don't sync: Check browser console for data channel errors
