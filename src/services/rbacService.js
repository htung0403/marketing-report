import { supabase } from '../supabase/config';

// --- ROLES ---
export const getRoles = async () => {
    const { data, error } = await supabase.from('app_roles').select('*').order('code');
    if (error) throw error;
    return data;
};

export const createRole = async (role) => {
    const { data, error } = await supabase.from('app_roles').insert([role]).select();
    if (error) throw error;
    return data[0];
};

export const deleteRole = async (code) => {
    const { error } = await supabase.from('app_roles').delete().eq('code', code);
    if (error) throw error;
};

// --- USER ASSIGNMENT ---
export const getUserRoles = async () => {
    const { data, error } = await supabase.from('app_user_roles').select('*');
    if (error) throw error;
    return data;
};

export const assignUserRole = async (email, role_code) => {
    // Upsert based on email
    const { data, error } = await supabase
        .from('app_user_roles')
        .upsert({ email, role_code }, { onConflict: 'email' })
        .select();
    if (error) throw error;
    return data[0];
};

export const removeUserRole = async (email) => {
    const { error } = await supabase.from('app_user_roles').delete().eq('email', email);
    if (error) throw error;
};

// --- PERMISSIONS ---
export const getPermissions = async (role_code) => {
    const { data, error } = await supabase
        .from('app_permissions')
        .select('*')
        .eq('role_code', role_code);
    if (error) throw error;
    return data;
};

export const upsertPermission = async (permission) => {
    const { data, error } = await supabase
        .from('app_permissions')
        .upsert(permission, { onConflict: 'role_code, resource_code' })
        .select();
    if (error) throw error;
    return data[0];
};

// --- HELPER --
// Hardcoded list of resources for the UI
export const AVAILABLE_RESOURCES = [
    { code: 'MODULE_MKT', name: 'Module Marketing' },
    { code: 'MODULE_RND', name: 'Module R&D (Báo cáo, Xem, Page)' },
    { code: 'MODULE_SALE', name: 'Module Sale (Báo cáo, Đơn hàng)' },
    { code: 'MODULE_ORDERS', name: 'Quản lý Đơn (Vận đơn / Kho)' },
    { code: 'MODULE_CSKH', name: 'CSKH & CRM' },
    { code: 'MODULE_ADMIN', name: 'Admin Tools (Cấu hình)' },
];

export const AVAILABLE_COLUMNS = {
    'MODULE_MKT': ['ngay', 'nhan_vien', 'chi_phi', 'doanh_so', 'so_luong_don'],
    'MODULE_RND': ['ngay', 'ten_san_pham', 'team', 'chi_phi_ads', 'doanh_so', 'loi_nhuan'],
    'MODULE_SALE': ['ngay', 'nhan_vien', 'so_luong_don', 'doanh_so', 'ti_le_chot'],
    'MODULE_ORDERS': ['ma_don_hang', 'khach_hang', 'so_dien_thoai', 'dia_chi', 'trang_thai', 'ngay_dat'],
    // Add more as needed or fetch dynamically if we implement introspection later
};
