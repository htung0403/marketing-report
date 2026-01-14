import { AlertCircle, Check, ChevronDown, ChevronLeft, RefreshCcw, Save, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/config';

const HR_URL = import.meta.env.VITE_HR_URL || "https://lumi-6dff7-default-rtdb.asia-southeast1.firebasedatabase.app/datasheet/Nh%C3%A2n_s%E1%BB%B1.json";
const PAGE_URL = import.meta.env.VITE_PAGE_URL || "https://lumi-6dff7-default-rtdb.asia-southeast1.firebasedatabase.app/datasheet/Pages.json";
const ADMIN_MAIL = import.meta.env.VITE_ADMIN_MAIL || "admin@marketing.com";

// Simple Button component
const Button = ({ children, onClick, variant = "default", className = "", disabled = false, type = "button" }) => {
    const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        default: "bg-[#2d7c2d] text-white hover:bg-[#256625]",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// Simple Input component
const Input = ({ id, placeholder, type = "text", className = "", value, onChange, ...props }) => (
    <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d] ${className}`}
        {...props}
    />
);

// Simple Label component
const Label = ({ htmlFor, children, className = "" }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
        {children}
    </label>
);

// Simple Textarea component
const Textarea = ({ id, placeholder, className = "", value, onChange, ...props }) => (
    <textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d] resize-none ${className}`}
        {...props}
    />
);

// Simple Tabs components
const Tabs = ({ children, defaultValue }) => {
    return (
        <div>
            {children}
        </div>
    );
};

const Card = ({ children, className = "" }) => <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;
const CardHeader = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = "" }) => <h3 className={`${className}`}>{children}</h3>;
const CardContent = ({ children, className = "" }) => <div className={`p-6 ${className}`}>{children}</div>;

