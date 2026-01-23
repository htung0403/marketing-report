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
// --- USER ASSIGNMENT ---
export const getUserRoles = async () => {
    // Fetch directly from users table which is now the source of truth
    const { data, error } = await supabase
        .from('users')
        .select('email, role, created_at')
        .neq('role', 'user'); // Optional: only show non-default roles to keep list clean? 
    // Or remove .neq to show everyone. Let's show everyone who has a role assigned.
    // Actually, sync script assigns 'marketing', 'sale' etc. So we should probably show everyone 
    // or at least everyone with a role that is not 'user' if 'user' is the default for unprivileged.

    if (error) throw error;

    // Map to match the interface PermissionManager expects { email, role_code, assigned_at }
    return data.map(u => ({
        email: u.email,
        role_code: u.role,
        assigned_at: u.created_at
    }));
};

export const assignUserRole = async (email, role_code) => {
    // Update users table directly
    const { data, error } = await supabase
        .from('users')
        .update({ role: role_code })
        .eq('email', email)
        .select();

    if (error) throw error;

    // Also update human_resources for consistency if possible
    // but don't fail if record doesn't exist (users table is source of truth)
    try {
        await supabase
            .from('human_resources')
            .update({ role: role_code })
            .eq('email', email);
    } catch (err) {
        console.warn("Could not sync role to human_resources (optional):", err);
    }

    return data[0];
};

export const updateUserTeam = async (email, team) => {
    // Update users table
    const { data, error } = await supabase
        .from('users')
        .update({ team: team })
        .eq('email', email)
        .select();

    if (error) throw error;
    return data[0];
};

export const removeUserRole = async (email) => {
    // Reset to default 'user' role
    const { error } = await supabase
        .from('users')
        .update({ role: 'user' })
        .eq('email', email);

    if (error) throw error;

    // Sync to human_resources
    await supabase
        .from('human_resources')
        .update({ role: 'user' })
        .eq('email', email);
};

