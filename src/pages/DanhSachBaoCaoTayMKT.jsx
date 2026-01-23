import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import usePermissions from '../hooks/usePermissions';
import { supabase } from '../supabase/config';
import './BaoCaoSale.css'; // Reusing styles for consistency

// Helpers
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatDate = (dateValue) => {
    if (!dateValue) return '';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return dateValue;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

export default function DanhSachBaoCaoTayMKT() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const teamFilter = searchParams.get('team'); // 'RD' or null

    // Permission Logic
    const { canView } = usePermissions();
    // Assuming MKT_REPORT_LIST is the specific permission for MKT manual lists if it exists, 
    // otherwise MKT_VIEW or similar. Dynamic based on context.
    // Let's stick to standard naming: RND_REPORT_LIST for R&D context, MKT_REPORT_LIST for MKT.
    const permissionCode = teamFilter === 'RD' ? 'RND_MANUAL' : 'MKT_MANUAL';



    const [loading, setLoading] = useState(true);
    const [manualReports, setManualReports] = useState([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: ''
    });

    // Initialize Dates
    useEffect(() => {
        const today = new Date();
        const d = new Date();
        d.setDate(d.getDate() - 3);
        const formatDateForInput = (date) => date.toISOString().split('T')[0];

        setFilters({
            startDate: formatDateForInput(d),
            endDate: formatDateForInput(today)
        });
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!filters.startDate || !filters.endDate) return;
            setLoading(true);
            try {
                // Determine table name. Based on BaoCaoMarketing.jsx, it writes to 'detail_reports'
                const { data, error } = await supabase
                    .from('detail_reports')
                    .select('*')
                    .gte('Ngày', filters.startDate)
                    .lte('Ngày', filters.endDate)
                    // Trying to order by date, assuming 'Ngày' is the column
                    .order('Ngày', { ascending: false });

                if (error) throw error;
                setManualReports(data || []);
            } catch (error) {
                console.error('Error fetching MKT reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters.startDate, filters.endDate]);

    if (!canView(permissionCode)) {
        return <div className="p-8 text-center text-red-600 font-bold">Bạn không có quyền truy cập trang này ({permissionCode}).</div>;
    }

    return (
        <div className="bao-cao-sale-container">
            {loading && <div className="loading-overlay">Đang tải dữ liệu...</div>}

            <div className="report-container">
                {/* Simple Header/Filter Section */}
                <div className="sidebar" style={{ width: '250px', minWidth: '250px' }}>
                    <h3>Bộ lọc</h3>
                    <label>
                        Từ ngày:
                        <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} />
                    </label>
                    <label>
                        Đến ngày:
                        <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} />
                    </label>
                </div>

                <div className="main-detailed">
                    <div className="header">
                        <h2>DANH SÁCH BÁO CÁO TAY MARKETING</h2>
                    </div>

                    <div className="table-responsive-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Ngày</th>
                                    <th>Ca</th>
                                    <th>Người báo cáo</th>
                                    <th>Team</th>
                                    <th>Sản phẩm</th>
                                    <th>Thị trường</th>
                                    <th>CPQC</th>
                                    <th>Số Mess</th>
                                    <th>Số Đơn</th>
                                    <th>Doanh số</th>
                                </tr>
                            </thead>
                            <tbody>
                                {manualReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="text-center">{loading ? 'Đang tải...' : 'Không có dữ liệu trong khoảng thời gian này.'}</td>
                                    </tr>
                                ) : (
                                    manualReports.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td className="text-center">{index + 1}</td>
                                            <td>{formatDate(item['Ngày'])}</td>
                                            <td>{item['ca']}</td>
                                            <td>{item['Tên']}</td>
                                            <td>{item['Team']}</td>
                                            <td>{item['Sản_phẩm']}</td>
                                            <td>{item['Thị_trường']}</td>
                                            <td>{formatNumber(item['CPQC'])}</td>
                                            <td>{formatNumber(item['Số_Mess_Cmt'])}</td>
                                            <td>{formatNumber(item['Số đơn'])}</td>
                                            <td>{formatCurrency(item['Doanh số'])}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
