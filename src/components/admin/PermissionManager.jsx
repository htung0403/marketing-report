import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronDown, Edit, Lock, Plus, Shield, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as rbacService from '../../services/rbacService';
import PermissionTree from './PermissionTree';

const TeamEditor = ({ email, currentTeam, department, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(currentTeam || '');

    useEffect(() => {
        setValue(currentTeam || '');
    }, [currentTeam]);

    const handleSave = () => {
        if (value !== currentTeam) {
            onSave(value);
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    className="border rounded px-2 py-1 text-xs w-24 md:w-32 focus:outline-blue-500 uppercase placeholder-gray-300"
                    value={value}
                    onChange={(e) => setValue(e.target.value.toUpperCase())}
                    placeholder={`${department}_...`}
                />
                <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1"><Check size={14} /></button>
                <button onClick={() => { setIsEditing(false); setValue(currentTeam || ''); }} className="text-red-500 hover:text-red-600 p-1"><X size={14} /></button>
            </div>
        );
    }

    return (
        <div
            className="group flex items-center justify-between cursor-pointer hover:bg-gray-100 p-1 rounded -ml-1 pr-2"
            onClick={() => setIsEditing(true)}
            title="Nhấn để sửa Team"
        >
            <span className={`text-sm ${!currentTeam ? 'text-gray-400 italic' : 'text-gray-700'}`}>
                {currentTeam || 'Chưa gán'}
            </span>
            <Edit size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

// Helper Component for Multi-Select Columns
const MultiSelectColumn = ({ resourceCode, selectedColumns, onChange }) => {
    // selectedColumns is array of strings e.g. ["*"] or ["col1", "col2"]
    const allColumns = rbacService.COLUMN_DEFINITIONS[resourceCode] || [];
    const isAllSelected = selectedColumns.includes("*");

    // Filter out '*' from count if it exists (though strictly if '*' is there, it should be the only one ideally, or handled logically)
    const selectedCount = isAllSelected ? allColumns.length : selectedColumns.length;

    const toggleColumn = (col) => {
        let newSelection = [...selectedColumns];

        if (isAllSelected) {
            // If currently All, switching to specific means we start with All minus the toggled one? 
            // Or usually: Unchecking one from All -> Switch to list of (All - 1)
            newSelection = [...allColumns]; // Expand * to full list
            newSelection = newSelection.filter(c => c !== col);
        } else {
            if (newSelection.includes(col)) {
                newSelection = newSelection.filter(c => c !== col);
            } else {
                newSelection.push(col);
            }
        }

        // Check if we effectively selected all again
        if (newSelection.length === allColumns.length && allColumns.length > 0) {
            onChange(["*"]);
        } else if (newSelection.length === 0) {
            onChange([]);
        } else {
            onChange(newSelection);
        }
    };

    const toggleAll = () => {
        if (isAllSelected) {
            onChange([]); // Deselect All
        } else {
            onChange(["*"]); // Select All
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-8 text-xs font-normal border-dashed justify-start w-full md:w-[300px] overflow-hidden">
                    {isAllSelected ? (
                        <span className="flex items-center text-blue-600 font-semibold"><Check className="w-3 h-3 mr-1" /> Tất cả ({allColumns.length} cột)</span>
                    ) : selectedCount > 0 ? (
                        <span className="flex items-center text-gray-800">Đã chọn {selectedCount} cột</span>
                    ) : (
                        <span className="text-gray-400 italic">Chọn cột cho phép...</span>
                    )}
                    <ChevronDown className="ml-auto w-3 h-3 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-white shadow-md border" align="start">
                <div className="p-2 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                    <span className="text-xs font-semibold text-gray-500">Danh sách cột</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 px-2" onClick={toggleAll}>
                        {isAllSelected ? "Bỏ chọn hết" : "Chọn tất cả"}
                    </Button>
                </div>
                <ScrollArea className="h-[250px] p-2">
                    <div className="space-y-1">
                        {allColumns.map(col => {
                            const isChecked = isAllSelected || selectedColumns.includes(col);
                            return (
                                <div key={col} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer" onClick={() => toggleColumn(col)}>
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => toggleColumn(col)}
                                        id={`col-${resourceCode}-${col}`}
                                    />
                                    <label
                                        htmlFor={`col-${resourceCode}-${col}`}
                                        className="text-sm cursor-pointer flex-1 user-select-none"
                                    >
                                        {col}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
                    Cột được chọn sẽ hiển thị với nhân viên
                </div>
            </PopoverContent>
        </Popover>
    );
};

const PermissionManager = ({ searchQuery = "" }) => {
    // Dynamic DEPARTMENTS derived from employees "department" field
    // const DEPARTMENTS = ["SALE", "MKT", "RND", "CSKH", "KHO", "HR", "ADMIN", "ACCOUNTANT"];
    // const POSITIONS = [...now derived from employees data...];
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [activeTab, setActiveTab] = useState('roles'); // 'roles' | 'users' | 'matrix'
    const [loading, setLoading] = useState(false);

    // Create Role State
    const [newRole, setNewRole] = useState({ code: '', name: '', department: '' });

    // Assign User State
    const [assignEmail, setAssignEmail] = useState('');
    const [assignRole, setAssignRole] = useState('');

    // Matrix State
    const [selectedRole, setSelectedRole] = useState(null);

    // Edit User Role State
    const [editingUser, setEditingUser] = useState(null); // { email, role_code }
    const [newAssignRole, setNewAssignRole] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [rData, uData, eData] = await Promise.all([
                rbacService.getRoles(),
                rbacService.getUserRoles(),
                rbacService.getEmployees()
            ]);
            setRoles(rData || []);
            setUserRoles(uData || []);
            setEmployees(eData || []);
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
            // Sanitize payload: only send fields that exist in DB
            const payload = {
                code: newRole.code,
                name: newRole.name,
                department: newRole.department
            };
            await rbacService.createRole(payload);
            toast.success("Đã tạo nhóm quyền mới");
            setNewRole({ code: '', name: '', department: '' });
            loadData();
        } catch (error) {
            if (error.message?.includes('duplicate key') || error.code === '23505') {
                toast.error("Mã nhóm quyền này đã tồn tại! Vui lòng đặt mã khác.");
            } else {
                toast.error("Lỗi tạo nhóm: " + error.message);
            }
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

    const handleUpdateUserRole = async () => {
        if (!editingUser || !newAssignRole) return toast.warning("Vui lòng chọn vai trò mới");
        try {
            await rbacService.assignUserRole(editingUser.email, newAssignRole);
            toast.success(`Đã cập nhật quyền cho ${editingUser.email}`);
            setEditingUser(null);
            setNewAssignRole('');
            loadData();
        } catch (error) {
            toast.error("Lỗi cập nhật: " + error.message);
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

    // --- CODE NORMALIZATION & DICTIONARY ---
    const CODE_MAP = {
        "TRUONG_NHOM": "LEADER",
        "NHAN_VIEN": "MEMBER",
        "TRUONG_PHONG": "MANAGER",
        "GIAM_DOC": "DIRECTOR",
        "THUC_TAP_SINH": "INTERN",
        "LOGISTIC": "LOGISTICS",
        "KE_TOAN": "ACCOUNTANT",
        "VAN_DON": "ORDERS"
    };

    const getStandardizedCode = (str) => {
        if (!str) return "";
        const rawCode = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D")
            .toUpperCase().replace(/\s+/g, "_");
        return CODE_MAP[rawCode] || rawCode;
    };

    // --- FILTERING ---
    const filteredRoles = roles.filter(role => {
        const q = searchQuery.toLowerCase();
        return role.name.toLowerCase().includes(q) || role.code.toLowerCase().includes(q);
    });

    const filteredUserRoles = userRoles.filter(ur => {
        const q = searchQuery.toLowerCase();
        return ur.email.toLowerCase().includes(q) || ur.role_code.toLowerCase().includes(q);
    });

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
                            <select
                                className="border p-2 rounded text-sm"
                                value={newRole.department}
                                onChange={e => {
                                    const dept = e.target.value;
                                    const pos = newRole.position || "";

                                    const posCode = getStandardizedCode(pos);
                                    const deptCode = getStandardizedCode(dept);

                                    // Auto-gen Code: DEPT_POS
                                    const code = (deptCode && posCode) ? `${deptCode}_${posCode}` : (deptCode ? deptCode + "_" : "");
                                    // Auto-gen Name: Position Label + Dept
                                    const name = (dept && pos) ? `${pos} ${dept}` : "";

                                    setNewRole(prev => ({ ...prev, department: dept, code, name }));
                                }}
                            >
                                <option value="">-- Chọn Phòng Ban --</option>
                                {[...new Set(employees.map(e => e.department).filter(Boolean))].map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>

                            <select
                                className="border p-2 rounded text-sm md:col-span-2"
                                value={newRole.position || ""}
                                onChange={e => {
                                    const pos = e.target.value;
                                    const dept = newRole.department || "";

                                    const posCode = getStandardizedCode(pos);
                                    const deptCode = getStandardizedCode(dept);

                                    // Auto-gen Code: DEPT_POS
                                    const code = (deptCode && posCode) ? `${deptCode}_${posCode}` : (deptCode ? deptCode + "_" : "");
                                    // Auto-gen Name: Position Label + Dept
                                    const name = (dept && pos) ? `${pos} ${dept}` : "";

                                    setNewRole(prev => ({ ...prev, position: pos, code, name }));
                                }}
                            >
                                <option value="">-- Chọn Vị Trí --</option>
                                {[...new Set(employees.map(e => e.position).filter(Boolean))].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <button onClick={handleCreateRole} className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2">
                                <Plus size={16} /> Thêm Mới
                            </button>
                        </div>
                        {/* Preview computed values */}
                        {(newRole.code || newRole.name) && (
                            <div className="flex gap-4 text-xs text-gray-500 px-2">
                                <span>Mã: <b className="text-blue-600">{newRole.code}</b></span>
                                <span>Tên: <b className="text-blue-600">{newRole.name}</b></span>
                            </div>
                        )}

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
                                    {filteredRoles.map(role => (
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
                                    {filteredRoles.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center text-gray-500">
                                                Không tìm thấy kết quả
                                            </td>
                                        </tr>
                                    )}
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
                                <select
                                    className="border p-2 rounded text-sm w-full"
                                    value={assignEmail}
                                    onChange={e => {
                                        const email = e.target.value;
                                        setAssignEmail(email);

                                        // Auto-suggest Role
                                        const emp = employees.find(e => e.email === email);
                                        if (emp && emp.department && emp.position) {
                                            const deptCode = getStandardizedCode(emp.department);
                                            const posCode = getStandardizedCode(emp.position);
                                            const suggestedCode = `${deptCode}_${posCode}`;

                                            // Try exact match or match with common prefix issues
                                            // But standard is standard, we look for exact match
                                            if (roles.some(r => r.code === suggestedCode)) {
                                                setAssignRole(suggestedCode);
                                            }
                                        }
                                    }}
                                >
                                    <option value="">-- Chọn Nhân viên --</option>
                                    {employees
                                        .filter(emp => !userRoles.some(ur => ur.email === emp.email))
                                        .map(emp => (
                                            <option key={emp.email} value={emp.email}>
                                                {emp['Họ Và Tên']} ({emp.email})
                                            </option>
                                        ))}
                                    {employees.filter(emp => !userRoles.some(ur => ur.email === emp.email)).length === 0 && (
                                        <option disabled>Đã phân quyền hết nhân viên</option>
                                    )}
                                </select>
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
                                        <th className="p-3">Tên nhân viên</th>
                                        <th className="p-3">Bộ phận</th>
                                        <th className="p-3">Nhóm (Team)</th>
                                        <th className="p-3">Vai trò</th>
                                        <th className="p-3">Updated At</th>
                                        <th className="p-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredUserRoles.map(ur => {
                                        const role = roles.find(r => r.code === ur.role_code);
                                        const emp = employees.find(e => e.email === ur.email);
                                        return (
                                            <tr key={ur.email} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium">{ur.email}</td>
                                                <td className="p-3 text-gray-700">{emp ? emp['Họ Và Tên'] : '-'}</td>
                                                <td className="p-3 text-gray-600">{emp ? emp.department : '-'}</td>
                                                <td className="p-3">
                                                    <TeamEditor
                                                        email={ur.email}
                                                        currentTeam={emp ? emp.team : ''}
                                                        department={emp ? emp.department : ''}
                                                        onSave={async (newTeam) => {
                                                            try {
                                                                await rbacService.updateUserTeam(ur.email, newTeam);
                                                                toast.success(`Đã cập nhật team cho ${ur.email}`);
                                                                loadData();
                                                            } catch (error) {
                                                                toast.error("Lỗi cập nhật team: " + error.message);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                                                        {role ? role.name : ur.role_code}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-gray-500 text-xs">{new Date(ur.assigned_at).toLocaleDateString()}</td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser({ email: ur.email, role_code: ur.role_code });
                                                                setNewAssignRole(ur.role_code);
                                                            }}
                                                            className="text-gray-400 hover:text-blue-600 p-1"
                                                            title="Sửa quyền"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveUser(ur.email)}
                                                            className="text-gray-400 hover:text-red-600 p-1"
                                                            title="Xóa quyền"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {filteredUserRoles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-4 text-center text-gray-500">
                                                Không tìm thấy kết quả
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Edit User Role Modal */}
                        {editingUser && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Sửa Vai Trò</h3>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email: <strong>{editingUser.email}</strong>
                                        </label>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn vai trò mới:</label>
                                        <select
                                            className="border p-2 rounded text-sm w-full"
                                            value={newAssignRole}
                                            onChange={e => setNewAssignRole(e.target.value)}
                                        >
                                            <option value="">-- Chọn Role --</option>
                                            {roles.map(r => <option key={r.code} value={r.code}>{r.name} ({r.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(null);
                                                setNewAssignRole('');
                                            }}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleUpdateUserRole}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                                        >
                                            Cập nhật
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            <PermissionTree roleCode={selectedRole} />
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
