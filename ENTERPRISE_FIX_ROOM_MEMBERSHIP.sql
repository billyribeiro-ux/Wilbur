-- ============================================================================
-- ENTERPRISE GRADE FIX: Room Membership System
-- ============================================================================
-- This script ensures proper room membership and RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current RLS policies on room_memberships
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'room_memberships';

-- Step 2: Verify the user exists in the users table
SELECT id, email, role, created_at 
FROM users 
WHERE id = 'a9dde817-733c-468a-b535-7a1b73fd3020';

-- Step 3: Verify the room exists
SELECT id, name, created_by, created_at 
FROM rooms 
WHERE id = '9a43e0ab-6e82-42f3-a998-a8db205f4c67';

-- Step 4: Check if membership already exists
SELECT * FROM room_memberships 
WHERE user_id = 'a9dde817-733c-468a-b535-7a1b73fd3020' 
AND room_id = '9a43e0ab-6e82-42f3-a998-a8db205f4c67';

-- Step 5: Create the membership if it doesn't exist
-- ENTERPRISE PATTERN: Explicit membership creation with proper role assignment
INSERT INTO room_memberships (
    user_id, 
    room_id, 
    role, 
    joined_at,
    created_at,
    updated_at
)
VALUES (
    'a9dde817-733c-468a-b535-7a1b73fd3020',
    '9a43e0ab-6e82-42f3-a998-a8db205f4c67',
    'admin', -- Change to 'member' or 'moderator' as needed
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (user_id, room_id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    updated_at = NOW();

-- Step 6: Verify the membership was created
SELECT 
    rm.id,
    rm.user_id,
    rm.room_id,
    rm.role,
    rm.joined_at,
    u.email as user_email,
    r.name as room_name
FROM room_memberships rm
JOIN users u ON u.id = rm.user_id
JOIN rooms r ON r.id = rm.room_id
WHERE rm.user_id = 'a9dde817-733c-468a-b535-7a1b73fd3020' 
AND rm.room_id = '9a43e0ab-6e82-42f3-a998-a8db205f4c67';

-- ============================================================================
-- ENTERPRISE PATTERN: Ensure proper RLS policies
-- ============================================================================

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Users can view their own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON room_memberships;
DROP POLICY IF EXISTS "Room admins can manage memberships" ON room_memberships;

-- Policy 1: Users can view their own memberships
CREATE POLICY "Users can view their own memberships"
ON room_memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can view all memberships in rooms they belong to
CREATE POLICY "Users can view memberships in their rooms"
ON room_memberships
FOR SELECT
USING (
    room_id IN (
        SELECT room_id 
        FROM room_memberships 
        WHERE user_id = auth.uid()
    )
);

-- Policy 3: Room admins can manage memberships
CREATE POLICY "Room admins can manage memberships"
ON room_memberships
FOR ALL
USING (
    EXISTS (
        SELECT 1 
        FROM room_memberships 
        WHERE room_id = room_memberships.room_id 
        AND user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'room_memberships';

-- Verify all policies are in place
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'room_memberships';

-- Final check: Can the user access their membership?
-- Run this as the authenticated user to verify RLS works
SELECT * FROM room_memberships 
WHERE user_id = 'a9dde817-733c-468a-b535-7a1b73fd3020';

-- ============================================================================
-- ENTERPRISE PATTERN: Auto-add room creator as admin
-- ============================================================================

-- Create a trigger function to automatically add room creator as admin
CREATE OR REPLACE FUNCTION add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO room_memberships (user_id, room_id, role, joined_at)
    VALUES (NEW.created_by, NEW.id, 'admin', NOW())
    ON CONFLICT (user_id, room_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_room_created_add_admin ON rooms;

-- Create trigger to auto-add creator as admin
CREATE TRIGGER on_room_created_add_admin
    AFTER INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION add_room_creator_as_admin();

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this script:
-- 1. Refresh your application
-- 2. The user should now have proper room access
-- 3. Whiteboard should be visible for admin/moderator users
-- ============================================================================
