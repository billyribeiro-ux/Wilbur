-- Fix Whiteboard Issue: Add User to Room Membership
-- Run this in your Supabase SQL Editor

-- User ID: a9dde817-733c-468a-b535-7a1b73fd3020
-- Room ID: 9a43e0ab-6e82-42f3-a998-a8db205f4c67

-- Check if membership exists
SELECT * FROM room_memberships 
WHERE user_id = 'a9dde817-733c-468a-b535-7a1b73fd3020' 
AND room_id = '9a43e0ab-6e82-42f3-a998-a8db205f4c67';

-- If no results, insert the membership
INSERT INTO room_memberships (user_id, room_id, role, joined_at)
VALUES (
  'a9dde817-733c-468a-b535-7a1b73fd3020',
  '9a43e0ab-6e82-42f3-a998-a8db205f4c67',
  'admin', -- Change to 'member' if you don't want admin rights
  NOW()
)
ON CONFLICT (user_id, room_id) DO UPDATE
SET role = 'admin', updated_at = NOW();

-- Verify the membership was created
SELECT * FROM room_memberships 
WHERE user_id = 'a9dde817-733c-468a-b535-7a1b73fd3020' 
AND room_id = '9a43e0ab-6e82-42f3-a998-a8db205f4c67';
