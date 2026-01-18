import { Activity, AlertCircle, AlertTriangle, CheckCircle, Clock, Database, GitCompare, Globe, RefreshCw, Save, Settings, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { performEndOfShiftSnapshot } from '../services/snapshotService';
import { supabase } from '../supabase/config';

// Constants for LocalStorage Keys
export const SETTINGS_KEY = 'system_settings';

const DEFAULT_SETTINGS = {
    thresholds: {
        inventoryLow: 10,
        shippingDelay: 3
    },
    rndProducts: ["Glutathione Collagen NEW", "Dragon Blood Cream", "Gel XK Thái", "Gel XK Phi"],
    keyProducts: ["Glutathione Collagen", "Kem Body", "DG", "Kẹo Táo"],
    keyMarkets: ["US", "Nhật Bản", "Hàn Quốc"],
    dataSource: 'prod' // 'prod' | 'test'
};

// Helper to get settings
export const getSystemSettings = () => {
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const GLOBAL_SETTINGS_ID = 'global_config';

const AdminTools = () => {
    // --- TABS STATE ---
    const [activeTab, setActiveTab] = useState('maintenance'); // 'maintenance' | 'settings' | 'verification'

    // --- MAINTENANCE STATE ---
    const [loading, setLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [dbStatus, setDbStatus] = useState(null);
    const [lastSnapshot, setLastSnapshot] = useState(null);
    const userEmail = localStorage.getItem('userEmail') || 'unknown';

    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [availableMarkets, setAvailableMarkets] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(false);

    // --- VERIFICATION STATE ---
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        // Load settings on mount
        fetchSettingsFromSupabase();
        fetchReferenceData();
    }, []);

    const fetchSettingsFromSupabase = async () => {
        setLoadingSettings(true);
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .select('*')
                .eq('id', GLOBAL_SETTINGS_ID)
                .single();

            if (data && data.settings) {
                setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
            }
        } catch (err) {
            console.error("Error loading settings:", err);
            // Fallback to local
            setSettings(getSystemSettings());
        } finally {
            setLoadingSettings(false);
        }
    };

    const fetchReferenceData = async () => {
        setLoadingData(true);
        try {
            // Fetch unique Products and Markets from orders for suggestions
            const { data, error } = await supabase
                .from('orders')
                .select('product_name_1, product_main, area, city')
                .limit(1000); // Sample data

            if (error) throw error;

            if (data) {
                const products = new Set();
                const markets = new Set();
                data.forEach(r => {
                    if (r.product_main) products.add(r.product_main);
                    if (r.product_name_1) products.add(r.product_name_1);
                    if (r.area) markets.add(r.area);
                });

                // Merge with defaults to ensure basic list exists
                ["Glutathione Collagen", "Bakuchiol Retinol", "Nám DR Hancy", "Kem Body", "Glutathione Collagen NEW", "DG", "Dragon Blood Cream"].forEach(p => products.add(p));
                ["US", "Nhật Bản", "Hàn Quốc", "Canada", "Úc", "Anh"].forEach(m => markets.add(m));

                setAvailableProducts(Array.from(products).sort());
                setAvailableMarkets(Array.from(markets).sort());
            }
        } catch (err) {
            console.error("Error fetching ref data", err);
            // Fallback
            setAvailableProducts(["Glutathione Collagen", "Bakuchiol Retinol", "Nám DR Hancy", "Kem Body", "Glutathione Collagen NEW", "DG", "Dragon Blood Cream"]);
            setAvailableMarkets(["US", "Nhật Bản", "Hàn Quốc", "Canada", "Úc", "Anh"]);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSaveSettings = async () => {
        setLoadingSettings(true);
        try {
            // Save to LocalStorage as backup/cache
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));

            // Save to Supabase
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    id: GLOBAL_SETTINGS_ID,
                    settings: settings,
                    updated_at: new Date().toISOString(),
                    updated_by: userEmail
                });

            if (error) {
                // If the table doesn't exist, we might get an error.
                // We will inform the user.
                throw error;
            }

            toast.success("✅ Đã lưu cấu hình lên Server thành công!");
            window.dispatchEvent(new Event('storage'));
        } catch (err) {
            console.error("Save error:", err);
            if (err.message && err.message.includes('relation "system_settings" does not exist')) {
                toast.error("❌ Bảng system_settings chưa được tạo trên Supabase.");
            } else {
                toast.error(`❌ Lỗi lưu cấu hình: ${err.message}`);
            }
            toast.warn("Đã lưu tạm vào máy cá nhân (Local).");
        } finally {
            setLoadingSettings(false);
        }
    };

    const toggleItem = (category, item) => {
        setSettings(prev => {
            const currentList = prev[category];
            if (currentList.includes(item)) {
                return { ...prev, [category]: currentList.filter(i => i !== item) };
            } else {
                return { ...prev, [category]: [...currentList, item] };
            }
        });
    };

    // --- SNAPSHOT ACTIONS ---
    const handleSnapshot = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn chốt ca? \nViệc này sẽ cập nhật dữ liệu báo cáo từ dữ liệu hiện tại.')) {
            return;
        }

        setLoading(true);
        try {
            await performEndOfShiftSnapshot(userEmail);
            toast.success('Đã chốt ca thành công! Dữ liệu báo cáo đã được cập nhật.');
            setLastSnapshot(new Date());
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi chốt ca: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const checkSystem = async () => {
        setCheckLoading(true);
        setDbStatus(null);
        try {
            const results = {};

            // 1. Check Supabase (Connection & Tables)
            const tables = ['change_logs', 'detail_reports_view_copy', 'f3_data_snapshot', 'system_settings'];
            const startSupabase = performance.now();

            for (const table of tables) {
                const { error, count } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    // Ignore 404 for system_settings if it's new
                    if (table === 'system_settings' && error.code === '42P01') {
                        results[table] = { status: 'WARNING', message: 'Table not created yet', code: 'MISSING' };
                    } else {
                        results[table] = { status: 'ERROR', message: error.message, code: error.code };
                    }
                } else {
                    results[table] = { status: 'OK', count: count };
                }
            }
            const endSupabase = performance.now();
            results['Supabase Latency'] = { status: 'INFO', message: `${(endSupabase - startSupabase).toFixed(0)} ms`, type: 'latency' };

            // 2. Check Firebase (API Connection)
            const hrUrl = import.meta.env.VITE_HR_URL;
            if (hrUrl) {
                const startFirebase = performance.now();
                try {
                    const res = await fetch(hrUrl);
                    if (res.ok) {
                        const endFirebase = performance.now();
                        results['Firebase API (HR)'] = { status: 'OK', message: 'Connected' };
                        results['Firebase Latency'] = { status: 'INFO', message: `${(endFirebase - startFirebase).toFixed(0)} ms`, type: 'latency' };
                    } else {
                        results['Firebase API (HR)'] = { status: 'ERROR', message: `Status: ${res.status}` };
                    }
                } catch (e) {
                    results['Firebase API (HR)'] = { status: 'ERROR', message: e.message };
                }
            }

            // 3. Network Check (Ping Google)
            const startNet = performance.now();
            try {
                // Using a no-cors request just to check network reachability
                await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-cache' });
                const endNet = performance.now();
                results['Server Network'] = { status: 'OK', message: 'Online' };
                results['Internet Latency'] = { status: 'INFO', message: `${(endNet - startNet).toFixed(0)} ms`, type: 'latency' };
            } catch (e) {
                results['Server Network'] = { status: 'ERROR', message: 'Offline / Blocked' };
            }

            setDbStatus(results);
            toast.success("Đã hoàn tất quét toàn bộ hệ thống API & Mạng");
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi kiểm tra: " + err.message);
        } finally {
            setCheckLoading(false);
        }
    };

    // --- VERIFICATION ACTIONS ---
    const compareTables = async () => {
        setVerifying(true);
        setVerifyResult(null);
        try {
            // Compare ORDERS (F3) vs DETAIL REPORTS (Snapshot)

            // 1. Get Counts
            const { count: countOrders, error: errOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
            const { count: countReports, error: errReports } = await supabase.from('detail_reports').select('*', { count: 'exact', head: true });

            if (errOrders) throw errOrders;
            if (errReports) throw errReports;

            setVerifyResult({
                orders: countOrders,
                reports: countReports,
                diff: countOrders - countReports
            });
            toast.success("Đối soát hoàn tất!");
        } catch (e) {
            console.error(e);
            toast.error("Lỗi đối soát: " + e.message);
        } finally {
            setVerifying(false);
        }
    };

    // Ensure products in settings are always visible in the list, even if not in history
    const displayedProducts = Array.from(new Set([
        ...availableProducts,
        ...settings.rndProducts,
        ...settings.keyProducts
    ])).sort();

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <Settings className="w-8 h-8 text-gray-600" />
                Công cụ quản trị & Cấu hình
            </h1>

            {/* TAB NAVIGATION */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('maintenance')}
                    className={`pb-3 px-4 font-medium transition-all ${activeTab === 'maintenance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Database size={18} />
                        Bảo trì & Chốt ca
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 px-4 font-medium transition-all ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Settings size={18} />
                        Cài đặt hệ thống
                    </div>
                </button>
            </div>

            {/* TAB CONTENT: MAINTENANCE */}
            {activeTab === 'maintenance' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                    {/* Snapshot Card */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                <Save size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Chốt Ca & Đồng bộ Báo cáo</h2>
                                <p className="text-sm text-gray-500">Cập nhật dữ liệu từ bảng thao tác sang bảng báo cáo</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <div className="flex gap-2 text-amber-800">
                                <AlertTriangle size={20} />
                                <span className="text-sm font-medium">Lưu ý quan trọng</span>
                            </div>
                            <ul className="list-disc list-inside mt-2 text-sm text-amber-700 space-y-1">
                                <li>Hành động này sẽ sao chép toàn bộ dữ liệu hiện tại sang bảng báo cáo.</li>
                                <li>Dữ liệu báo cáo cũ sẽ bị ghi đè.</li>
                                <li>Nên thực hiện vào cuối mỗi ca làm việc.</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleSnapshot}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all
                            ${loading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin text-xl">⟳</span>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    <span>Thực hiện Chốt Ca Ngay</span>
                                </>
                            )}
                        </button>

                        {lastSnapshot && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                                <Clock size={16} />
                                <span>Đã chốt lần cuối lúc: {lastSnapshot.toLocaleTimeString()}</span>
                            </div>
                        )}
                    </div>

                    {/* System Health Check */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Activity size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Kiểm tra Hệ thống</h2>
                                <p className="text-sm text-gray-500">Kiểm tra kết nối Database & Bảng</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-2">Sử dụng công cụ này để kiểm tra xem các bảng dữ liệu đã được khởi tạo đúng trên Supabase chưa.</p>
                        </div>

                        <button
                            onClick={checkSystem}
                            disabled={checkLoading}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all mb-4
                            ${checkLoading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                }`}
                        >
                            {checkLoading ? (
                                <>
                                    <span className="animate-spin text-xl">⟳</span>
                                    <span>Đang kiểm tra...</span>
                                </>
                            ) : (
                                <>
                                    <Database size={20} />
                                    <span>Kiểm tra Kết nối Ngay</span>
                                </>
                            )}
                        </button>

                        {dbStatus && (
                            <div className="space-y-2 border-t pt-4">
                                {Object.entries(dbStatus).map(([key, result]) => {
                                    let statusColor = 'text-gray-500';
                                    let Icon = CheckCircle;

                                    if (result.status === 'OK') {
                                        statusColor = 'text-green-600';
                                        Icon = CheckCircle;
                                    } else if (result.status === 'WARNING') {
                                        statusColor = 'text-orange-500';
                                        Icon = AlertTriangle;
                                    } else if (result.status === 'ERROR') {
                                        statusColor = 'text-red-600';
                                        Icon = AlertCircle;
                                    } else if (result.status === 'INFO') {
                                        statusColor = 'text-blue-600';
                                        Icon = Clock;
                                    }

                                    return (
                                        <div key={key} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50 border border-gray-100">
                                            <span className="font-medium text-gray-700 flex items-center gap-2">
                                                {result.type === 'latency' && <Globe size={14} className="text-gray-400" />}
                                                {key}
                                            </span>
                                            <span className={`${statusColor} flex items-center gap-1 font-medium`}>
                                                <Icon size={14} />
                                                {result.message}
                                                {result.count !== undefined && `(${result.count} dòng)`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: VERIFICATION */}
            {activeTab === 'verification' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 animate-fadeIn p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
                            <GitCompare size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Đối soát Dữ liệu (Beta)</h2>
                            <p className="text-sm text-gray-500">So sánh chênh lệch giữa các bảng dữ liệu gốc và báo cáo.</p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-2">So sánh Orders (F3) vs Detail Reports (Snapshot)</h3>
                        <p className="text-sm text-gray-600 mb-4">Kiểm tra xem số lượng đơn hàng có khớp giữa dữ liệu nhập (Orders) và dữ liệu báo cáo (Reports) hay không.</p>

                        <button
                            onClick={compareTables}
                            disabled={verifying}
                            className="bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-teal-700 transition"
                        >
                            {verifying ? <RefreshCw className="animate-spin w-4 h-4" /> : <GitCompare className="w-4 h-4" />}
                            Thực hiện Đối soát
                        </button>

                        {verifyResult && (
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-sm text-gray-500">Tổng Orders</div>
                                    <div className="text-2xl font-bold text-blue-600">{verifyResult.orders}</div>
                                </div>
                                <div className="p-4 bg-white border rounded shadow-sm">
                                    <div className="text-sm text-gray-500">Tổng Reports</div>
                                    <div className="text-2xl font-bold text-indigo-600">{verifyResult.reports}</div>
                                </div>
                                <div className={`p-4 bg-white border rounded shadow-sm ${verifyResult.diff === 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                                    <div className="text-sm text-gray-500">Chênh lệch</div>
                                    <div className={`text-2xl font-bold ${verifyResult.diff === 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {verifyResult.diff > 0 ? `+${verifyResult.diff}` : verifyResult.diff}
                                    </div>
                                    <div className="text-xs mt-1">
                                        {verifyResult.diff === 0 ? '✅ Dữ liệu khớp hoàn toàn' : '⚠️ Có sự chênh lệch dữ liệu'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 animate-fadeIn overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Cấu hình tham số hệ thống</h2>
                            <p className="text-sm text-gray-500 mt-1">Quản lý các thông số vận hành toàn hệ thống</p>
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            className="bg-[#2d7c2d] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#256625] transition-colors shadow-sm"
                        >
                            <Save size={18} /> Lưu Cấu hình
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 0. DATA SOURCE MODE */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                <Database className="w-5 h-5" />
                                0. Chế độ Dữ liệu (Environment)
                            </h3>
                            <div className="flex items-center gap-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-blue-600 w-5 h-5"
                                        name="dataSource"
                                        value="prod"
                                        checked={settings.dataSource !== 'test'}
                                        onChange={() => setSettings({ ...settings, dataSource: 'prod' })}
                                    />
                                    <span className="ml-2 font-medium">Production (Dữ liệu Thật)</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        className="form-radio text-orange-500 w-5 h-5 "
                                        name="dataSource"
                                        value="test"
                                        checked={settings.dataSource === 'test'}
                                        onChange={() => setSettings({ ...settings, dataSource: 'test' })}
                                    />
                                    <span className="ml-2 font-medium text-orange-600">Testing (Dữ liệu Thử nghiệm)</span>
                                </label>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                <strong>Lưu ý:</strong> Chế độ Testing sẽ sử dụng nguồn dữ liệu riêng để không ảnh hưởng đến báo cáo thật.
                            </p>
                        </div>
                        {/* 1. Thresholds */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-500" />
                                1. Ngưỡng cảnh báo chỉ số
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cảnh báo tồn kho thấp (đơn vị)</label>
                                    <input
                                        type="number"
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-[#2d7c2d]"
                                        value={settings.thresholds.inventoryLow}
                                        onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, inventoryLow: parseInt(e.target.value) || 0 } })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Hiện cảnh báo khi tồn kho dưới mức này.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cảnh báo giao hàng chậm (ngày)</label>
                                    <input
                                        type="number"
                                        className="w-full border-gray-300 rounded-md shadow-sm p-2 border focus:ring-[#2d7c2d]"
                                        value={settings.thresholds.shippingDelay}
                                        onChange={(e) => setSettings({ ...settings, thresholds: { ...settings.thresholds, shippingDelay: parseInt(e.target.value) || 0 } })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Hiện cảnh báo khi đơn hàng chưa giao quá số ngày này.</p>
                                </div>
                            </div>
                        </div>


                        {/* 2 & 3. UNIFIED PRODUCT MANAGEMENT */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-purple-600" />
                                2. Quản lý Danh sách Sản phẩm
                            </h3>
                            <p className="text-sm text-gray-500">
                                Quản lý danh sách sản phẩm, định nghĩa sản phẩm R&D (SP test) và sản phẩm trọng điểm.
                            </p>

                            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                <div className="max-h-[500px] overflow-y-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0 z-10">
                                            <tr>
                                                <th className="px-4 py-3 border-b w-16 text-center">STT</th>
                                                <th className="px-4 py-3 border-b">Tên sản phẩm</th>
                                                <th className="px-4 py-3 border-b w-48">Loại sản phẩm</th>
                                                <th className="px-4 py-3 border-b w-24 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {displayedProducts.map((product, index) => {
                                                const isRnd = settings.rndProducts.includes(product);
                                                const isKey = settings.keyProducts.includes(product);
                                                let currentType = 'normal';
                                                if (isRnd) currentType = 'test';
                                                else if (isKey) currentType = 'key';

                                                return (
                                                    <tr key={product} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 text-center text-gray-500">{index + 1}</td>
                                                        <td className="px-4 py-2 font-medium">{product}</td>
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={currentType}
                                                                onChange={(e) => {
                                                                    const newType = e.target.value;
                                                                    setSettings(prev => {
                                                                        let newRnd = prev.rndProducts.filter(p => p !== product);
                                                                        let newKey = prev.keyProducts.filter(p => p !== product);

                                                                        if (newType === 'test') newRnd.push(product);
                                                                        if (newType === 'key') newKey.push(product);

                                                                        return { ...prev, rndProducts: newRnd, keyProducts: newKey };
                                                                    });
                                                                }}
                                                                className={`w-full text-xs py-1 px-2 rounded border focus:outline-none focus:ring-2 
                                                                    ${currentType === 'test' ? 'bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500' :
                                                                        currentType === 'key' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500' :
                                                                            'bg-white text-gray-700 border-gray-300 focus:ring-gray-500'}`}
                                                            >
                                                                <option value="normal">SP thường</option>
                                                                <option value="test">SP Test (R&D)</option>
                                                                <option value="key">SP Trọng điểm</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                onClick={() => {
                                                                    if (window.confirm(`Bạn có chắc muốn xóa sản phẩm "${product}" khỏi danh sách?`)) {
                                                                        setAvailableProducts(prev => prev.filter(p => p !== product));
                                                                        setSettings(prev => ({
                                                                            ...prev,
                                                                            rndProducts: prev.rndProducts.filter(p => p !== product),
                                                                            keyProducts: prev.keyProducts.filter(p => p !== product)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add Product Footer */}
                                <div className="bg-gray-50 p-3 border-t flex gap-2">
                                    <input
                                        type="text"
                                        list="product-suggestions"
                                        placeholder="Nhập tên sản phẩm mới..."
                                        className="flex-1 text-sm border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.target.value.trim();
                                                if (val && !availableProducts.includes(val)) {
                                                    setAvailableProducts(prev => [...prev, val].sort());
                                                    e.target.value = '';
                                                } else if (availableProducts.includes(val)) {
                                                    toast.warning('Sản phẩm này đã có trong danh sách!');
                                                }
                                            }
                                        }}
                                        id="new-product-input"
                                    />
                                    <datalist id="product-suggestions">
                                        {availableProducts.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-product-input');
                                            const val = input.value.trim();
                                            if (val && !availableProducts.includes(val)) {
                                                setAvailableProducts(prev => [...prev, val].sort());
                                                input.value = '';
                                                toast.success('Đã thêm sản phẩm mới');
                                            } else if (availableProducts.includes(val)) {
                                                toast.warning('Sản phẩm này đã có trong danh sách!');
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                                    >
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4. Market Management */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-teal-600" />
                                3. Quản lý Thị trường Trọng điểm
                            </h3>
                            <p className="text-sm text-gray-500">Các thị trường (Khu vực) chính cần theo dõi trong báo cáo.</p>

                            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-semibold sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 border-b w-16 text-center">STT</th>
                                            <th className="px-4 py-3 border-b">Tên Thị trường</th>
                                            <th className="px-4 py-3 border-b w-24 text-center">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {settings.keyMarkets.map((market, index) => (
                                            <tr key={market} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 text-center text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-2 font-medium">{market}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Xóa thị trường "${market}"?`)) {
                                                                setSettings(prev => ({
                                                                    ...prev,
                                                                    keyMarkets: prev.keyMarkets.filter(m => m !== market)
                                                                }));
                                                            }
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Add Market Footer */}
                                <div className="bg-gray-50 p-3 border-t flex gap-2">
                                    <input
                                        type="text"
                                        list="market-suggestions"
                                        placeholder="Nhập tên thị trường mới..."
                                        className="flex-1 text-sm border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.target.value.trim();
                                                if (val && !settings.keyMarkets.includes(val)) {
                                                    setSettings(prev => ({ ...prev, keyMarkets: [...prev.keyMarkets, val].sort() }));
                                                    // Also add to availableMarkets if not there
                                                    if (!availableMarkets.includes(val)) setAvailableMarkets(prev => [...prev, val].sort());
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                        id="new-market-input"
                                    />
                                    <datalist id="market-suggestions">
                                        {availableMarkets.map(m => <option key={m} value={m} />)}
                                    </datalist>
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('new-market-input');
                                            const val = input.value.trim();
                                            if (val && !settings.keyMarkets.includes(val)) {
                                                setSettings(prev => ({ ...prev, keyMarkets: [...prev.keyMarkets, val].sort() }));
                                                if (!availableMarkets.includes(val)) setAvailableMarkets(prev => [...prev, val].sort());
                                                input.value = '';
                                                toast.success('Đã thêm thị trường mới');
                                            } else if (settings.keyMarkets.includes(val)) {
                                                toast.warning('Thị trường này đã có!');
                                            }
                                        }}
                                        className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-700"
                                    >
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTools;
