import { useEffect, useState } from 'react';
import { usePermissions } from '../hooks/usePermissions';

export default function NhapBaoCaoCSKH() {
    const { canView } = usePermissions();
    const [currentUserInfo, setCurrentUserInfo] = useState({ ten: '', email: '' });

    useEffect(() => {
        // Get user info from localStorage
        const ten = localStorage.getItem('username') || '';
        const email = localStorage.getItem('userEmail') || '';
        setCurrentUserInfo({ ten, email });
    }, []);

    if (!canView('CSKH_INPUT')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h2>
                    <p className="text-gray-600">Bạn không có quyền truy cập trang này (CSKH_INPUT).</p>
                </div>
            </div>
        );
    }

    if (!currentUserInfo.ten || !currentUserInfo.email) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                Đang tải thông tin người dùng...
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100vh' }}>
            <iframe
                src={`https://nguyenbatyads37.github.io/static-html-show-data/baoCaoThuCong.html?hoten=${encodeURIComponent(currentUserInfo.ten)}&email=${encodeURIComponent(currentUserInfo.email)}&tableName=Báo cáo CSKH`}
                title="Báo cáo CSKH"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                }}
            />
        </div>
    );
}
