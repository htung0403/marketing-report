import { ChevronDown, ChevronRight, Edit, Eye, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as rbacService from '../../services/rbacService';

const PermissionTree = ({ roleCode, onPermissionChange }) => {
    const [permissions, setPermissions] = useState([]);
    const [expandedModules, setExpandedModules] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (roleCode) {
            loadPermissions();
        }
    }, [roleCode]);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const data = await rbacService.getPagePermissions(roleCode);
            setPermissions(data);

            // Auto-expand all modules on load
            const expanded = {};
            Object.keys(rbacService.MODULE_PAGES).forEach(moduleCode => {
                expanded[moduleCode] = true;
            });
            setExpandedModules(expanded);
        } catch (error) {
            console.error('Error loading page permissions:', error);
            toast.error('Lỗi tải quyền: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (moduleCode) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleCode]: !prev[moduleCode]
        }));
    };

    const getPagePermission = (pageCode) => {
        return permissions.find(p => p.page_code === pageCode) || {
            role_code: roleCode,
            page_code: pageCode,
            can_view: false,
            can_edit: false,
            can_delete: false
        };
    };

    const handlePermissionChange = async (pageCode, action, value) => {
        const existing = getPagePermission(pageCode);
        const updated = { ...existing, [action]: value };

        // Update local state optimistically
        const newPerms = permissions.filter(p => p.page_code !== pageCode);
        newPerms.push(updated);
        setPermissions(newPerms);

        try {
            await rbacService.upsertPagePermission(updated);
        } catch (error) {
            toast.error('Lỗi lưu quyền: ' + error.message);
            // Reload on error
            loadPermissions();
        }
    };

    const toggleAllActions = (moduleCode, action) => {
        const module = rbacService.MODULE_PAGES[moduleCode];
        if (!module) return;

        // Check if all pages in this module have this action enabled
        const allEnabled = module.pages.every(page => {
            const perm = getPagePermission(page.code);
            return perm[action];
        });

        // Toggle all to opposite
        const newValue = !allEnabled;

        // Update all pages in module
        const updates = module.pages.map(page => {
            const existing = getPagePermission(page.code);
            return { ...existing, [action]: newValue };
        });

        setPermissions(prev => {
            const filtered = prev.filter(p => !module.pages.some(page => page.code === p.page_code));
            return [...filtered, ...updates];
        });

        // Save to database
        rbacService.batchUpdatePagePermissions(updates).catch(err => {
            toast.error('Lỗi cập nhật hàng loạt');
            loadPermissions();
        });
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Đang tải...</div>;
    }

    return (
        <div className="space-y-2">
            {Object.entries(rbacService.MODULE_PAGES).map(([moduleCode, module]) => {
                const isExpanded = expandedModules[moduleCode];

                return (
                    <div key={moduleCode} className="border rounded-lg overflow-hidden">
                        {/* Module Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                            <div className="flex items-center justify-between p-3">
                                <button
                                    onClick={() => toggleModule(moduleCode)}
                                    className="flex items-center gap-2 flex-1 text-left font-semibold text-gray-800 hover:text-blue-600"
                                >
                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    <span>{module.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">({module.pages.length} trang)</span>
                                </button>

                                {/* Quick Actions for entire module */}
                                <div className="flex items-center gap-4 text-xs">
                                    <button
                                        onClick={() => toggleAllActions(moduleCode, 'can_view')}
                                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-100 text-blue-700"
                                        title="Chọn/bỏ tất cả Xem"
                                    >
                                        <Eye size={14} /> Tất cả
                                    </button>
                                    <button
                                        onClick={() => toggleAllActions(moduleCode, 'can_edit')}
                                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-green-100 text-green-700"
                                        title="Chọn/bỏ tất cả Sửa"
                                    >
                                        <Edit size={14} /> Tất cả
                                    </button>
                                    <button
                                        onClick={() => toggleAllActions(moduleCode, 'can_delete')}
                                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 text-red-700"
                                        title="Chọn/bỏ tất cả Xóa"
                                    >
                                        <Trash2 size={14} /> Tất cả
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Pages List */}
                        {isExpanded && (
                            <div className="divide-y bg-white">
                                {module.pages.map(page => {
                                    const perm = getPagePermission(page.code);

                                    return (
                                        <div key={page.code} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-800">{page.name}</div>
                                                <div className="text-xs text-gray-500">{page.path}</div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {/* View */}
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={perm.can_view}
                                                        onChange={e => handlePermissionChange(page.code, 'can_view', e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-600 group-hover:text-blue-600 flex items-center gap-1">
                                                        <Eye size={14} /> Xem
                                                    </span>
                                                </label>

                                                {/* Edit */}
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={perm.can_edit}
                                                        onChange={e => handlePermissionChange(page.code, 'can_edit', e.target.checked)}
                                                        className="w-4 h-4 text-green-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-600 group-hover:text-green-600 flex items-center gap-1">
                                                        <Edit size={14} /> Sửa
                                                    </span>
                                                </label>

                                                {/* Delete */}
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={perm.can_delete}
                                                        onChange={e => handlePermissionChange(page.code, 'can_delete', e.target.checked)}
                                                        className="w-4 h-4 text-red-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-600 group-hover:text-red-600 flex items-center gap-1">
                                                        <Trash2 size={14} /> Xóa
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PermissionTree;
