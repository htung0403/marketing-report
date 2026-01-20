import { useEffect, useState } from 'react';

export default function NhapBaoCaoSale() {
    const [currentUserInfo, setCurrentUserInfo] = useState({ ten: '', email: '' });

    useEffect(() => {
        // Get user info from localStorage
        const ten = localStorage.getItem('username') || '';
        const email = localStorage.getItem('userEmail') || '';
        setCurrentUserInfo({ ten, email });
    }, []);

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
                src={`https://nguyenbatyads37.github.io/static-html-show-data/baoCaoThuCong.html?hoten=${encodeURIComponent(currentUserInfo.ten)}&email=${encodeURIComponent(currentUserInfo.email)}&tableName=Báo cáo Sale`}
                title="Báo cáo Sale"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                }}
            />
        </div>
    );
}
