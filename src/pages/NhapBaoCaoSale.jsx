import { useEffect, useState } from 'react';

export default function NhapBaoCaoSale() {
    const [userInfo, setUserInfo] = useState({ name: '', email: '' });

    useEffect(() => {
        const name = localStorage.getItem('username') || '';
        const email = localStorage.getItem('userEmail') || '';
        setUserInfo({ name, email });
    }, []);

    if (!userInfo.name || !userInfo.email) {
        return (
            <div className="flex items-center justify-center min-h-screen text-gray-500">
                Đang tải thông tin người dùng...
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-white">
            <iframe
                src={`https://nguyenbatyads37.github.io/static-html-show-data/baoCaoThuCong.html?hoten=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email)}&tableName=Báo cáo sale`}
                title="Sale nhập báo cáo"
                className="w-full h-full border-none"
            />
        </div>
    );
}