// --- EMPLOYEES ---
// --- EMPLOYEES ---
export const getEmployees = async () => {
    try {
        // Switch to Supabase 'users' table as requested
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name', { ascending: true }); // Assuming 'name' exists, falling back to 'email' if needed

        if (error) throw error;
        if (!data) return [];

        // Map Supabase users to expected UI format
        const employees = data.map(u => ({
            email: u.email,
            'Họ Và Tên': u.name || u.username || u.email, // Fallback to email if name missing
            position: u.position || 'Nhân viên',
            department: u.department || 'Chưa phân loại',
            team: u.team || '' // Explicitly separate team from department
        }));

        return employees;
    } catch (error) {
        console.error("Error fetching employees from Supabase:", error);
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
    { code: 'MODULE_HR', name: 'Quản lý Nhân sự' },
    { code: 'MODULE_FINANCE', name: 'Quản lý Tài chính' },
    { code: 'MODULE_ADMIN', name: 'Admin Tools (Cấu hình)' }
];

// --- MODULE → PAGE MAPPING (Hierarchical RBAC) ---
export const MODULE_PAGES = {
    'MODULE_MKT': {
        name: 'QUẢN LÝ MARKETING',
        pages: [
            { code: 'MKT_INPUT', name: 'Nhập báo cáo', path: '/bao-cao-marketing' },
            { code: 'MKT_VIEW', name: 'Xem báo cáo MKT', path: '/xem-bao-cao-mkt' },
            { code: 'MKT_ORDERS', name: 'Danh sách đơn', path: '/bao-cao-chi-tiet' },
            { code: 'MKT_PAGES', name: 'Danh sách Page', path: '/danh-sach-page' },
            { code: 'MKT_MANUAL', name: 'Ds báo cáo tay', path: '/danh-sach-bao-cao-tay-mkt' }
        ]
    },
    'MODULE_RND': {
        name: 'QUẢN LÝ R&D',
        pages: [
            { code: 'RND_INPUT', name: 'Nhập báo cáo', path: '/bao-cao-rd' },
            { code: 'RND_VIEW', name: 'Xem báo cáo R&D', path: '/xem-bao-cao-rd' },
            { code: 'RND_ORDERS', name: 'Danh sách đơn', path: '/bao-cao-chi-tiet-rd' },
            { code: 'RND_PAGES', name: 'Danh sách Page', path: '/danh-sach-page-rd' },
            { code: 'RND_MANUAL', name: 'Ds báo cáo tay', path: '/danh-sach-bao-cao-tay-rd' },
            { code: 'RND_NEW_ORDER', name: 'Nhập đơn mới', path: '/nhap-don' },
            { code: 'RND_HISTORY', name: 'Lịch sử thay đổi', path: '/lich-su-sale-order' }
        ]
    },
    'MODULE_SALE': {
        name: 'QUẢN LÝ SALE & ORDER',
        pages: [
            { code: 'SALE_ORDERS', name: 'Danh sách đơn', path: '/danh-sach-don' },
            { code: 'SALE_NEW_ORDER', name: 'Nhập đơn mới', path: '/nhap-don' },
            { code: 'SALE_INPUT', name: 'Sale nhập báo cáo', path: '/sale-nhap-bao-cao' },
            { code: 'SALE_VIEW', name: 'Xem báo cáo Sale', path: '/bao-cao-sale' },
            { code: 'SALE_MANUAL', name: 'Danh sách báo cáo tay', path: '/danh-sach-bao-cao-tay' },
            { code: 'SALE_HISTORY', name: 'Lịch sử thay đổi', path: '/lich-su-sale-order' }
        ]
    },
    'MODULE_ORDERS': {
        name: 'QUẢN LÝ VẬN ĐƠN & KHO',
        pages: [
            { code: 'ORDERS_LIST', name: 'Danh sách đơn', path: '/quan-ly-van-don' },
            { code: 'ORDERS_NEW', name: 'Nhập đơn mới', path: '/nhap-don' },
            { code: 'ORDERS_UPDATE', name: 'Chỉnh sửa đơn', path: '/chinh-sua-don' },
            { code: 'ORDERS_REPORT', name: 'Báo cáo vận đơn', path: '/bao-cao-van-don' },
            { code: 'ORDERS_FFM', name: 'FFM', path: '/ffm' },
            { code: 'ORDERS_HISTORY', name: 'Lịch sử thay đổi', path: '/lich-su-van-don' }
        ]
    },
    'MODULE_CSKH': {
        name: 'CSKH & CRM',
        pages: [
            { code: 'CSKH_LIST', name: 'Danh sách đơn', path: '/quan-ly-cskh' },
            { code: 'CSKH_PAID', name: 'Đơn đã thu tiền/cần CS', path: '/don-chia-cskh' },
            { code: 'CSKH_NEW_ORDER', name: 'Nhập đơn mới', path: '/nhap-don' },
            { code: 'CSKH_INPUT', name: 'Nhập báo cáo', path: '/nhap-bao-cao-cskh' },
            { code: 'CSKH_VIEW', name: 'Xem báo cáo CSKH', path: '/xem-bao-cao-cskh' },
            { code: 'CSKH_HISTORY', name: 'Lịch sử thay đổi', path: '/lich-su-cskh' }
        ]
    },
    'MODULE_HR': {
        name: 'QUẢN LÝ NHÂN SỰ',
        pages: [
            { code: 'HR_LIST', name: 'Danh sách nhân sự', path: '/nhan-su' },
            { code: 'HR_DASHBOARD', name: 'HR Dashboard', path: '/hr-dashboard' },
            { code: 'HR_KPI', name: 'Báo cáo hiệu suất', path: '/bao-cao-hieu-suat-kpi' },
            { code: 'HR_PROFILE', name: 'Hồ sơ cá nhân', path: '/ho-so' }
        ]
    },
    'MODULE_FINANCE': {
        name: 'QUẢN LÝ TÀI CHÍNH',
        pages: [
            { code: 'FINANCE_DASHBOARD', name: 'Finance Dashboard', path: '/finance-dashboard' },
            { code: 'FINANCE_KPI', name: 'Báo cáo KPI', path: '/bao-cao-kpi' }
        ]
    },
    'MODULE_ADMIN': {
        name: 'Admin Tools',
        pages: [
            { code: 'ADMIN_TOOLS', name: 'Công cụ quản trị & Cấu hình', path: '/admin' }
        ]
    }
};

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
    'MODULE_HR': [
        '*'
    ],
    'MODULE_FINANCE': [
        '*'
    ],
    'MODULE_ADMIN': [
        // Admin không giới hạn columns
        '*'
    ],
    'MODULE_LUMI': [
        '*'
    ]
};

// Helper: Get column suggestions as comma-separated string for placeholder
export const getColumnSuggestions = (resourceCode, maxCount = 5) => {
    const cols = COLUMN_DEFINITIONS[resourceCode] || [];
    if (cols[0] === '*') return '*';
    return cols.slice(0, maxCount).join(', ') + (cols.length > maxCount ? '...' : '');
};

// --- PAGE PERMISSION APIS (Hierarchical RBAC) ---
export const getPagePermissions = async (role_code) => {
    const { data, error } = await supabase
        .from('app_page_permissions')
        .select('*')
        .eq('role_code', role_code);
    if (error) throw error;
    return data || [];
};

// Sanitize payload to ensure it matches DB schema exactly
const sanitizePermission = (p) => ({
    role_code: p.role_code,
    page_code: p.page_code,
    can_view: !!p.can_view,
    can_edit: !!p.can_edit,
    can_delete: !!p.can_delete,
    allowed_columns: Array.isArray(p.allowed_columns) ? p.allowed_columns : null
});

export const upsertPagePermission = async (permission) => {
    const payload = sanitizePermission(permission);
    const { data, error } = await supabase
        .from('app_page_permissions')
        .upsert(payload, { onConflict: 'role_code,page_code' })
        .select();
    if (error) {
        console.error("Upsert Permission Error:", error);
        throw error;
    }
    return data[0];
};

export const batchUpdatePagePermissions = async (permissions) => {
    const payload = permissions.map(sanitizePermission);
    const { error } = await supabase
        .from('app_page_permissions')
        .upsert(payload, { onConflict: 'role_code,page_code' });
    if (error) {
        console.error("Batch Upsert Error:", error);
        throw error;
    }
};
