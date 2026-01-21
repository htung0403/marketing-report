import { useEffect, useState } from 'react';
import { supabase } from '../supabase/config';

// Cache to prevent repetitive fetching
let cachedPermissions = null;
let cachedRole = null;
let cachedEmail = null; // Add email to cache key
let permissionPromise = null;

const CACHE_DURATION = 1 * 60 * 1000; // Reduce to 1 minute
let lastFetchTime = 0;

export const usePermissions = () => {
    // Initial state: only use cache if email matches (can't check sync perfectly, but effective for re-renders)
    // For safety, start empty/loading unless we are sure.
    // Ideally, we depend on the effect to set it.
    const [permissions, setPermissions] = useState([]);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    const userEmail = localStorage.getItem('userEmail');

    useEffect(() => {
        if (!userEmail) {
            setLoading(false);
            return;
        }

        const fetchPermissions = async () => {
            // 0. Check if cache is valid AND belongs to current user
            const isCacheValid = cachedPermissions &&
                (Date.now() - lastFetchTime < CACHE_DURATION) &&
                cachedEmail === userEmail; // CRITICAL FIX

            if (isCacheValid) {
                setPermissions(cachedPermissions);
                setRole(cachedRole);
                setLoading(false);
                return;
            }

            // Deduplicate requests
            if (permissionPromise) {
                const data = await permissionPromise;
                // Double check if the promise result matches current user (unlikely to change mid-flight but good practice)
                // Actually, if a promise is inflight for User A, and we switch to User B, we shouldn't use it.
                // But for simplicity, we assume one active session.
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
                    cachedEmail = userEmail; // Save email
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
        if (p) return !!p.can_view;

        // Fallback: Check if role has implicit access to module
        const storedRole = localStorage.getItem('userRole');
        const r = (role || storedRole || '').toLowerCase();

        // Marketing
        if (r === 'marketing' && pageCode.startsWith('MKT_')) return true;
        // Sales
        if (r === 'sale' && pageCode.startsWith('SALE_')) return true;
        // CSKH
        if (r === 'cskh' && (pageCode.startsWith('CSKH_') || pageCode === 'SALE_ORDERS' || pageCode === 'SALE_NEW_ORDER')) return true;
        // Delivery
        if (r === 'delivery' && pageCode.startsWith('ORDERS_')) return true;
        // R&D - sees everything in R&D + duplicates
        if (r === 'rnd' && (pageCode.startsWith('RND_') || pageCode.includes('MKT_') || pageCode.includes('SALE_'))) return true;
        // HR
        if (r === 'hr') return true; // HR sees their menu (no specific prefixes used yet except implicit)

        return false;
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
