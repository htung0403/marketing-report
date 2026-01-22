import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { supabase } from '../services/supabaseClient';

function ReportFormCSKH() {
    // State cho thông tin cố định
    const [fixedInfo, setFixedInfo] = useState({
        name: '',
        email: '',
        date: new Date().toISOString().split('T')[0],
        shift: ''
    });

    // State cho các báo cáo (chỉ chứa thông tin thay đổi)
    const [reports, setReports] = useState([{
        product: '',
        market: '',
        mess_cmt: '',
        response: '',
        orders: '',
        revenue: ''
    }]);

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [expandedRows, setExpandedRows] = useState(new Set([0]));

    // State for dropdown options
    const [productOptions, setProductOptions] = useState([]);
    const [marketOptions, setMarketOptions] = useState([]);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch dropdown data from Supabase (Dynamic from existing data)
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                setDropdownLoading(true);

                // We can fetch from sales_reports or cskh_reports or orders to get products/markets
                const { data, error } = await supabase
                    .from('sales_reports')
                    .select('product, market')
                    .limit(500)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Extract unique sets
                const productsSet = new Set();
                const marketsSet = new Set();

                if (data) {
                    data.forEach(item => {
                        if (item.product && item.product.trim()) productsSet.add(item.product.trim());
                        if (item.market && item.market.trim()) marketsSet.add(item.market.trim());
                    });
                }

                // Fallback defaults if empty
                if (productsSet.size === 0) {
                    ['Lumi Eyes', 'Lumi Nano', 'Lumi Skin'].forEach(p => productsSet.add(p));
                }
                if (marketsSet.size === 0) {
                    ['Việt Nam', 'Thái Lan', 'Philippines', 'Malaysia'].forEach(m => marketsSet.add(m));
                }

                setProductOptions(Array.from(productsSet).sort((a, b) => a.localeCompare(b, 'vi')));
                setMarketOptions(Array.from(marketsSet).sort((a, b) => a.localeCompare(b, 'vi')));
            } catch (err) {
                console.error('Error fetching dropdown data:', err);
                setProductOptions(['Lumi Eyes', 'Lumi Nano']);
                setMarketOptions(['Việt Nam', 'Thái Lan']);
            } finally {
                setDropdownLoading(false);
            }
        };

        fetchDropdownData();
    }, []);

    // Load current user info
    useEffect(() => {
        const name = localStorage.getItem('username') || '';
        const email = localStorage.getItem('userEmail') || '';

        setFixedInfo(prev => ({
            ...prev,
            name,
            email
        }));
    }, []);

    const formatNumberInput = (value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        return cleanValue ? new Intl.NumberFormat('de-DE').format(cleanValue) : '';
    };

    const cleanNumberInput = (value) => {
        return value.replace(/[^0-9]/g, '');
    };

    const handleFixedInfoChange = (e) => {
        const { name, value } = e.target;
        setFixedInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleReportChange = (e, reportIndex) => {
        const { name, value } = e.target;
        const numberFields = ['mess_cmt', 'response', 'orders', 'revenue'];

        const newReports = [...reports];
        if (numberFields.includes(name)) {
            const formattedValue = formatNumberInput(value);
            newReports[reportIndex] = { ...newReports[reportIndex], [name]: formattedValue };
        } else {
            newReports[reportIndex] = { ...newReports[reportIndex], [name]: value };
        }
        setReports(newReports);

        const errorKey = `${reportIndex}-${name}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const { [errorKey]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!fixedInfo.name.trim()) newErrors['fixed-name'] = 'Required';
        if (!fixedInfo.date) newErrors['fixed-date'] = 'Required';
        if (!fixedInfo.shift) newErrors['fixed-shift'] = 'Required';

        reports.forEach((report, index) => {
            if (!report.product.trim()) newErrors[`${index}-product`] = 'Required';
            if (!report.market.trim()) newErrors[`${index}-market`] = 'Required';
            if (!report.mess_cmt) newErrors[`${index}-mess_cmt`] = 'Required';
            if (!report.response) newErrors[`${index}-response`] = 'Required';
            if (!report.orders) newErrors[`${index}-orders`] = 'Required';
            if (!report.revenue) newErrors[`${index}-revenue`] = 'Required';
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc', { position: 'top-right', autoClose: 3000 });
            return;
        }

        setLoading(true);
        try {
            const payload = reports.map(report => ({
                name: fixedInfo.name,
                email: fixedInfo.email,
                report_date: fixedInfo.date,
                shift: fixedInfo.shift,
                product: report.product,
                market: report.market,
                mess_count: Number(cleanNumberInput(String(report.mess_cmt || ''))) || 0,
                response_count: Number(cleanNumberInput(String(report.response || ''))) || 0,
                order_count: Number(cleanNumberInput(String(report.orders || ''))) || 0,
                revenue_mess: Number(cleanNumberInput(String(report.revenue || ''))) || 0,
                team: localStorage.getItem('userTeam') || 'CSKH',
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('cskh_reports')
                .insert(payload);

            if (error) throw error;

            toast.success(`Đã lưu thành công ${reports.length} báo cáo CSKH!`, { position: 'top-right', autoClose: 3000 });

            setReports([{
                product: '',
                market: '',
                mess_cmt: '',
                response: '',
                orders: '',
                revenue: ''
            }]);
            setErrors({});
            setExpandedRows(new Set([0]));
        } catch (err) {
            console.error('Error saving reports:', err);
            toast.error('Lỗi khi lưu báo cáo: ' + (err.message || ''), { position: 'top-right', autoClose: 5000 });
        } finally {
            setLoading(false);
        }
    };

    const addReport = () => {
        const lastReport = reports[reports.length - 1] || {};
        const newReport = {
            product: lastReport.product || '',
            market: lastReport.market || '',
            mess_cmt: '',
            response: '',
            orders: '',
            revenue: ''
        };
        setReports(prev => [...prev, newReport]);
        setExpandedRows(prev => new Set([...prev, reports.length]));
    };

    const deleteReport = (reportIndex) => {
        const newReports = reports.filter((_, index) => index !== reportIndex);
        setReports(newReports);
        setExpandedRows(prev => {
            const next = new Set(prev);
            next.delete(reportIndex);
            return next;
        });
    };

    const toggleReport = (reportIndex) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(reportIndex)) next.delete(reportIndex);
            else next.add(reportIndex);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
            <div className="w-full mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Quay lại
                        </button>

                        <div className="flex items-center gap-6 mx-auto">
                            <img
                                src="https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Ff930e667.%E1%BA%A2nh.025539.jpg"
                                alt="Logo"
                                className="h-16 w-16 rounded-full shadow-lg"
                            />
                            <div>
                                <h1 className="text-3xl font-bold bg-blue-600 bg-clip-text text-transparent">
                                    Báo Cáo CSKH & CRM
                                </h1>
                                <p className="text-gray-500 mt-1">Hệ thống báo cáo thủ công CSKH</p>
                            </div>
                        </div>

                        <button
                            onClick={addReport}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Thêm báo cáo
                        </button>
                    </div>
                </div>

                {/* Fixed Info */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Thông tin nhân sự
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                            <input type="text" value={fixedInfo.name} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" value={fixedInfo.email} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày <span className="text-red-500">*</span></label>
                            <input type="date" name="date" value={fixedInfo.date} onChange={handleFixedInfoChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${errors['fixed-date'] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ca <span className="text-red-500">*</span></label>
                            <select name="shift" value={fixedInfo.shift} onChange={handleFixedInfoChange} className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${errors['fixed-shift'] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}>
                                <option value="">Chọn ca</option>
                                <option value="Sáng">Sáng</option>
                                <option value="Chiều">Chiều</option>
                                <option value="Tối">Tối</option>
                                <option value="Hết ca">Hết ca</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Reports */}
                <div className="space-y-6">
                    {reports.map((report, idx) => {
                        const isExpanded = expandedRows.has(idx);
                        const hasErrors = Object.keys(errors).some(k => k.startsWith(`${idx}-`));

                        return (
                            <div key={idx} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                                <div
                                    className={`p-6 cursor-pointer select-none transition-colors ${hasErrors ? 'bg-red-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}
                                    onClick={() => toggleReport(idx)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${hasErrors ? 'bg-red-500' : 'bg-blue-600'}`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{report.product || 'Chưa chọn sản phẩm'}</h3>
                                                <p className="text-sm text-gray-500">{report.market || 'Chưa chọn thị trường'} • {fixedInfo.shift || 'Chưa chọn ca'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {reports.length > 1 && (
                                                <button onClick={(e) => { e.stopPropagation(); deleteReport(idx); }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                            <svg className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm <span className="text-red-500">*</span></label>
                                                <select name="product" value={report.product} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-product`] ? 'border-red-500' : 'border-gray-200'}`}>
                                                    <option value="">Chọn sản phẩm</option>
                                                    {productOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Thị trường <span className="text-red-500">*</span></label>
                                                <select name="market" value={report.market} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-market`] ? 'border-red-500' : 'border-gray-200'}`}>
                                                    <option value="">Chọn thị trường</option>
                                                    {marketOptions.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Tiếp nhận (Mess/Cmt) <span className="text-red-500">*</span></label>
                                                <input type="text" inputMode="numeric" name="mess_cmt" value={report.mess_cmt} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-mess_cmt`] ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Phản hồi <span className="text-red-500">*</span></label>
                                                <input type="text" inputMode="numeric" name="response" value={report.response} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-response`] ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Số đơn chốt <span className="text-red-500">*</span></label>
                                                <input type="text" inputMode="numeric" name="orders" value={report.orders} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-orders`] ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Doanh số chốt <span className="text-red-500">*</span></label>
                                                <input type="text" inputMode="numeric" name="revenue" value={report.revenue} onChange={(e) => handleReportChange(e, idx)} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${errors[`${idx}-revenue`] ? 'border-red-500' : 'border-gray-200'}`} placeholder="0" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:shadow-2xl hover:scale-105'}`}
                        >
                            {loading ? 'Đang gửi...' : `Gửi ${reports.length} báo cáo CSKH`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ReportFormCSKH;
