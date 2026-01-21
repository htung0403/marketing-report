import { useEffect, useState } from 'react';
import { supabase } from '../supabase/config';

// Cache to prevent repetitive fetching
let cachedPermissions = null;
let cachedRole = null;
let permissionPromise = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastFetchTime = 0;

export const usePermissions = () => {
    const [permissions, setPermissions] = useState(cachedPermissions || []);
    const [role, setRole] = useState(cachedRole || null);
    const [loading, setLoading] = useState(!cachedPermissions);
    const userEmail = localStorage.getItem('userEmail');

    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            // Return cached if valid
            if (cachedPermissions && (Date.now() - lastFetchTime < CACHE_DURATION)) {
                setPermissions(cachedPermissions);
                setRole(cachedRole);
                setLoading(false);
                return;
            }

            // Deduplicate requests
            if (permissionPromise) {
                const data = await permissionPromise;
                setPermissions(data.permissions);
                setRole(data.role);
                setLoading(false);
                return;
            }

            permissionPromise = (async () => {
                try {
                    // 1. Get User Role from 'users' table (Source of Truth)
                    const { data: userRoleData, error: urError } = await supabase
                        .from('users')
                        .select('role')
                        .eq('email', userEmail)
                        .maybeSingle();

                    if (urError) {
                        console.error("Error fetching user role", urError);
                    }

                    // Map 'users.role' to 'role_code' if necessary, or use directly if they match
                    // Assuming 'user' in users table maps to 'USER' or 'user' in permissions
                    const userRoleCode = userRoleData?.role;

                    if (!userRoleCode) {
                        // Default to no role
                        return { permissions: [], role: null };
                    }

                    // 2. Get Permissions for Role (New Table)
                    const { data: permData, error: pError } = await supabase
                        .from('app_page_permissions')
                        .select('*')
                        .eq('role_code', userRoleCode);

                    if (pError) console.error("Error fetching permissions", pError);

                    const finalPerms = permData || [];

                    // Update Cache
                    cachedPermissions = finalPerms;
                    cachedRole = userRoleCode;
                    lastFetchTime = Date.now();

                    return { permissions: finalPerms, role: userRoleCode };
                } catch (e) {
                    console.error("Permission load error", e);
                    return { permissions: [], role: null };
                } finally {
                    permissionPromise = null;
                }
            })();

            const result = await permissionPromise;
            setPermissions(result.permissions);
            setRole(result.role);
            setLoading(false);
        };

        fetchPermissions();
    }, [userEmail]);

    // --- CHECKER FUNCTIONS ---

    const canView = (pageCode) => {
        // Legacy Admin Bypass
        const legacyRole = localStorage.getItem('userRole');
        if (legacyRole === 'admin') return true;

        if (role === 'ADMIN') return true; // Admin bypass

        // If the pageCode is actually a module code (e.g., checking if module is visible)
        // We might want to return true if ANY page in the module is visible, or check specifically.
        // For now, assume strict page code checking.

        const p = permissions.find(x => x.page_code === pageCode);
        return !!p?.can_view;
    };

    const canEdit = (pageCode) => {
        if (role === 'ADMIN') return true;
        const p = permissions.find(x => x.page_code === pageCode);
        return !!p?.can_edit;
    };

    const canDelete = (pageCode) => {
        if (role === 'ADMIN') return true;
        const p = permissions.find(x => x.page_code === pageCode);
        return !!p?.can_delete;
    };

    const getAllowedColumns = (pageCode) => {
        if (role === 'ADMIN') return ['*'];
        const p = permissions.find(x => x.page_code === pageCode);
        if (!p) return []; // No permission entry means access denied generally
        return p.allowed_columns || []; // JSON array
    };

    const isColumnAllowed = (pageCode, columnName) => {
        if (role === 'ADMIN') return true;
        const cols = getAllowedColumns(pageCode);
        if (cols.includes('*')) return true;
        return cols.includes(columnName);
    };

    return {
        role,
        loading,
        canView,
        canEdit,
        canDelete,
        getAllowedColumns,
        isColumnAllowed,
        refreshPermissions: () => { lastFetchTime = 0; } // Force refresh
    };
};

export default usePermissions;
