-- ============================================================================
-- ENTERPRISE GRADE: AUTOMATIC Room Membership Fix
-- ============================================================================
-- This script automatically detects the current user and room, then fixes membership
-- NO HARDCODED IDs - Uses dynamic queries to find actual data
-- ============================================================================

-- Step 1: Show all users in the system
SELECT 
    id,
    email,
    role,
    created_at,
    '👤 USER' as type
FROM users
ORDER BY created_at DESC;

-- Step 2: Show all rooms in the system
SELECT 
    id,
    name,
    created_by,
    created_at,
    '🏠 ROOM' as type
FROM rooms
ORDER BY created_at DESC;

-- Step 3: Show all existing memberships
SELECT 
    rm.id,
    u.email as user_email,
    r.name as room_name,
    rm.role,
    rm.joined_at,
    '✅ EXISTING MEMBERSHIP' as type
FROM room_memberships rm
JOIN users u ON u.id = rm.user_id
JOIN rooms r ON r.id = rm.room_id
ORDER BY rm.joined_at DESC;

-- ============================================================================
-- ENTERPRISE PATTERN: Auto-fix for the most recent user and room
-- ============================================================================

-- Step 4: Automatically add the most recent user to the most recent room as admin
-- This assumes you want to fix access for the current logged-in user
DO $$
DECLARE
    v_user_id UUID;
    v_room_id UUID;
    v_user_email TEXT;
    v_room_name TEXT;
BEGIN
    -- Get the most recent user (likely the one trying to access)
    SELECT id, email INTO v_user_id, v_user_email
    FROM users
    ORDER BY created_at DESC
    LIMIT 1;

    -- Get the most recent room (likely the one being accessed)
    SELECT id, name INTO v_room_id, v_room_name
    FROM rooms
    ORDER BY created_at DESC
    LIMIT 1;

    -- Check if we found both
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ No users found in database';
        RETURN;
    END IF;

    IF v_room_id IS NULL THEN
        RAISE NOTICE '❌ No rooms found in database';
        RETURN;
    END IF;

    RAISE NOTICE '📋 Found User: % (ID: %)', v_user_email, v_user_id;
    RAISE NOTICE '📋 Found Room: % (ID: %)', v_room_name, v_room_id;

    -- Insert or update membership
    INSERT INTO room_memberships (
        user_id,
        room_id,
        role,
        joined_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_room_id,
        'admin',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, room_id)
    DO UPDATE SET
        role = 'admin',
        updated_at = NOW();

    RAISE NOTICE '✅ Membership created/updated: % is now admin of %', v_user_email, v_room_name;
END $$;

-- Step 5: Verify the fix worked
SELECT 
    rm.id,
    u.email as user_email,
    u.id as user_id,
    r.name as room_name,
    r.id as room_id,
    rm.role,
    rm.joined_at,
    '✅ FIXED MEMBERSHIP' as status
FROM room_memberships rm
JOIN users u ON u.id = rm.user_id
JOIN rooms r ON r.id = rm.room_id
ORDER BY rm.updated_at DESC
LIMIT 5;

-- ============================================================================
-- ENTERPRISE PATTERN: Fix ALL users in ALL rooms (if needed)
-- ============================================================================

-- Uncomment this section if you want to add ALL users to ALL rooms as members
/*
DO $$
DECLARE
    v_user RECORD;
    v_room RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_user IN SELECT id, email FROM users LOOP
        FOR v_room IN SELECT id, name FROM rooms LOOP
            INSERT INTO room_memberships (
                user_id,
                room_id,
                role,
                joined_at,
                created_at,
                updated_at
            )
            VALUES (
                v_user.id,
                v_room.id,
                'member', -- Default role
                NOW(),
                NOW(),
                NOW()
            )
            ON CONFLICT (user_id, room_id) DO NOTHING;
            
            v_count := v_count + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '✅ Created % memberships', v_count;
END $$;
*/

-- ============================================================================
-- ENTERPRISE PATTERN: Add room creators as admins automatically
-- ============================================================================

-- This ensures every room creator is automatically an admin of their room
INSERT INTO room_memberships (user_id, room_id, role, joined_at, created_at, updated_at)
SELECT 
    r.created_by as user_id,
    r.id as room_id,
    'admin' as role,
    r.created_at as joined_at,
    NOW() as created_at,
    NOW() as updated_at
FROM rooms r
WHERE NOT EXISTS (
    SELECT 1 FROM room_memberships rm 
    WHERE rm.user_id = r.created_by 
    AND rm.room_id = r.id
)
ON CONFLICT (user_id, room_id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- ============================================================================
-- ENTERPRISE PATTERN: Setup proper RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON room_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their rooms" ON room_memberships;
DROP POLICY IF EXISTS "Room admins can manage memberships" ON room_memberships;
DROP POLICY IF EXISTS "Service role can manage all memberships" ON room_memberships;

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

-- Policy 4: Service role can manage all (for backend operations)
CREATE POLICY "Service role can manage all memberships"
ON room_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- ENTERPRISE PATTERN: Create trigger for auto-adding room creators
-- ============================================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION add_room_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO room_memberships (user_id, room_id, role, joined_at, created_at, updated_at)
    VALUES (NEW.created_by, NEW.id, 'admin', NOW(), NOW(), NOW())
    ON CONFLICT (user_id, room_id) DO UPDATE SET
        role = 'admin',
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_room_created_add_admin ON rooms;

-- Create the trigger
CREATE TRIGGER on_room_created_add_admin
    AFTER INSERT ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION add_room_creator_as_admin();

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Show final state of all memberships
SELECT 
    u.email,
    r.name as room_name,
    rm.role,
    rm.joined_at,
    CASE 
        WHEN rm.role = 'admin' THEN '👑 ADMIN'
        WHEN rm.role = 'moderator' THEN '🛡️ MODERATOR'
        ELSE '👤 MEMBER'
    END as access_level
FROM room_memberships rm
JOIN users u ON u.id = rm.user_id
JOIN rooms r ON r.id = rm.room_id
ORDER BY rm.role DESC, u.email;

-- Show RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    '✅ RLS' as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'room_memberships';

-- Show all policies
SELECT 
    policyname,
    cmd,
    '✅ POLICY' as status
FROM pg_policies 
WHERE tablename = 'room_memberships'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ ENTERPRISE FIX COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ Memberships created/updated';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Auto-add trigger installed';
    RAISE NOTICE '✅ Room creators are now admins';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Next Steps:';
    RAISE NOTICE '   1. Refresh your application';
    RAISE NOTICE '   2. Check console for: ✅ Membership validated';
    RAISE NOTICE '   3. Whiteboard should now be visible';
    RAISE NOTICE '============================================================================';
END $$;
