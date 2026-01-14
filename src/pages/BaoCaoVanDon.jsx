import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/config';
import { isDateInRange } from '../utils/dateParsing';

// Helpers
const formatCurrency = (value) => Number(value || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');
const formatPercent = (value, total) => {
    if (!total || total === 0) return '0.00%';
    return `${((Number(value || 0) / total) * 100).toFixed(2)}%`;
};

export default function BaoCaoVanDon() {
    const [loading, setLoading] = useState(true);
    const [rawData, setRawData] = useState([]);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterMarket, setFilterMarket] = useState([]);
    const [filterProduct, setFilterProduct] = useState([]);

    // Unique options for filters
    const uniqueMarkets = useMemo(() => {
        const set = new Set(rawData.map(r => r["Khu vực"] || r["khu vực"]).filter(Boolean));
        return Array.from(set).sort();
    }, [rawData]);

    const uniqueProducts = useMemo(() => {
        const set = new Set(rawData.map(r => r["Mặt hàng"] || r["product"]).filter(Boolean));
        return Array.from(set).sort();
    }, [rawData]);

    // Initialize Dates
    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    // Fetch Data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch relevant columns for Shipping Report
                const { data, error } = await supabase
                    .from('orders')
                    .select('*'); // Select all to be safe, optimize later if needed

                if (error) throw error;

                // Normalize keys if needed (Supabase returns lowercase generally, but check your schema)
                // Assuming data matches what DanhSachDon sees
                setRawData(data || []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu báo cáo vận đơn:", err);
                alert("Lỗi tải dữ liệu: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter Logic
    const filteredData = useMemo(() => {
        return rawData.filter(item => {
            // Date Filter
            const dateStr = item.order_date || item["Ngày lên đơn"] || item.created_at?.split('T')[0];
            if (!isDateInRange(dateStr, startDate, endDate)) return false;

            // Market Filter
            const market = item["Khu vực"] || item.country || item.area;
            if (filterMarket.length > 0 && !filterMarket.includes(market)) return false;

            // Product Filter
            const product = item["Mặt hàng"] || item.product || item.product_main;
            if (filterProduct.length > 0 && !filterProduct.includes(product)) return false;

            return true;
        });
    }, [rawData, startDate, endDate, filterMarket, filterProduct]);

    // Grouping & Aggregation Logic
    // We want to group by "Đơn vị vận chuyển" (Carrier) mostly, maybe "Team" or "Market"
    const reportData = useMemo(() => {
        const groups = {};

        // Define statuses
        // Common statuses: 'Đã giao', 'Đang giao', 'Hoàn', 'Đang hoàn', 'Hủy', 'Thất lạc'

        filteredData.forEach(item => {
            const carrier = item.shipping_unit || item["Đơn vị vận chuyển"] || "Chưa phân loại";
            const status = item.delivery_status || item["Trạng thái giao hàng"] || "Chưa cập nhật";
            const shipFee = Number(item.shipping_fee || item["Phí ship"] || 0);
            const cod = Number(item.total_amount_vnd || item["Tổng tiền VNĐ"] || 0); // Assuming COD is Total Amount, check business logic if 'reconciled_amount' is better

            if (!groups[carrier]) {
                groups[carrier] = {
                    carrier: carrier,
                    totalOrders: 0,
                    delivered: 0,
                    delivering: 0,
                    returning: 0,
                    returned: 0,
                    canceled: 0,
                    other: 0,
                    totalShipFee: 0,
                    totalCOD: 0
                };
            }

            const g = groups[carrier];
            g.totalOrders++;
            g.totalShipFee += shipFee;
            g.totalCOD += cod;

            // Classify status
            const sLower = String(status).toLowerCase();
            if (sLower.includes('đã giao') || sLower.includes('thành công') || sLower.includes('delivered')) {
                g.delivered++;
            } else if (sLower.includes('đang giao') || sLower.includes('shipping') || sLower.includes('transit')) {
                g.delivering++;
            } else if (sLower.includes('đang hoàn') || sLower.includes('returning')) {
                g.returning++;
            } else if (sLower.includes('đã hoàn') || sLower.includes('returned')) {
                g.returned++;
            } else if (sLower.includes('hủy') || sLower.includes('cancel')) {
                g.canceled++;
            } else {
                g.other++;
            }
        });

        const list = Object.values(groups).sort((a, b) => b.totalOrders - a.totalOrders);

        // Calculate Totals
        const total = list.reduce((acc, curr) => ({
            totalOrders: acc.totalOrders + curr.totalOrders,
            delivered: acc.delivered + curr.delivered,
            delivering: acc.delivering + curr.delivering,
            returning: acc.returning + curr.returning,
            returned: acc.returned + curr.returned,
            canceled: acc.canceled + curr.canceled,
            other: acc.other + curr.other,
            totalShipFee: acc.totalShipFee + curr.totalShipFee,
            totalCOD: acc.totalCOD + curr.totalCOD,
        }), {
            totalOrders: 0, delivered: 0, delivering: 0, returning: 0, returned: 0, canceled: 0, other: 0, totalShipFee: 0, totalCOD: 0
        });

        return { list, total };
    }, [filteredData]);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">BÁO CÁO VẬN ĐƠN</h1>
                            <p className="text-xs text-gray-500">Thống kê tình hình giao hàng và cước phí</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-6">

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Date Range */}
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Từ ngày</label>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Đến ngày</label>
                            <input
                                type="date"
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Market Filter */}
                        <div className="min-w-[150px]">
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Khu vực</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                                value={filterMarket[0] || ''}
                                onChange={(e) => setFilterMarket(e.target.value ? [e.target.value] : [])}
                            >
                                <option value="">Tất cả</option>
                                {uniqueMarkets.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product Filter */}
                        <div className="min-w-[150px]">
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Sản phẩm</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F37021]"
                                value={filterProduct[0] || ''}
                                onChange={(e) => setFilterProduct(e.target.value ? [e.target.value] : [])}
                            >
                                <option value="">Tất cả</option>
                                {uniqueProducts.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <div className="text-sm text-gray-500">
                                Tổng số dòng dữ liệu: <span className="font-bold text-gray-800">{filteredData.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700">Thống kê theo Đơn vị vận chuyển</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 border-r border-gray-200">Đơn vị vận chuyển</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200">Tổng Đơn</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200 bg-green-50 text-green-700">Đã giao</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200 bg-blue-50 text-blue-700">Đang giao</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200 bg-orange-50 text-orange-700">Đang hoàn</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200 bg-red-50 text-red-700">Đã hoàn</th>
                                    <th className="px-4 py-3 text-center border-r border-gray-200">Hủy/Khác</th>
                                    <th className="px-4 py-3 text-right border-r border-gray-200">Tỷ lệ Hoàn</th>
                                    <th className="px-4 py-3 text-right border-r border-gray-200">Tổng Phí Ship</th>
                                    <th className="px-4 py-3 text-right">Tổng Tiền Thu (COD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="px-4 py-8 text-center text-gray-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin h-4 w-4 border-2 border-[#F37021] border-t-transparent rounded-full"></div>
                                                Đang tải báo cáo...
                                            </div>
                                        </td>
                                    </tr>
                                ) : reportData.list.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="px-4 py-6 text-center text-gray-500">Không có dữ liệu phù hợp</td>
                                    </tr>
                                ) : (
                                    <>
                                        {/* Total Row */}
                                        <tr className="bg-orange-50 font-bold text-gray-800">
                                            <td className="px-4 py-3 border-r border-orange-100">TỔNG CỘNG</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100">{formatNumber(reportData.total.totalOrders)}</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100 text-green-700">{formatNumber(reportData.total.delivered)}</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100 text-blue-700">{formatNumber(reportData.total.delivering)}</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100 text-orange-700">{formatNumber(reportData.total.returning)}</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100 text-red-700">{formatNumber(reportData.total.returned)}</td>
                                            <td className="px-4 py-3 text-center border-r border-orange-100">{formatNumber(reportData.total.canceled + reportData.total.other)}</td>
                                            <td className="px-4 py-3 text-right border-r border-orange-100 text-red-600">
                                                {formatPercent(reportData.total.returned, reportData.total.totalOrders)}
                                            </td>
                                            <td className="px-4 py-3 text-right border-r border-orange-100">{formatCurrency(reportData.total.totalShipFee)}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(reportData.total.totalCOD)}</td>
                                        </tr>

                                        {/* Data Rows */}
                                        {reportData.list.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 border-r border-gray-200 font-medium text-gray-700">{row.carrier}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200">{formatNumber(row.totalOrders)}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-green-600 font-medium">{formatNumber(row.delivered)}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-blue-600">{formatNumber(row.delivering)}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-orange-600">{formatNumber(row.returning)}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-red-600 font-medium">{formatNumber(row.returned)}</td>
                                                <td className="px-4 py-3 text-center border-r border-gray-200 text-gray-500">{formatNumber(row.canceled + row.other)}</td>
                                                <td className="px-4 py-3 text-right border-r border-gray-200 text-red-500 text-xs">
                                                    {formatPercent(row.returned, row.totalOrders)}
                                                </td>
                                                <td className="px-4 py-3 text-right border-r border-gray-200 font-mono text-gray-600">{formatCurrency(row.totalShipFee)}</td>
                                                <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(row.totalCOD)}</td>
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-xs text-gray-400 italic text-center">
                    * Dữ liệu được tính toán dựa trên danh sách đơn hàng hiện tại trong cơ sở dữ liệu.
                </div>
            </div>
        </div>
    );
}