// Simple DatePicker component
const DatePicker = ({ value, onChange, className = "" }) => (
    <input
        type="date"
        value={value ? value.toISOString().split('T')[0] : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d] ${className}`}
    />
);

// Custom Popover for searchable dropdowns
const Popover = ({ children, open, onOpenChange }) => {
    return <div className="relative">{children}</div>;
};
const PopoverTrigger = ({ children, asChild }) => children;
const PopoverContent = ({ children, className = "", align = "start" }) => (
    <div className={`absolute z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${className}`} style={{ minWidth: '100%' }}>
        {children}
    </div>
);

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function NhapDonMoi() {
    // -------------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // -------------------------------------------------------------------------
    const [date, setDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState("khach-hang");
    const [isSaving, setIsSaving] = useState(false);

    // Form Data - Centralized State
    const [formData, setFormData] = useState({
        "ma-don": "",
        "created_at": new Date().toISOString().slice(0, 16), // datetime-local format
        "tracking_code": "",

        "ten-kh": "",
        "phone": "",
        "add": "",
        "city": "",
        "state": "",
        "zipcode": "",
        "area": "", // Khu vực

        "productMain": "",
        "mathang1": "", "sl1": 1,
        "mathang2": "", "sl2": 0,
        "quatang": "", "slq": 0,

        "sale_price": 0, // Giá bán
        "paymentType": "VND", // Loại tiền (Currency)
        "exchange_rate": 25000, // Tỷ giá mặc định (ví dụ)
        "tong-tien": 0, // Tổng tiền VNĐ
        "hinh-thuc": "", // Hình thức thanh toán (text)
        "shipping_fee": 0, "shipping_cost": 0,
        "base_price": 0, "reconciled_vnd": 0,

        "note_sale": "",
        "team": "",
        "creator_name": "",
    });

    const [trangThaiDon, setTrangThaiDon] = useState(null); // 'hop-le', 'xem-xet'

    // -------------------------------------------------------------------------
    // 2. DATA LOADING (Employees & Pages)
    // -------------------------------------------------------------------------
    const [pages, setPages] = useState([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [selectedPage, setSelectedPage] = useState("");
    const [pageSearch, setPageSearch] = useState("");
    const [isPageOpen, setIsPageOpen] = useState(false);

    const [saleEmployees, setSaleEmployees] = useState([]);
    const [loadingSale, setLoadingSale] = useState(false);
    const [selectedSale, setSelectedSale] = useState("");
    const [saleSearch, setSaleSearch] = useState("");
    const [isSaleOpen, setIsSaleOpen] = useState(false);

    const [mktEmployees, setMktEmployees] = useState([]);
    const [loadingMkt, setLoadingMkt] = useState(false);
    const [selectedMkt, setSelectedMkt] = useState("");
    const [mktSearch, setMktSearch] = useState("");
    const [isMktOpen, setIsMktOpen] = useState(false);

    // --- DATA LISTS ---
    const AREA_LIST = ["US", "Nhật Bản", "Hàn Quốc", "Canada", "Úc", "Anh", "CĐ Nhật Bản"];
    const PRODUCT_LIST = [
        "Glutathione Collagen", "Bakuchiol Retinol", "Nám DR Hancy", "Kem Body",
        "Glutathione Collagen NEW", "DG", "Fitgum CAFE 20X", "Kẹo Táo", "ComboGold24k",
        "Gel Xương Khớp", "Gel XK Thái", "Gel XK Phi", "Dán Kinoki", "Sữa tắm CUISHIFAN",
        "Bonavita Coffee", "Gel Dạ Dày", "Gel Trĩ", "Dragon Blood Cream"
    ];
    const GIFT_LIST = [
        "Serum Sâm", "Cream Sâm", "VIT C", "Dưỡng Tóc", "Kem Body",
        "Cream Bakuchiol", "Serum Bakuchiol", "Kẹo Dâu Glu", "Dầu gội",
        "Gel xương khớp", "Đường"
    ];
    const PAYMENT_METHODS = ["Zelle", "COD", "MO", "E-transfer", "Bank transfer", "Paypal", "Venmo", "Money Gram", "RIA", "CHECK", "Cash App"];
    const CURRENCY_LIST = ["USD", "JPY", "KRW", "CAD", "AUD", "GBP", "VND"];
    const EXCHANGE_RATES = {
        "USD": 25500,
        "JPY": 170,
        "KRW": 18,
        "CAD": 18000,
        "AUD": 16500,
        "GBP": 32000,
        "VND": 1
    };

    // User Info
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const userEmail = (user?.Email || user?.email || "").toString().toLowerCase().trim();
    const userName = user?.['Họ_và_tên'] || user?.['Họ và tên'] || user?.['Tên'] || "";
    const boPhan = user?.['Bộ_phận'] || user?.['Bộ phận'] || "";

    const loadPageData = async () => {
        setLoadingPages(true);
        setLoadingSale(true);
        setLoadingMkt(true);
        try {
            // 1. Fetch HR Data (Keep this for Sale employees for now, or fetch from DB if available)
            // For now, assuming HR_URL is still valid for fetching ALL employees to filter Sales
            const hrRes = await fetch(HR_URL);
            const hrData = await hrRes.json();
            const hrList = Array.isArray(hrData) ? hrData : Object.values(hrData || {}).filter(i => i && typeof i === 'object');

            // Filter Sale employees
            const saleList = hrList.filter((e) => {
                const dep = (e['Bộ_phận'] || e['Bộ phận'] || "").toString().trim().toLowerCase();
                return dep === 'sale' || dep === 'sales';
            });
            setSaleEmployees(saleList);


            // 2. Fetch Pages from Supabase 'marketing_pages'
            const { data: pagesData, error: pagesError } = await supabase
                .from('marketing_pages')
                .select('*');

            if (pagesError) throw pagesError;

            const pageList = pagesData || [];

            // 3. Extract MKT Employees from 'marketing_pages' (distinct mkt_staff)
            // This ensures "Nhân viên MKT" dropdown matches the pages available.
            const uniqueMktNames = [...new Set(pageList.map(p => p.mkt_staff).filter(Boolean))].sort();
            const mktList = uniqueMktNames.map(name => ({
                'Họ_và_tên': name,
                'Bộ_phận': 'Marketing'
            }));
            setMktEmployees(mktList);


            // Auto-set defaults based on user's department
            if (boPhan) {
                const userDep = boPhan.toString().trim().toLowerCase();
                if ((userDep === 'sale' || userDep === 'sales') && !selectedSale) {
                    setSelectedSale(userName);
                }
                if ((userDep === 'mkt' || userDep === 'marketing') && !selectedMkt) {
                    setSelectedMkt(userName);
                }
            }

            const currentEmp = hrList.find((e) =>
                (e.Email || e.email || "").toString().toLowerCase().trim() === userEmail
            );


            // Filter Pages logic based on Permissions
            // Assign all pages directly without permission filtering
            setPages(pageList);

        } catch (error) {
            console.error("Lỗi khi tải dữ liệu page/nhân sự:", error);
            // alert("Lỗi tải dữ liệu: " + error.message);
        } finally {
            setLoadingPages(false);
            setLoadingSale(false);
            setLoadingMkt(false);
        }
    };


    useEffect(() => {
        loadPageData();
    }, []);

    const [dbRates, setDbRates] = useState({});

    // --- LOGIC: Auto-fill Product Names ---
    useEffect(() => {
        const product = formData.productMain || "";
        let name1 = product;
        let name2 = product;

        if (product === "Bakuchiol Retinol") {
            name2 = "Bakuchiol Retinol - Cream";
        } else if (product === "ComboGold24k") {
            name2 = "Cream Sâm";
        }

        setFormData(prev => ({
            ...prev,
            mathang1: name1,
            mathang2: name2
            // Note: sl1 defaults to 1 and sl2 to 0 in initial state, user inputs manually
        }));
    }, [formData.productMain]);

    // --- LOGIC: Calculate Total VND ---
    useEffect(() => {
        const price = parseFloat(formData.sale_price) || 0;
        const rate = parseFloat(formData.exchange_rate) || 0;
        const total = price * rate;
        setFormData(prev => ({ ...prev, "tong-tien": total }));
    }, [formData.sale_price, formData.exchange_rate]);

    // Load DB Rates
    useEffect(() => {
        const fetchRates = async () => {
            const { data } = await supabase.from('exchange_rates').select('*').eq('id', 1).single();
            if (data) {
                setDbRates({
                    "USD": data.usd,
                    "JPY": data.jpy,
                    "KRW": data.krw,
                    "CAD": data.cad,
                    "AUD": data.aud,
                    "GBP": data.gbp,
                    "VND": 1
                });
            }
        };
        fetchRates();
    }, []);

    // ...

    // --- LOGIC: Auto-Currency by Area ---
    useEffect(() => {
        let currency = "VND";
        const area = formData.area;
        if (area === "US") currency = "USD";
        if (area === "Nhật Bản" || area === "CĐ Nhật Bản") currency = "JPY";
        if (area === "Hàn Quốc") currency = "KRW";
        if (area === "Canada") currency = "CAD";
        if (area === "Úc") currency = "AUD";
        if (area === "Anh") currency = "GBP";

        // Auto-set Currency and Exchange Rate
        if (area) {
            // Priority: DB Rate > Hardcoded Constant > 1
            const rate = dbRates[currency] || EXCHANGE_RATES[currency] || 1;
            setFormData(prev => ({
                ...prev,
                paymentType: currency,
                exchange_rate: rate
            }));
        }
    }, [formData.area, dbRates]); // Add dbRates dependency

    // --- LOGIC: Auto-update Rate when Currency Changes Manually ---
    useEffect(() => {
        const rate = dbRates[formData.paymentType] || EXCHANGE_RATES[formData.paymentType] || 1;
        setFormData(prev => ({ ...prev, exchange_rate: rate }));
    }, [formData.paymentType, dbRates]);

    const filteredSaleEmployees = useMemo(() => {
        if (!saleSearch) return saleEmployees;
        return saleEmployees.filter(e => (e['Họ_và_tên'] || e['Họ và tên'] || "").toLowerCase().includes(saleSearch.toLowerCase()));
    }, [saleEmployees, saleSearch]);

    const filteredMktEmployees = useMemo(() => {
        if (!mktSearch) return mktEmployees;
        return mktEmployees.filter(e => (e['Họ_và_tên'] || e['Họ và tên'] || "").toLowerCase().includes(mktSearch.toLowerCase()));
    }, [mktEmployees, mktSearch]);

    // -------------------------------------------------------------------------
    // 2.5 FILTER LOGIC (Missing previously => Fixed)
    // -------------------------------------------------------------------------
    const filteredPages = pages.filter(p => {
        const matchesSearch = !pageSearch || (p.page_name || "").toLowerCase().includes(pageSearch.toLowerCase());
        const matchesMkt = !selectedMkt || (p.mkt_staff === selectedMkt);

        // If searching, show all matches. If not searching but MKT selected, show MKT's pages.
        if (pageSearch) return matchesSearch;
        return matchesMkt;
    });



    // -------------------------------------------------------------------------
    // 3. HANDLERS
    // -------------------------------------------------------------------------
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const toggleXacNhan = (key) => {
        setXacNhan(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        // Validation
        if (!formData["ten-kh"] || !formData["phone"] || !selectedPage) {
            alert("Vui lòng nhập tên, số điện thoại khách hàng và chọn Page!");
            return;
        }

        setIsSaving(true);
        try {
            // Generate Code if empty
            let orderCode = formData["ma-don"];
            if (!orderCode) {
                // Rule: 3 chars of Product + Random string
                let prefix = "DH";
                if (formData.productMain && formData.productMain.length >= 3) {
                    prefix = formData.productMain.substring(0, 3).toUpperCase();
                }
                const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                orderCode = `${prefix}${random}`;
            }

            // Prepare payload
            const orderPayload = {
                order_code: orderCode,
                order_date: new Date().toISOString(), // Use full ISO string
                tracking_code: formData.tracking_code,

                customer_name: formData["ten-kh"],
                customer_phone: formData["phone"],
                customer_address: formData["add"],
                city: formData.city,
                state: formData.state,
                zipcode: formData.zipcode,
                area: formData.area, // New

                // Products
                product_main: formData.productMain,
                product_name_1: formData.mathang1,
                quantity_1: parseFloat(formData.sl1) || 0,
                product_name_2: formData.mathang2,
                quantity_2: parseFloat(formData.sl2) || 0,
                gift: formData.quatang,
                gift_quantity: parseFloat(formData.slq) || 0,

                // Payment
                sale_price: parseFloat(formData.sale_price) || 0,
                payment_type: formData.paymentType,
                exchange_rate: parseFloat(formData.exchange_rate) || 1,
                total_amount_vnd: parseFloat(formData["tong-tien"]) || 0,
                payment_method_text: formData["hinh-thuc"],

                shipping_fee: parseFloat(formData.shipping_fee) || 0,
                shipping_cost: parseFloat(formData.shipping_cost) || 0,
                base_price: parseFloat(formData.base_price) || 0,
                reconciled_vnd: parseFloat(formData.reconciled_vnd) || 0,

                page_name: selectedPage,
                marketing_staff: selectedMkt,
                sale_staff: selectedSale,

                // Defaults / System
                delivery_status: "Chờ xử lý",
                // User Info
                cskh: userName, // CRITICAL: Current user is CSKH
                created_by: userEmail,

                note: `${formData["note_sale"] || ""} \nRef: ${formData.team || ""}`,

                // Override status if needed or just keep default
                // delivery_status is already set above to 'Chờ xử lý'
            };

            const { data: savedData, error } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select(); // Request returned data to verify persistence

            if (error) throw error;

            if (!savedData || savedData.length === 0) {
                console.warn("⚠️ Warning: Data inserted but not returned (RLS Policy?).");
            }

            alert("✅ Lưu đơn hàng thành công! Đã lưu vào Supabase.");

            // Optional: Reset form or Redirect
            // Reset core fields
            setFormData(prev => ({
                ...prev,
                "ten-kh": "",
                phone: "",
                "ma-don": "",
                "tong-tien": ""
            }));

        } catch (error) {
            console.error("Save error:", error);
            alert(`❌ Lỗi lưu đơn: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}
                <Link to="/trang-chu" className="inline-flex items-center text-green-600 hover:text-green-700 mb-4">
                    <ChevronLeft className="w-5 h-5" />
                    <span>Quay lại</span>
                </Link>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#2d7c2d]">Nhập đơn hàng mới</h1>
                            <p className="text-gray-500 italic text-sm">Vui lòng điền đầy đủ các thông tin bắt buộc (*)</p>
                        </div>
                        <div className="flex gap-2">
                            <Link to="/quan-ly-cskh">
                                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Hủy bỏ
                                </Button>
                            </Link>
                            <Button className="bg-[#2d7c2d] hover:bg-[#256625]" onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Đang lưu..." : "Lưu đơn hàng"}
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="w-full">
                        <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setActiveTab("khach-hang")}
                                className={`py-3 px-4 rounded-md font-medium transition-colors ${activeTab === "khach-hang" ? "bg-[#2d7c2d] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                            >
                                Thông tin khách hàng
                            </button>
                            <button
                                onClick={() => setActiveTab("thong-tin-don")}
                                className={`py-3 px-4 rounded-md font-medium transition-colors ${activeTab === "thong-tin-don" ? "bg-[#2d7c2d] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                            >
                                Thông tin đơn
                            </button>
                            <button
                                onClick={() => setActiveTab("nhan-su")}
                                className={`py-3 px-4 rounded-md font-medium transition-colors ${activeTab === "nhan-su" ? "bg-[#2d7c2d] text-white" : "text-gray-700 hover:bg-gray-200"}`}
                            >
                                Thông tin nhân sự
                            </button>
                        </div>

                        {/* Tab: Thông tin khách hàng */}
                        {activeTab === "khach-hang" && (
                            <Card>
                                <CardHeader className="pb-3 border-b mb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <div className="w-1 h-6 bg-[#2d7c2d] rounded-full" />
                                        Dữ liệu khách hàng
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="ngay-len-don">Ngày lên đơn*</Label>
                                        <DatePicker value={date} onChange={setDate} className="w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="nv-mkt">Nhân viên marketing</Label>
                                        <Popover open={isMktOpen} onOpenChange={setIsMktOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between h-10 font-normal"
                                                    disabled={loadingMkt}
                                                    onClick={() => setIsMktOpen(!isMktOpen)}
                                                >
                                                    {selectedMkt ? (
                                                        <span className="truncate">{selectedMkt}</span>
                                                    ) : (
                                                        <span className="text-gray-500">{loadingMkt ? "Đang tải..." : "Chọn nhân viên..."}</span>
                                                    )}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            {isMktOpen && (
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center border-b px-3">
                                                            <Search className="mr-2 h-4 w-4 opacity-50" />
                                                            <input
                                                                className="flex h-10 w-full bg-transparent py-3 text-sm outline-none"
                                                                placeholder="Tìm tên nhân viên..."
                                                                value={mktSearch}
                                                                onChange={(e) => setMktSearch(e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                                            {filteredMktEmployees.map((e, idx) => {
                                                                const empName = e['Họ_và_tên'] || e['Họ và tên'] || `NV ${idx}`;
                                                                const isSelected = selectedMkt === empName;
                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={cn("flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100", isSelected && "bg-gray-100 font-medium")}
                                                                        onClick={() => { setSelectedMkt(empName); setIsMktOpen(false); setMktSearch(""); }}
                                                                    >
                                                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                        <span className="truncate">{empName}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            )}
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="ten-page">Tên page*</Label>
                                            <button onClick={loadPageData} disabled={loadingPages} className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline">
                                                <RefreshCcw className={cn("w-3 h-3", loadingPages && "animate-spin")} /> Làm mới
                                            </button>
                                        </div>
                                        <Popover open={isPageOpen} onOpenChange={setIsPageOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between h-10 font-normal"
                                                    disabled={loadingPages}
                                                    onClick={() => setIsPageOpen(!isPageOpen)}
                                                >
                                                    {selectedPage ? <span className="truncate">{selectedPage}</span> : <span className="text-gray-500">{loadingPages ? "Đang tải..." : "Chọn page..."}</span>}
                                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            {isPageOpen && (
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center border-b px-3">
                                                            <Search className="mr-2 h-4 w-4 opacity-50" />
                                                            <input className="flex h-10 w-full bg-transparent py-3 text-sm outline-none" placeholder="Tìm kiếm page..." value={pageSearch} onChange={(e) => setPageSearch(e.target.value)} />
                                                        </div>
                                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                                            {filteredPages.map((p, idx) => {
                                                                const pageName = p.page_name || `Page ${idx}`;
                                                                const isSelected = selectedPage === pageName;
                                                                return (
                                                                    <div key={idx} className={cn("flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100", isSelected && "bg-gray-100 font-medium")} onClick={() => {
                                                                        setSelectedPage(pageName);
                                                                        // Always update MKT: Set to staff name if exists, else clear it
                                                                        setSelectedMkt(p.mkt_staff ? p.mkt_staff.toString().trim() : "");
                                                                        setIsPageOpen(false);
                                                                        setPageSearch("");
                                                                    }}>
                                                                        <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                        <span className="truncate">{pageName}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </PopoverContent>
                                            )}
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone*</Label>
                                        <Input id="phone" value={formData.phone} onChange={handleInputChange} placeholder="Số điện thoại..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ten-kh">Tên*</Label>
                                        <Input id="ten-kh" value={formData["ten-kh"]} onChange={handleInputChange} placeholder="Họ và tên khách hàng..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="add">Add*</Label>
                                        <Input id="add" value={formData.add} onChange={handleInputChange} placeholder="Địa chỉ chi tiết..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Khu vực</Label>
                                        <select id="area" value={formData.area} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                            <option value="">Chọn khu vực...</option>
                                            {AREA_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" value={formData.city} onChange={handleInputChange} placeholder="Thành phố..." />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label htmlFor="state">State</Label>
                                            <Input id="state" value={formData.state} onChange={handleInputChange} placeholder="Tỉnh/Bang..." />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipcode">Zipcode</Label>
                                        <Input id="zipcode" value={formData.zipcode} onChange={handleInputChange} placeholder="Mã bưu điện..." />
                                    </div>

                                    {/* Tracking Code & Date moved/added here for logical flow? Or separate tab? Keeping layout structure. */}
                                    <div className="space-y-2 pt-4 border-t">
                                        <Label htmlFor="tracking_code">Mã Tracking</Label>
                                        <Input id="tracking_code" value={formData.tracking_code} onChange={handleInputChange} placeholder="Nhập mã vận đơn..." />
                                    </div>
                                    {/* Tracking Code end of card content */}
                                </CardContent>
                            </Card>
                        )}

                        {/* Tab: Thông tin đơn */}
                        {activeTab === "thong-tin-don" && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2">
                                    <CardHeader className="pb-3 border-b mb-4">
                                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                            <div className="w-1 h-6 bg-[#2d7c2d] rounded-full" />
                                            Chi tiết mặt hàng
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Row 1: Main Product & Order Code */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Mặt hàng (Chính)</Label>
                                                <select id="productMain" value={formData.productMain} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                                    <option value="">Chọn mặt hàng...</option>
                                                    {PRODUCT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ma-don">Mã đơn hàng (Tự sinh)</Label>
                                                <Input id="ma-don" value={formData["ma-don"]} onChange={handleInputChange} placeholder="Để trống tự sinh..." />
                                            </div>
                                        </div>

                                        {/* Row 2: Item 1 */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-md">
                                            <div className="md:col-span-3 space-y-2">
                                                <Label htmlFor="mathang1">Tên mặt hàng 1</Label>
                                                <Input id="mathang1" value={formData.mathang1} onChange={handleInputChange} placeholder="Tự động..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sl1">Số lượng 1</Label>
                                                <Input id="sl1" type="number" value={formData.sl1} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        {/* Row 3: Item 2 */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-md">
                                            <div className="md:col-span-3 space-y-2">
                                                <Label htmlFor="mathang2">Tên mặt hàng 2 (Auto)</Label>
                                                <Input id="mathang2" value={formData.mathang2} onChange={handleInputChange} placeholder="Tự động..." />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="sl2">Số lượng 2</Label>
                                                <Input id="sl2" type="number" value={formData.sl2 || ""} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        {/* Row 4: Gift */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-4">
                                            <div className="md:col-span-3 space-y-2">
                                                <Label htmlFor="quatang">Quà tặng</Label>
                                                <select id="quatang" value={formData.quatang} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                                    <option value="">Không có quà...</option>
                                                    {GIFT_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="slq">Số lượng quà</Label>
                                                <Input id="slq" type="number" value={formData.slq || ""} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        {/* FINANCIAL SECTION */}
                                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="sale_price">Giá bán (Ngoại tệ)</Label>
                                                <Input id="sale_price" type="number" value={formData.sale_price || ""} onChange={handleInputChange} placeholder="0" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Loại tiền</Label>
                                                <select id="paymentType" value={formData.paymentType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                                    {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="exchange_rate">Tỷ giá</Label>
                                                <Input id="exchange_rate" type="number" value={formData.exchange_rate} onChange={handleInputChange} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-red-600 font-bold">Tổng tiền (VNĐ)</Label>
                                                <div className="px-3 py-2 bg-gray-100 border rounded-md font-bold text-lg">
                                                    {(parseFloat(formData["tong-tien"]) || 0).toLocaleString()} đ
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="hinh-thuc">Hình thức thanh toán</Label>
                                                <select id="hinh-thuc" value={formData["hinh-thuc"]} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                                    <option value="">Chọn hình thức...</option>
                                                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Expandable Cost Details (Optional/Advanced) */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                            <div>
                                                <label>Tiền ship</label>
                                                <input id="shipping_fee" type="number" className="w-full border rounded p-1" value={formData.shipping_fee || ""} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <label>Phí ship (Thực)</label>
                                                <input id="shipping_cost" type="number" className="w-full border rounded p-1" value={formData.shipping_cost || ""} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <label>Giá gốc</label>
                                                <input id="base_price" type="number" className="w-full border rounded p-1" value={formData.base_price || ""} onChange={handleInputChange} />
                                            </div>
                                            <div>
                                                <label>VNĐ Đối soát</label>
                                                <input id="reconciled_vnd" type="number" className="w-full border rounded p-1" value={formData.reconciled_vnd || ""} onChange={handleInputChange} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-yellow-200 bg-yellow-50/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Kiểm tra hệ thống
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs space-y-2 text-yellow-800">
                                            <p>• Cảnh báo Blacklist: <span className="font-semibold text-green-600">Sạch</span></p>
                                            <p>• Trùng đơn: <span className="font-semibold text-green-600">Không phát hiện</span></p>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-bold">Ghi chú & Phản hồi</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1">
                                                <Label htmlFor="ghi-chu" className="text-xs">Ghi chú</Label>
                                                <Textarea id="ghi-chu" value={formData["ghi-chu"]} onChange={handleInputChange} placeholder="Nhập ghi chú..." className="h-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="ph-tc" className="text-xs text-green-600">Phản hồi tích cực</Label>
                                                <Textarea id="ph-tc" value={formData["ph-tc"]} onChange={handleInputChange} placeholder="..." className="h-16" />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="ph-tn" className="text-xs text-red-600">Phản hồi tiêu cực</Label>
                                                <Textarea id="ph-tn" value={formData["ph-tn"]} onChange={handleInputChange} placeholder="..." className="h-16" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Tab: Thông tin nhân sự */}
                        {activeTab === "nhan-su" && (
                            <Card>
                                <CardHeader className="pb-3 border-b mb-4">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <div className="w-1 h-6 bg-[#2d7c2d] rounded-full" />
                                        Xử lý bởi nhân viên
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label>Nhân viên Sale</Label>
                                            <Popover open={isSaleOpen} onOpenChange={setIsSaleOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between h-10 font-normal" disabled={loadingSale} onClick={() => setIsSaleOpen(!isSaleOpen)}>
                                                        {selectedSale ? <span className="truncate">{selectedSale}</span> : <span className="text-gray-500">{loadingSale ? "Đang tải..." : "Chọn nhân viên..."}</span>}
                                                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                {isSaleOpen && (
                                                    <PopoverContent className="w-full p-0" align="start">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center border-b px-3">
                                                                <Search className="mr-2 h-4 w-4 opacity-50" />
                                                                <input className="flex h-10 w-full bg-transparent py-3 text-sm outline-none" placeholder="Tìm tên nhân viên..." value={saleSearch} onChange={(e) => setSaleSearch(e.target.value)} />
                                                            </div>
                                                            <div className="max-h-[300px] overflow-y-auto p-1">
                                                                {filteredSaleEmployees.map((e, idx) => {
                                                                    const empName = e['Họ_và_tên'] || e['Họ và tên'] || `NV ${idx}`;
                                                                    const isSelected = selectedSale === empName;
                                                                    return (
                                                                        <div key={idx} className={cn("flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100", isSelected && "bg-gray-100 font-medium")} onClick={() => { setSelectedSale(empName); setIsSaleOpen(false); setSaleSearch(""); }}>
                                                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                            <span className="truncate">{empName}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                )}
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phân loại khách hàng</Label>
                                            <select id="customerType" value={formData.customerType} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]">
                                                <option value="">Chọn phân loại...</option>
                                                <option value="moi">Khách mới</option>
                                                <option value="cu">Khách cũ</option>
                                                <option value="vip">VIP</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Trạng thái đơn</Label>
                                            <div className="flex gap-2">
                                                <Button type="button" variant={trangThaiDon === "hop-le" ? "default" : "outline"} className={cn("flex-1", trangThaiDon === "hop-le" && "bg-green-600 hover:bg-green-700")} onClick={() => setTrangThaiDon("hop-le")}>
                                                    Đơn hợp lệ
                                                </Button>
                                                <Button type="button" variant={trangThaiDon === "xem-xet" ? "default" : "outline"} className={cn("flex-1", trangThaiDon === "xem-xet" && "bg-yellow-600 hover:bg-yellow-700")} onClick={() => setTrangThaiDon("xem-xet")}>
                                                    Đơn xem xét
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dien-giai">Diễn giải</Label>
                                        <Textarea id="dien-giai" value={formData["dien-giai"]} onChange={handleInputChange} placeholder="Nhập diễn giải chi tiết về đơn hàng hoặc khách hàng..." className="h-24" />
                                    </div>

                                    <div className="space-y-4 border-t pt-6">
                                        <Label className="text-base font-bold text-[#2d7c2d]">Lưu ý</Label>
                                        <div className="text-sm text-gray-600">
                                            Vui lòng kiểm tra kỹ thông tin trước khi lưu. Đơn hàng sẽ được chuyển sang trạng thái "Chờ xử lý".
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div >
            </div >
        </div >
    );
}
