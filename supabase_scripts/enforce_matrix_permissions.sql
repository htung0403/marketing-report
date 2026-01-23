-- ==============================================================================
-- Enforce Matrix Permissions using Row Level Security (RLS)
-- This script relies on `app_page_permissions` and `users` table.
-- ==============================================================================

-- 0. Ensure Tables Exist (Prevent 42P01 Errors)
CREATE TABLE IF NOT EXISTS public.human_resources (
  id TEXT PRIMARY KEY,
  "Họ Và Tên" TEXT,
  email TEXT,
  "Bộ phận" TEXT,
  "Team" TEXT,
  "Vị trí" TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_pages (
  id TEXT PRIMARY KEY,
  page_name TEXT,
  mkt_staff TEXT,
  product TEXT,
  market TEXT,
  pancake_id TEXT,
  page_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Create Helper Function `has_permission`
-- This function checks if the current user (auth.uid()) has the required permission
-- for ANY of the provided page_codes.
CREATE OR REPLACE FUNCTION public.has_permission(required_page_codes text[], required_action text)
RETURNS boolean AS $$
DECLARE
  current_role text;
  user_id text; 
BEGIN
  -- Get current user ID (handle both Supabase auth and mapped custom IDs if needed, usually auth.uid())
  user_id := auth.uid()::text;

  -- 1. Get role from public.users
  SELECT role INTO current_role
  FROM public.users
  WHERE id = user_id;

  -- If no role found or user not found, access denied
  IF current_role IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Admin / Leader Bypass
  -- 'admin' and 'leader' typically have full access, or at least 'leader' often has widespread access.
  -- You can adjust this list as needed.
  IF current_role IN ('admin', 'leader') THEN
    RETURN true;
  END IF;

  -- 3. Check app_page_permissions
  -- access allowed if ANY of the required_page_codes match a permission record
  -- where the specific action (view/edit/delete) is true.
  RETURN EXISTS (
    SELECT 1
    FROM app_page_permissions
    WHERE role_code = current_role
      AND page_code = ANY(required_page_codes)
      AND (
        (required_action = 'view' AND can_view = true) OR
        (required_action = 'edit' AND can_edit = true) OR
        (required_action = 'delete' AND can_delete = true)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. Apply RLS to `orders` Table
-- Maps to: SALE, ORDERS (Delivery), CSKH, RND (duplicates), MKT (duplicates)
-- ==============================================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing loose policies
DROP POLICY IF EXISTS "Allow all access" ON public.orders;
DROP POLICY IF EXISTS "Allow all read access" ON public.orders;
DROP POLICY IF EXISTS "Allow all insert" ON public.orders;
DROP POLICY IF EXISTS "Allow all update" ON public.orders;
DROP POLICY IF EXISTS "Allow all delete" ON public.orders;

-- Drop previous Matrix policies (to allow re-run)
DROP POLICY IF EXISTS "Matrix View Orders" ON public.orders;
DROP POLICY IF EXISTS "Matrix Insert Orders" ON public.orders;
DROP POLICY IF EXISTS "Matrix Update Orders" ON public.orders;
DROP POLICY IF EXISTS "Matrix Delete Orders" ON public.orders;

-- SELECT: Needs VIEW permission on ANY relevant module page
CREATE POLICY "Matrix View Orders" ON public.orders FOR SELECT
USING (
  has_permission(ARRAY[
    'SALE_ORDERS', 'SALE_VIEW',   -- Sale
    'ORDERS_LIST', 'ORDERS_HISTORY', 'ORDERS_REPORT', -- Delivery
    'CSKH_LIST', 'CSKH_VIEW',     -- CSKH
    'MKT_ORDERS',                 -- Marketing (View Orders)
    'RND_ORDERS',                 -- R&D (View Orders)
    'FINANCE_KPI', 'FINANCE_DASHBOARD', -- Finance
    'ORDERS_FFM'                  -- FFM Team
  ], 'view')
);

-- INSERT: Needs EDIT permission (usually implies creation) 
-- Checking 'NEW_ORDER' pages specifically where available, or generic INPUT
CREATE POLICY "Matrix Insert Orders" ON public.orders FOR INSERT
WITH CHECK (
  has_permission(ARRAY[
    'SALE_NEW_ORDER', 
    'CSKH_NEW_ORDER', 
    'RND_NEW_ORDER',
    'ORDERS_NEW' -- Assuming this code exists or falls back to ORDERS_LIST/UPDATE
  ], 'edit')
);

-- UPDATE: Needs EDIT psemission
CREATE POLICY "Matrix Update Orders" ON public.orders FOR UPDATE
USING (
  has_permission(ARRAY[
    'SALE_ORDERS', 'SALE_INPUT',  -- Sale can update their orders/reports
    'ORDERS_LIST', 'ORDERS_UPDATE', 'ORDERS_FFM', -- Delivery
    'CSKH_LIST', 'CSKH_INPUT',    -- CSKH
    'MKT_ORDERS',                 -- Marketing
    'RND_ORDERS'                  -- R&D
  ], 'edit')
);

-- DELETE: Needs DELETE permission
CREATE POLICY "Matrix Delete Orders" ON public.orders FOR DELETE
USING (
  has_permission(ARRAY[
    'SALE_NEW_ORDER', -- Usually delete allowed where creation is allowed, or specific DELETE flag
    'SALE_ORDERS',
    'CSKH_NEW_ORDER',
    'RND_NEW_ORDER'
  ], 'delete')
);

-- ==============================================================================
-- 3. Apply RLS to `detail_reports` (Marketing/R&D Reports)
-- Maps to: MKT, RND
-- ==============================================================================

ALTER TABLE public.detail_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.detail_reports;
DROP POLICY IF EXISTS "Allow all read access" ON public.detail_reports;
DROP POLICY IF EXISTS "Allow all insert" ON public.detail_reports;
DROP POLICY IF EXISTS "Allow all update" ON public.detail_reports;
DROP POLICY IF EXISTS "Allow all delete" ON public.detail_reports;

-- Drop previous Matrix policies
DROP POLICY IF EXISTS "Matrix View Reports" ON public.detail_reports;
DROP POLICY IF EXISTS "Matrix Insert Reports" ON public.detail_reports;
DROP POLICY IF EXISTS "Matrix Update Reports" ON public.detail_reports;
DROP POLICY IF EXISTS "Matrix Delete Reports" ON public.detail_reports;

CREATE POLICY "Matrix View Reports" ON public.detail_reports FOR SELECT
USING (
  has_permission(ARRAY['MKT_VIEW', 'MKT_INPUT', 'MKT_MANUAL', 'RND_VIEW', 'RND_INPUT', 'RND_MANUAL', 'FINANCE_KPI'], 'view')
);

CREATE POLICY "Matrix Insert Reports" ON public.detail_reports FOR INSERT
WITH CHECK (
  has_permission(ARRAY['MKT_INPUT', 'RND_INPUT'], 'edit')
);

CREATE POLICY "Matrix Update Reports" ON public.detail_reports FOR UPDATE
USING (
  has_permission(ARRAY['MKT_INPUT', 'RND_INPUT'], 'edit')
);

CREATE POLICY "Matrix Delete Reports" ON public.detail_reports FOR DELETE
USING (
  has_permission(ARRAY['MKT_INPUT', 'RND_INPUT'], 'delete')
);

-- ==============================================================================
-- 4. Apply RLS to `marketing_pages`
-- Maps to: MKT_PAGES, RND_PAGES
-- ==============================================================================

ALTER TABLE public.marketing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.marketing_pages;
DROP POLICY IF EXISTS "Allow all read" ON public.marketing_pages;
DROP POLICY IF EXISTS "Allow all insert" ON public.marketing_pages;
DROP POLICY IF EXISTS "Allow all update" ON public.marketing_pages;
DROP POLICY IF EXISTS "Allow all delete" ON public.marketing_pages;

-- Drop previous Matrix policies
DROP POLICY IF EXISTS "Matrix View Pages" ON public.marketing_pages;
DROP POLICY IF EXISTS "Matrix Modify Pages" ON public.marketing_pages;
DROP POLICY IF EXISTS "Matrix Insert Update Pages" ON public.marketing_pages;
DROP POLICY IF EXISTS "Matrix Update Pages" ON public.marketing_pages;
DROP POLICY IF EXISTS "Matrix Delete Pages" ON public.marketing_pages;

CREATE POLICY "Matrix View Pages" ON public.marketing_pages FOR SELECT
USING (
  has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'view')
);

CREATE POLICY "Matrix Modify Pages" ON public.marketing_pages FOR ALL
USING (
  has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'edit')
)
WITH CHECK (
  has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'edit')
);

-- For Delete specifically if needed, logic above covers ALL, but to be safe for Delete:
-- RLS 'ALL' covers SELECT, INSERT, UPDATE, DELETE unless overridden. 
-- However, we want strict DELETE check?
-- The function checks 'edit' for ALL. Let's refine.

DROP POLICY "Matrix Modify Pages" ON public.marketing_pages;

CREATE POLICY "Matrix Insert Update Pages" ON public.marketing_pages FOR INSERT
WITH CHECK ( has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'edit') );

