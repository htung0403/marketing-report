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

// --- EMPLOYEES ---
export const getEmployees = async () => {
    try {
        const response = await fetch('https://lumi-6dff7-default-rtdb.asia-southeast1.firebasedatabase.app/employees.json');
        const data = await response.json();

        if (!data) return [];

        // Convert object to array and map fields
        const employees = Object.values(data).map(emp => ({
            email: emp.email,
            'Họ Và Tên': emp.ho_va_ten,
            position: emp.vi_tri,
            department: emp.bo_phan // Map department
        })).filter(emp => emp.email && emp['Họ Và Tên']); // Filter valid records

        // Sort by Name
        return employees.sort((a, b) => a['Họ Và Tên'].localeCompare(b['Họ Và Tên']));
    } catch (error) {
        console.error("Error fetching employees from Firebase:", error);
        return [];
    }
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

// Detailed column definitions for each module
export const COLUMN_DEFINITIONS = {
    'MODULE_MKT': [
        'Ngày', 'Email', 'Tên', 'Team', 'Sản_phẩm', 'Thị_trường', 'CPQC',
        'Số_Mess_Cmt', 'Số đơn', 'Doanh số', 'DS sau hoàn hủy', 'Số đơn hoàn hủy',
        'Doanh số sau ship', 'Doanh số TC', 'KPIs', 'TKQC', 'id_NS', 'CPQC theo TKQC',
        'Báo cáo theo Page', 'Trạng thái', 'Cảnh báo'
    ],
    'MODULE_RND': [
        'Ngày', 'Email', 'Tên', 'Team', 'Sản_phẩm', 'Thị_trường', 'CPQC',
        'Số_Mess_Cmt', 'Số đơn', 'Doanh số', 'DS sau hoàn hủy', 'KPIs',
        'Doanh số sau ship', 'Chi_phí_ads', 'Lợi_nhuận'
    ],
    'MODULE_SALE': [
        'Ngày', 'Nhân_viên', 'Team', 'Số_đơn', 'Doanh_số', 'Doanh_số_sau_hoàn_hủy',
        'Số_đơn_hoàn_hủy', 'Tỷ_lệ_chốt', 'KPIs', 'Mã_tracking', 'Trạng_thái'
    ],
    'MODULE_ORDERS': [
        'Mã đơn hàng', 'Ngày lên đơn', 'Name*', 'Phone*', 'Add', 'City', 'State',
        'Khu vực', 'Zipcode', 'Mặt hàng', 'Tên mặt hàng 1', 'Số lượng mặt hàng 1',
        'Tên mặt hàng 2', 'Số lượng mặt hàng 2', 'Quà tặng', 'Số lượng quà kèm',
        'Giá bán', 'Loại tiền thanh toán', 'Tổng tiền VNĐ', 'Hình thức thanh toán',
        'Ghi chú', 'Ghi chú vận đơn', 'Kết quả Check', 'Mã Tracking', 'Ngày đóng hàng',
        'Trạng thái giao hàng', 'GHI CHÚ', 'Thời gian giao dự kiến', 'Nhân viên MKT',
        'Nhân viên Sale', 'Team', 'NV Vận đơn', 'CSKH', 'Trạng thái thu tiền',
        'Lý do', 'Phí ship nội địa Mỹ (usd)', 'Phí xử lý đơn đóng hàng-Lưu kho(usd)',
        'Đơn vị vận chuyển', 'Số tiền của đơn hàng đã về TK Cty', 'Kế toán xác nhận thu tiền về',
        'Ngày Kế toán đối soát với FFM lần 2'
    ],
    'MODULE_CSKH': [
        'Mã đơn hàng', 'Ngày lên đơn', 'Name*', 'Phone*', 'Add', 'City', 'Mặt hàng',
        'Tổng tiền VNĐ', 'Trạng thái giao hàng', 'Trạng thái thu tiền', 'CSKH',
        'Kết quả Check', 'Lý do', 'Ghi chú', 'GHI CHÚ', 'Nhân viên Sale', 'Team'
    ],
    'MODULE_ADMIN': [
        // Admin không giới hạn columns
        '*'
    ]
};

// Helper: Get column suggestions as comma-separated string for placeholder
export const getColumnSuggestions = (resourceCode, maxCount = 5) => {
    const cols = COLUMN_DEFINITIONS[resourceCode] || [];
    if (cols[0] === '*') return '*';
    return cols.slice(0, maxCount).join(', ') + (cols.length > maxCount ? '...' : '');
};
