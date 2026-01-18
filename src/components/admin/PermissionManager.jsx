import { AlertCircle, Lock, Plus, Shield, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as rbacService from '../../services/rbacService';

const PermissionManager = () => {
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);

    const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users' | 'matrix'
    const [loading, setLoading] = useState(false);

    // Create Role State
    const [newRole, setNewRole] = useState({ code: '', name: '', department: '' });

    // Assign User State
    const [assignEmail, setAssignEmail] = useState('');
    const [assignRole, setAssignRole] = useState('');

    // Matrix State
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rData, uData] = await Promise.all([
                rbacService.getRoles(),
                rbacService.getUserRoles()
            ]);
            setRoles(rData || []);
            setUserRoles(uData || []);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi tải dữ liệu phân quyền");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async () => {
        if (!newRole.code || !newRole.name) return toast.warning("Vui lòng nhập Mã và Tên nhóm quyền");
        try {
            await rbacService.createRole(newRole);
            toast.success("Đã tạo nhóm quyền mới");
            setNewRole({ code: '', name: '', department: '' });
            loadData();
        } catch (error) {
            toast.error("Lỗi tạo nhóm: " + error.message);
        }
    };

    const handleDeleteRole = async (code) => {
        if (!window.confirm("Bạn chắc chắn muốn xóa nhóm quyền này?")) return;
        try {
            await rbacService.deleteRole(code);
            toast.success("Đã xóa nhóm quyền");
            loadData();
            if (selectedRole === code) setSelectedRole(null);
        } catch (error) {
            toast.error("Lỗi xóa: " + error.message);
        }
    };

    const handleAssignUser = async () => {
        if (!assignEmail || !assignRole) return toast.warning("Nhập email và chọn nhóm quyền");
        try {
            await rbacService.assignUserRole(assignEmail, assignRole);
            toast.success(`Đã gán ${assignEmail} vào nhóm ${assignRole}`);
            setAssignEmail('');
            loadData();
        } catch (error) {
            toast.error("Lỗi gán quyền: " + error.message);
        }
    };

    const handleRemoveUser = async (email) => {
        if (!window.confirm(`Gỡ quyền của ${email}?`)) return;
        try {
            await rbacService.removeUserRole(email);
            toast.success("Đã gỡ quyền");
            loadData();
        } catch (error) {
            toast.error("Lỗi: " + error.message);
        }
    };

    // --- PERMISSION MATRIX LOGIC ---
    useEffect(() => {
        if (activeTab === 'matrix' && selectedRole) {
            loadPermissionsForRole(selectedRole);
        }
    }, [activeTab, selectedRole]);

    const loadPermissionsForRole = async (roleCode) => {
        try {
            const data = await rbacService.getPermissions(roleCode);
            setPermissions(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handlePermissionChange = async (resourceCode, field, value) => {
        if (!selectedRole) return;

        const existing = permissions.find(p => p.resource_code === resourceCode) || {
            role_code: selectedRole,
            resource_code: resourceCode,
            can_view: false,
            can_edit: false,
            can_delete: false,
            allowed_columns: ["*"]
        };

        const updated = { ...existing, [field]: value };

        // Optimistic Update
        const newPerms = permissions.filter(p => p.resource_code !== resourceCode);
        newPerms.push(updated);
        setPermissions(newPerms);

        // Save Debounced? No, save immediately for admin tools usually fine
        try {
            await rbacService.upsertPermission(updated);
        } catch (error) {
            toast.error("Lỗi lưu quyền: " + error.message);
        }
    };

    const handleColumnChange = async (resourceCode, colListString) => {
        // Parse comma separated
        try {
            const cols = colListString.split(',').map(s => s.trim()).filter(Boolean);
            await handlePermissionChange(resourceCode, 'allowed_columns', cols.length ? cols : ["*"]);
        } catch (e) {
            // ignore
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 animate-fadeIn overflow-hidden">
            {/* SUB-TABS */}
            <div className="flex bg-gray-50 border-b">
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'roles' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Shield size={16} /> Nhóm Quyền (Roles)
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Users size={16} /> Phân quyền Nhân viên
                </button>
                <button
                    onClick={() => setActiveTab('matrix')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'matrix' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Lock size={16} /> Phân quyền Chi tiết (Matrix)
                </button>
            </div>

            <div className="p-6">
                {/* 1. ROLES MANAGEMENT */}
                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-blue-50 p-4 rounded-lg">
                            <input
                                className="border p-2 rounded text-sm"
                                placeholder="Mã (VD: SALE_LEADER)"
                                value={newRole.code}
                                onChange={e => setNewRole({ ...newRole, code: e.target.value.toUpperCase() })}
                            />
                            <input
                                className="border p-2 rounded text-sm md:col-span-2"
                                placeholder="Tên hiển thị (VD: Trưởng nhóm Sale)"
                                value={newRole.name}
                                onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                            />
                            <button onClick={handleCreateRole} className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Plus size={16} /> Thêm Mới
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border rounded-lg">
                                <thead className="bg-gray-100 font-semibold text-gray-600">
                                    <tr>
                                        <th className="p-3">Mã Role</th>
                                        <th className="p-3">Tên Role</th>
                                        <th className="p-3">Bộ phận</th>
                                        <th className="p-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {roles.map(role => (
                                        <tr key={role.code} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium text-blue-800">{role.code}</td>
                                            <td className="p-3">{role.name}</td>
                                            <td className="p-3">{role.department || '-'}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleDeleteRole(role.code)} className="text-gray-400 hover:text-red-600 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 2. USER ASSIGNMENT */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-4 bg-teal-50 p-4 rounded-lg items-end">
                            <div className="flex-1 w-full">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Email Nhân viên</label>
                                <input
                                    className="border p-2 rounded text-sm w-full"
                                    placeholder="nhanvien@marketing.com"
                                    value={assignEmail}
                                    onChange={e => setAssignEmail(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-64">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Chọn Vai Trò</label>
                                <select
                                    className="border p-2 rounded text-sm w-full"
                                    value={assignRole}
                                    onChange={e => setAssignRole(e.target.value)}
                                >
                                    <option value="">-- Chọn Role --</option>
                                    {roles.map(r => <option key={r.code} value={r.code}>{r.name} ({r.code})</option>)}
                                </select>
                            </div>
                            <button onClick={handleAssignUser} className="bg-teal-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-teal-700 flex items-center justify-center gap-2 h-10 w-full md:w-auto">
                                <Plus size={16} /> Gán Quyền
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border rounded-lg">
                                <thead className="bg-gray-100 font-semibold text-gray-600">
                                    <tr>
                                        <th className="p-3">Email</th>
                                        <th className="p-3">Vai trò</th>
                                        <th className="p-3">Updated At</th>
                                        <th className="p-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {userRoles.map(ur => (
                                        <tr key={ur.email} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{ur.email}</td>
                                            <td className="p-3">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                                    {ur.role_code}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-500 text-xs">{new Date(ur.assigned_at).toLocaleDateString()}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveUser(ur.email)} className="text-gray-400 hover:text-red-600 p-1">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. PERMISSION MATRIX */}
                {activeTab === 'matrix' && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                            <label className="font-semibold text-gray-700">Đang cấu hình cho:</label>
                            <select
                                className="border p-2 rounded shadow-sm text-blue-700 font-semibold bg-blue-50"
                                value={selectedRole || ''}
                                onChange={e => setSelectedRole(e.target.value)}
                            >
                                <option value="">-- Chọn Bộ Phận / Vị Trí --</option>
                                {roles.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
                            </select>
                        </div>

                        {selectedRole ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border rounded-lg">
                                    <thead className="bg-gray-100 font-semibold text-gray-700">
                                        <tr>
                                            <th className="p-3 border-b w-64">Module (Resource)</th>
                                            <th className="p-3 border-b text-center w-20">Xem</th>
                                            <th className="p-3 border-b text-center w-20">Sửa</th>
                                            <th className="p-3 border-b text-center w-20">Xóa</th>
                                            <th className="p-3 border-b">Cột được phép (Nhập tên cột, cách nhau dấu phẩy)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-gray-700">
                                        {rbacService.AVAILABLE_RESOURCES.map(res => {
                                            const perm = permissions.find(p => p.resource_code === res.code) || {};
                                            const cols = perm.allowed_columns || ['*'];
                                            const colString = Array.isArray(cols) ? cols.join(', ') : '*';

                                            return (
                                                <tr key={res.code} className="hover:bg-gray-50">
                                                    <td className="p-3 font-medium border-r bg-gray-50">{res.name}</td>
                                                    <td className="p-3 text-center border-r">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-blue-600 rounded"
                                                            checked={!!perm.can_view}
                                                            onChange={e => handlePermissionChange(res.code, 'can_view', e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center border-r">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-orange-500 rounded"
                                                            checked={!!perm.can_edit}
                                                            onChange={e => handlePermissionChange(res.code, 'can_edit', e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center border-r">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 text-red-600 rounded"
                                                            checked={!!perm.can_delete}
                                                            onChange={e => handlePermissionChange(res.code, 'can_delete', e.target.checked)}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                className="border rounded px-2 py-1 w-full text-xs font-mono"
                                                                defaultValue={colString}
                                                                onBlur={e => handleColumnChange(res.code, e.target.value)}
                                                                placeholder="*, hoặc id, name, status..."
                                                            />
                                                            <div className="group relative">
                                                                <AlertCircle size={16} className="text-gray-400 cursor-help" />
                                                                <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-black text-white text-xs rounded hidden group-hover:block z-50">
                                                                    Nhập dấu * để xem tất cả. <br />
                                                                    Hoặc nhập tên cột cách nhau bởi dấu phẩy.<br />
                                                                    VD: <code>name, email, phone</code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400 bg-gray-50 border border-dashed rounded-lg">
                                Vui lòng chọn một Nhóm quyền để cấu hình.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PermissionManager;