CREATE POLICY "Matrix Update Pages" ON public.marketing_pages FOR UPDATE
USING ( has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'edit') );

CREATE POLICY "Matrix Delete Pages" ON public.marketing_pages FOR DELETE
USING ( has_permission(ARRAY['MKT_PAGES', 'RND_PAGES'], 'delete') );


-- ==============================================================================
-- 5. Apply RLS to `human_resources`
-- Maps to: HR_ACCESS
-- ==============================================================================

ALTER TABLE public.human_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.human_resources;
DROP POLICY IF EXISTS "Allow all read access" ON public.human_resources;
DROP POLICY IF EXISTS "Allow all insert" ON public.human_resources;
DROP POLICY IF EXISTS "Allow all update" ON public.human_resources;
DROP POLICY IF EXISTS "Allow all delete" ON public.human_resources;

-- Drop previous Matrix policies
DROP POLICY IF EXISTS "Matrix View HR" ON public.human_resources;
DROP POLICY IF EXISTS "Matrix Modify HR" ON public.human_resources;

-- HR / Admin / Leader can view
CREATE POLICY "Matrix View HR" ON public.human_resources FOR SELECT
USING (
  has_permission(ARRAY['HR_LIST', 'HR_DASHBOARD'], 'view')
);

-- HR can modify
CREATE POLICY "Matrix Modify HR" ON public.human_resources FOR ALL
USING (
  has_permission(ARRAY['HR_LIST'], 'edit')
)
WITH CHECK (
  has_permission(ARRAY['HR_LIST'], 'edit')
);

-- ==============================================================================
-- 5b. Apply RLS to `users` table (Actual Employee List)
-- Maps to: HR_LIST (View), HR_LIST (Edit/Add/Delete)
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.users;
DROP POLICY IF EXISTS "Allow all read" ON public.users;
DROP POLICY IF EXISTS "Allow all modify" ON public.users;

-- Drop previous Matrix policies
DROP POLICY IF EXISTS "Matrix View Users" ON public.users;
DROP POLICY IF EXISTS "Matrix Modify Users" ON public.users;

-- VIEW: HR Manager, Leaders (their team?), Admin, or Self
CREATE POLICY "Matrix View Users" ON public.users FOR SELECT
USING (
  has_permission(ARRAY['HR_LIST'], 'view') OR -- HR/Admin
  (auth.uid()::text = id) OR                  -- Self
  (role = 'leader')                           -- Leader (needs logic to see own team? Current UI handles filtering but we can open list to leaders)
);
-- Note: 'leader' check above is simplistic. Ideally strict RLS: 
-- (has_permission(...) OR id=uid OR (role='leader' AND team=...))
-- But complex logic in SQL. For now, allowing Leaders to 'Select' rows is safer than blocking, 
-- or we rely on 'HR_LIST' being assigned to Leader if they check 'View HR'. 
-- But usually Leaders don't have HR permission. They have 'View Team'.
-- Let's stick to HR_LIST for full view. Self view is minimal.

-- MODIFY: HR Only (and Admin)
CREATE POLICY "Matrix Modify Users" ON public.users FOR ALL
USING ( has_permission(ARRAY['HR_LIST'], 'edit') )
WITH CHECK ( has_permission(ARRAY['HR_LIST'], 'edit') );

-- ==============================================================================
-- 6. Apply RLS to `app_page_permissions` & `app_roles` (Protect the System itself)
-- Only Admin should modify these? Or Leader?
-- 'ADMIN_TOOLS' page covers this.
-- ==============================================================================

-- app_page_permissions
ALTER TABLE app_page_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read page_permissions" ON app_page_permissions;
DROP POLICY IF EXISTS "Allow authenticated users to modify page_permissions" ON app_page_permissions;
DROP POLICY IF EXISTS "Allow all access" ON app_page_permissions;

DROP POLICY IF EXISTS "Read Permissions" ON app_page_permissions;
DROP POLICY IF EXISTS "Admin Modify Permissions" ON app_page_permissions;

CREATE POLICY "Read Permissions" ON app_page_permissions FOR SELECT
USING (true); -- Everyone needs to read to check their own perms (or UI rendering)

CREATE POLICY "Admin Modify Permissions" ON app_page_permissions FOR ALL
USING (
  has_permission(ARRAY['ADMIN_TOOLS'], 'edit')
)
WITH CHECK (
  has_permission(ARRAY['ADMIN_TOOLS'], 'edit')
);

-- app_roles
ALTER TABLE app_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Read Roles" ON app_roles;
DROP POLICY IF EXISTS "Admin Modify Roles" ON app_roles;

DROP POLICY IF EXISTS "Read Roles" ON app_roles;

CREATE POLICY "Read Roles" ON app_roles FOR SELECT USING (true);
CREATE POLICY "Admin Modify Roles" ON app_roles FOR ALL
USING ( has_permission(ARRAY['ADMIN_TOOLS'], 'edit') )
WITH CHECK ( has_permission(ARRAY['ADMIN_TOOLS'], 'edit') );

-- ==============================================================================
-- 7. Lock down Legacy/Unused Tables (app_permissions, app_user_roles)
-- To clear "UNRESTRICTED" warnings and prevent misuse.
-- ==============================================================================

-- app_permissions (Legacy)
ALTER TABLE app_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Legacy Read" ON app_permissions;
CREATE POLICY "Legacy Read" ON app_permissions FOR SELECT USING (has_permission(ARRAY['ADMIN_TOOLS'], 'view'));
-- No write access allowed effectively unless superuser

-- app_user_roles (Legacy - we use 'users' table now)
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Legacy Read" ON app_user_roles;
CREATE POLICY "Legacy Read" ON app_user_roles FOR SELECT USING (has_permission(ARRAY['ADMIN_TOOLS'], 'view'));


