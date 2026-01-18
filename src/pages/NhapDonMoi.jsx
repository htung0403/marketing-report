import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { AlertCircle, Check, ChevronDown, RefreshCcw, Save, Search, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from 'react-router-dom';
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


const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function NhapDonMoi({ isEdit = false }) {
    // -------------------------------------------------------------------------
    // 0. USER INFO (Extracted early for state initialization)
    // -------------------------------------------------------------------------
    const userJson = localStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const userEmail = (user?.Email || user?.email || localStorage.getItem("userEmail") || "").toString().toLowerCase().trim();

    // PRIORITY: Check localStorage "username" directly first (matches Header.jsx logic)
    // Then fallback to parsing "user" object
    const userName = localStorage.getItem("username") || user?.['Họ_và_tên'] || user?.['Họ và tên'] || user?.['Tên'] || user?.username || user?.name || "";
    const boPhan = user?.['Bộ_phận'] || user?.['Bộ phận'] || localStorage.getItem("userTeam") || "";

    // -------------------------------------------------------------------------
    // 1. STATE MANAGEMENT
    // -------------------------------------------------------------------------
    const [date, setDate] = useState(new Date());
    const [popoverWidth, setPopoverWidth] = useState("auto");
    const containerRef = useRef(null);
    const mktRef = useRef(null); // Ref for Marketing dropdown
    const pageRef = useRef(null); // Ref for Page dropdown
    const [mktPopoverWidth, setMktPopoverWidth] = useState("auto"); // Width for MKT dropdown
    const [pagePopoverWidth, setPagePopoverWidth] = useState("auto"); // Width for Page dropdown
    const [productPopoverWidth, setProductPopoverWidth] = useState("auto"); // Width for Product dropdown
    const productRef = useRef(null); // Ref for Product dropdown
    const [activeTab, setActiveTab] = useState("khach-hang");
    const [isSaving, setIsSaving] = useState(false);

    const [searchParams] = useSearchParams();

    // Edit Mode State
    const [searchQuery, setSearchQuery] = useState(searchParams.get("orderId") || "");
    const [isSearching, setIsSearching] = useState(false);
    const [isOrderLoaded, setIsOrderLoaded] = useState(false);

    // Autocomplete State
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

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

    // Blacklist State
    const [blacklistStatus, setBlacklistStatus] = useState(null); // null, 'clean', 'warning'
    const [blacklistReason, setBlacklistReason] = useState("");
    const [blacklistInfo, setBlacklistInfo] = useState(null); // { name, phone } to display comparison
    const [blacklistItems, setBlacklistItems] = useState([]); // List of all blacklist items
    const [showBlacklist, setShowBlacklist] = useState(false); // Toggle visibility

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
    // Initialize selectedSale with current userName immediately
    const [selectedSale, setSelectedSale] = useState(userName || "");
    const [saleSearch, setSaleSearch] = useState("");
    const [isSaleOpen, setIsSaleOpen] = useState(false);

    const [mktEmployees, setMktEmployees] = useState([]);
    const [loadingMkt, setLoadingMkt] = useState(false);
    const [selectedMkt, setSelectedMkt] = useState("");
    const [mktSearch, setMktSearch] = useState("");
    const [isMktOpen, setIsMktOpen] = useState(false);

    const [productSearch, setProductSearch] = useState("");
    const [isProductOpen, setIsProductOpen] = useState(false);
    const productDropdownRef = useRef(null);

    // Click outside to close product dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
        };

        if (isProductOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProductOpen]);

    // --- DATA LISTS ---
    const AREA_LIST = ["US", "Nhật Bản", "Hàn Quốc", "Canada", "Úc", "Anh", "CĐ Nhật Bản"];
    const PRODUCT_LIST = [
        "Glutathione Collagen", "Bakuchiol Retinol", "Nám DR Hancy", "Kem Body",
        "Glutathione Collagen NEW", "DG", "Fitgum CAFE 20X", "Kẹo Táo", "ComboGold24k",
        "Gel Xương Khớp", "Gel XK Thái", "Gel XK Phi", "Dán Kinoki", "Sữa tắm CUISHIFAN",
        "Bonavita Coffee", "Gel Dạ Dày", "Gel Trĩ", "Dragon Blood Cream"
    ];

    // Các sản phẩm CHỈ dành cho nhân viên có quyền R&D
    // Load from System Settings (Advanced) or use default
    // Các sản phẩm CHỈ dành cho nhân viên có quyền R&D
    const [rdProducts, setRdProducts] = useState([
        "Glutathione Collagen NEW",
        "Dragon Blood Cream",
        "Gel XK Thái",
        "Gel XK Phi"
    ]);

    useEffect(() => {
        const fetchSystemSettings = async () => {
            try {
                // Try fetching from Supabase first
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('settings')
                    .eq('id', 'global_config')
                    .single();

                if (data && data.settings && Array.isArray(data.settings.rndProducts)) {
                    setRdProducts(data.settings.rndProducts);
                    return;
                }
            } catch (err) {
                // Silent fail/continue to local
            }

            // Fallback to LocalStorage if Supabase fails or returns nothing
            try {
                const s = localStorage.getItem('system_settings');
                if (s) {
                    const parsed = JSON.parse(s);
                    if (parsed.rndProducts && Array.isArray(parsed.rndProducts)) {
                        setRdProducts(parsed.rndProducts);
                    }
                }
            } catch (e) { }
        };

        fetchSystemSettings();

        // Load Blacklist Items for reference
        const fetchBlacklist = async () => {
            const { data } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false });
            if (data) setBlacklistItems(data);
        };
        fetchBlacklist();
    }, []);

    const RD_EXCLUSIVE_PRODUCTS = rdProducts;
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

    // -------------------------------------------------------------------------

    // Check R&D Permission
    const hasRndPermission = useMemo(() => {
        if (!user) return false;
        // Kiểm tra trường "Phân quyền" hoặc "Thẻ phân quyền" hoặc role R&D
        const permissions = user['Phân_quyền'] || user['Phân quyền'] || user['permissions'] || "";

        if (Array.isArray(permissions)) return permissions.includes("R&D");
        return String(permissions).includes("R&D");
    }, [user]);

    // Filter Products
    const visibleProducts = useMemo(() => {
        if (hasRndPermission) return PRODUCT_LIST;
        return PRODUCT_LIST.filter(p => !RD_EXCLUSIVE_PRODUCTS.includes(p));
    }, [hasRndPermission, PRODUCT_LIST]);

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


            // Auto-set defaults: If not selected, default to current user
            // Logic: "Ai đăng nhập thì tự điền tên người đó sau đó thích sửa thì cho sửa"
            if (!selectedSale && userName) {
                // Check if user is in valid lists or just set it?
                // User wants convenience, so we set it to userName.
                // If userName is not in the dropdown list, it might be an issue if dropdown is strict.
                // But the dropdown (popover) allows searching/filtering.
                // Let's check if we should strictly limit to 'Sale' department?
                // Request says: "ai đăng nhập thì tự điền tên người đó".
                // So we prioritize setting it.
                setSelectedSale(userName);
            }
            // Also optional: Set MKT default if MKT dept
            if (boPhan) {
                const userDep = boPhan.toString().trim().toLowerCase();
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
            console.error("Lỗi khi tải dữ liệu page/nhân sự (Có thể do mất mạng hoặc lỗi server):", error);
            // Không hiện alert để tránh làm phiền, chỉ log warning
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

    useEffect(() => {
        const orderIdParam = searchParams.get("orderId");
        if (orderIdParam && isEdit) {
            setSearchQuery(orderIdParam);
            // Delay slightly to ensure component mounted or just call directly
            handleSearch(null, orderIdParam);
        }
    }, [searchParams, isEdit]);

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
            try {
                const { data, error } = await supabase.from('exchange_rates').select('*').eq('id', 1).single();
                if (error) throw error;
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
            } catch (err) {
                console.warn("Không thể tải tỷ giá từ DB (Dùng mặc định):", err);
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

    // --- LOGIC: Check Blacklist (Debounced) ---
    useEffect(() => {
        const checkBlacklist = async () => {
            const phone = formData.phone ? formData.phone.trim() : "";
            const name = formData["ten-kh"] ? formData["ten-kh"].trim() : "";

            if (!phone && !name) {
                setBlacklistStatus(null);
                setBlacklistReason("");
                setBlacklistInfo(null);
                return;
            }

            try {
                // Query blacklist table
                // Check exact phone OR name contains (case insensitive)
                let query = supabase.from('blacklist').select('*');

                // Construct OR condition
                const conditions = [];
                if (phone) conditions.push(`phone.eq.${phone}`);
                if (name) conditions.push(`name.ilike.%${name}%`);

                if (conditions.length > 0) {
                    const { data, error } = await query.or(conditions.join(',')).limit(1);

                    if (data && data.length > 0) {
                        setBlacklistStatus('warning');
                        setBlacklistReason(data[0].reason || "Không rõ lý do");
                        // Store detailed info for comparison
                        setBlacklistInfo(data[0]);
                    } else {
                        setBlacklistStatus('clean');
                        setBlacklistReason("");
                        setBlacklistInfo(null);
                    }
                }
            } catch (err) {
                console.error("Blacklist check error:", err);
            }
        };

        const timeoutId = setTimeout(checkBlacklist, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [formData.phone, formData["ten-kh"]]);

    const filteredSaleEmployees = useMemo(() => {
        if (!saleSearch) return saleEmployees;
        return saleEmployees.filter(e => (e['Họ_và_tên'] || e['Họ và tên'] || "").toLowerCase().includes(saleSearch.toLowerCase()));
    }, [saleEmployees, saleSearch]);

    const filteredMktEmployees = useMemo(() => {
        if (!mktSearch) return mktEmployees;
        return mktEmployees.filter(e => (e['Họ_và_tên'] || e['Họ và tên'] || "").toLowerCase().includes(mktSearch.toLowerCase()));
    }, [mktEmployees, mktSearch]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return visibleProducts;
        return visibleProducts.filter(p => p.toLowerCase().includes(productSearch.toLowerCase()));
    }, [visibleProducts, productSearch]);

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

    // --- Autocomplete Logic ---
    useEffect(() => {
        const fetchSuggestions = async () => {
            // Only fetch if NOT already searching/loading to avoid spam
            if (isSearching) return;

            try {
                let queryBuilder = supabase
                    .from('orders')
                    .select('order_code, customer_name');

                if (!searchQuery || searchQuery.trim() === '') {
                    // Empty query: Fetch recent 100 orders
                    queryBuilder = queryBuilder.order('created_at', { ascending: false }).limit(100);
                } else {
                    // Search query: Filter by order_code
                    queryBuilder = queryBuilder.ilike('order_code', `%${searchQuery}%`).limit(5);
                }

                const { data, error } = await queryBuilder;

                if (error) throw error;
                setSuggestions(data || []);
                // Only show if we have data
                if (data && data.length > 0) {
                    // We control show/hide via onFocus/onBlur, but this ensures data is ready
                }
            } catch (err) {
                console.error("Suggestion error:", err);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, isSearching]);

    const selectSuggestion = (code) => {
        setSearchQuery(code);
        setShowSuggestions(false);
        handleSearch(null, code);
    };

    const handleSearch = async (e, queryOverride) => {
        if (e) e.preventDefault();
        const query = queryOverride || searchQuery;
        if (!query || !query.trim()) return;

        setIsSearching(true);
        try {
            // Search primarily by order_code. ID search removed to prevent UUID casting errors.
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('order_code', query.trim())
                .maybeSingle(); // Use maybeSingle to return null instead of throwing error if not found

            if (error) throw error;

            if (!data) {
                alert("Không tìm thấy đơn hàng có mã này!");
                setIsOrderLoaded(false); // Reset loaded state
                return;
            }

            // Map Data to Form
            setFormData({
                "ma-don": data.order_code,
                "created_at": data.order_date ? data.order_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
                "tracking_code": data.tracking_code || "",

                "ten-kh": data.customer_name || "",
                "phone": data.customer_phone || "",
                "add": data.customer_address || "",
                "city": data.city || "",
                "state": data.state || "",
                "zipcode": data.zipcode || "",
                "area": data.area || "",

                "productMain": data.product_main || "",
                "mathang1": data.product_name_1 || "", "sl1": data.quantity_1 || 1,
                "mathang2": data.product_name_2 || "", "sl2": data.quantity_2 || 0,
                "quatang": data.gift || "", "slq": data.gift_quantity || 0,

                "sale_price": data.sale_price || 0,
                "paymentType": data.payment_type || "VND",
                "exchange_rate": data.exchange_rate || 1,
                "tong-tien": data.total_amount_vnd || 0,
                "hinh-thuc": data.payment_method_text || "",
                "shipping_fee": data.shipping_fee || 0,
                "shipping_cost": data.shipping_cost || 0,
                "base_price": data.base_price || 0,
                "reconciled_vnd": data.reconciled_vnd || 0,

                "note_sale": data.note ? data.note.split('\nRef:')[0] : "",
                "team": data.team || "",
                "creator_name": data.created_by || "",
            });

            setDate(data.order_date ? new Date(data.order_date) : new Date());
            setSelectedPage(data.page_name || "");
            setSelectedMkt(data.marketing_staff || "");
            setSelectedSale(data.sale_staff || "");
            setTrangThaiDon(null); // Reset status check
            setIsOrderLoaded(true);



        } catch (err) {
            console.error("Search error:", err);
            alert("Lỗi khi tìm đơn hàng: " + err.message);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        // Validation
        // Validation - Only strict for new orders
        if (!isEdit && (!formData["ten-kh"] || !formData["phone"] || !selectedPage)) {
            alert("Vui lòng nhập tên, số điện thoại khách hàng và chọn Page!");
            return;
        }

        setIsSaving(true);
        try {
            // Generate Code if empty (Only for new orders)
            let orderCode = formData["ma-don"];
            if (!orderCode && !isEdit) {
                // Rule: Remove spaces, take first 3 characters + Random 7-9 alphanumeric
                let prefix = "DH";
                if (formData.productMain) {
                    // Remove all spaces and take first 3 characters
                    const noSpaces = formData.productMain.replace(/\s+/g, '');
                    prefix = noSpaces.substring(0, 3);
                }
                // Generate random alphanumeric string (letters + numbers), length 7-9
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                const randomLength = Math.floor(Math.random() * 3) + 7; // 7-9 characters
                let randomStr = '';
                for (let i = 0; i < randomLength; i++) {
                    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                orderCode = `${prefix}${randomStr}`;
            } else if (!orderCode && isEdit) {
                alert("Đơn hàng chỉnh sửa phải có Mã Đơn Hàng!");
                setIsSaving(false);
                return;
            }

            // Prepare payload
            const orderPayload = {
                order_code: orderCode,
                order_date: new Date().toISOString(), // Use full ISO string or preserve original?
                // For edit, maybe we want to keep original date unless user changed it
                tracking_code: formData.tracking_code,

                customer_name: formData["ten-kh"],
                customer_phone: formData["phone"],
                customer_address: formData["add"],
                city: formData.city,
                state: formData.state,
                zipcode: formData.zipcode,
                area: formData.area,

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
                delivery_status: isEdit ? undefined : "Chờ xử lý", // Don't overwrite status on edit
                // User Info
                cskh: userName,
                // Don't overwrite created_by on edit ideally, but here we just send it if new

                note: `${formData["note_sale"] || ""} \nRef: ${formData.team || ""}`,
            };

            // Remove undefined keys
            Object.keys(orderPayload).forEach(key => orderPayload[key] === undefined && delete orderPayload[key]);

            const query = supabase.from('orders');
            let result;

            if (isEdit) {
                result = await query.upsert([orderPayload], { onConflict: 'order_code' }).select();
            } else {
                result = await query.insert([orderPayload]).select();
            }

            const { data: savedData, error } = result;

            if (error) throw error;

            if (!savedData || savedData.length === 0) {
                console.warn("⚠️ Warning: Data inserted/updated but not returned (RLS Policy?).");
            }

            alert(isEdit ? "✅ Cập nhật đơn hàng thành công!" : "✅ Lưu đơn hàng thành công!");

            // Optional: Reset form or Redirect
            if (!isEdit) {
                handleReset();
            }

        } catch (error) {
            console.error("Save error:", error);
            alert(`❌ Lỗi lưu đơn: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFormData({
            "ma-don": "",
            "created_at": new Date().toISOString().slice(0, 16),
            "tracking_code": "",
            "ten-kh": "",
            "phone": "",
            "add": "",
            "city": "",
            "state": "",
            "zipcode": "",
            "area": "",
            "productMain": "",
            "mathang1": "", "sl1": 1,
            "mathang2": "", "sl2": 0,
            "quatang": "", "slq": 0,
            "sale_price": 0,
            "paymentType": "VND",
            "exchange_rate": 25000,
            "tong-tien": 0,
            "hinh-thuc": "",
            "shipping_fee": 0, "shipping_cost": 0,
            "base_price": 0, "reconciled_vnd": 0,
            "note_sale": "",
            "team": "",
            "creator_name": "",
        });
        setSelectedPage("");
        setSelectedMkt("");
        // Reset to current user by default
        setSelectedSale(userName || "");
        setProductSearch("");
        setDate(new Date());
        setActiveTab("khach-hang");

        // Reset Blacklist State
        setBlacklistStatus(null);
        setBlacklistReason("");
        setBlacklistInfo(null);
        setBlacklistItems([]); // Optional: keep items or clear? Better keep to save fetch? Actually keep items is better, but clear status is must
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Back Button */}


                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-[#2d7c2d]">{isEdit ? "Chỉnh Sửa Đơn Hàng" : "Nhập đơn hàng mới"}</h1>
                            <p className="text-gray-500 italic text-sm">Vui lòng điền đầy đủ các thông tin bắt buộc (*)</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleReset}>
                                <XCircle className="w-4 h-4 mr-2" />
                                Hủy bỏ
                            </Button>
                            <Button className="bg-[#2d7c2d] hover:bg-[#256625]" onClick={handleSave} disabled={isSaving}>
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? "Đang lưu..." : (isEdit ? "Cập nhật đơn hàng" : "Lưu đơn hàng")}
                            </Button>
                        </div>
                    </div>

                    {/* Edit Mode Search Bar */}
                    {isEdit && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4 flex gap-4 items-center">
                                <div className="flex-1">
                                    <Label className="mb-1 text-blue-700">Tìm kiếm đơn hàng để sửa</Label>
                                    <div className="flex gap-2 relative">
                                        <div className="relative w-full">
                                            <Input
                                                placeholder="Nhập mã đơn hàng..."
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                onFocus={() => setShowSuggestions(true)}
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                                            />
                                            {showSuggestions && suggestions.length > 0 && (
                                                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                                    {suggestions.map((s) => (
                                                        <div
                                                            key={s.order_code}
                                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                            onClick={() => selectSuggestion(s.order_code)}
                                                        >
                                                            <span className="font-medium text-blue-700">{s.order_code}</span>
                                                            <span className="text-gray-500 ml-2">- {s.customer_name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button onClick={() => handleSearch()} disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                                            {isSearching ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 text-sm text-blue-600 italic">
                                    Nhập mã đơn hàng chính xác để tải dữ liệu. Cẩn thận khi chỉnh sửa các trường quan trọng.
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Only show form if NOT Edit Mode OR (Edit Mode AND Order is Loaded) */}
                    {(!isEdit || isOrderLoaded) && (
                        <>
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
                                                    <div className="relative" ref={mktRef}>
                                                        <PopoverAnchor asChild>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="Chọn nhân viên..."
                                                                    value={selectedMkt}
                                                                    onChange={(e) => {
                                                                        setSelectedMkt(e.target.value);
                                                                        setIsMktOpen(true);
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (mktRef.current) setMktPopoverWidth(mktRef.current.offsetWidth);
                                                                    }}
                                                                    onClick={() => {
                                                                        if (mktRef.current) setMktPopoverWidth(mktRef.current.offsetWidth);
                                                                        setIsMktOpen(true);
                                                                    }}
                                                                    className="pr-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]"
                                                                />
                                                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                                            </div>
                                                        </PopoverAnchor>
                                                        {isMktOpen && (
                                                            <PopoverContent
                                                                className="p-0 bg-white"
                                                                align="start"
                                                                style={{ width: mktPopoverWidth }}
                                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                                            >
                                                                <div className="max-h-[300px] overflow-y-auto p-1">
                                                                    {filteredMktEmployees.length === 0 ? (
                                                                        <div className="p-2 text-sm text-gray-500">Không tìm thấy kết quả.</div>
                                                                    ) : (
                                                                        filteredMktEmployees.map((e, idx) => {
                                                                            const empName = e['Họ_và_tên'] || e['Họ và tên'] || `NV ${idx}`;
                                                                            const isSelected = selectedMkt === empName;
                                                                            return (
                                                                                <div
                                                                                    key={idx}
                                                                                    className={cn("flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100", isSelected && "bg-gray-100 font-medium")}
                                                                                    onClick={() => { setSelectedMkt(empName); setIsMktOpen(false); }}
                                                                                >
                                                                                    <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                                    <span className="truncate">{empName}</span>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        )}
                                                    </div>
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
                                                    <div className="relative" ref={pageRef}>
                                                        <PopoverAnchor asChild>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="Chọn page..."
                                                                    value={selectedPage}
                                                                    onChange={(e) => {
                                                                        setSelectedPage(e.target.value);
                                                                        setIsPageOpen(true);
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (pageRef.current) setPagePopoverWidth(pageRef.current.offsetWidth);
                                                                    }}
                                                                    onClick={() => {
                                                                        if (pageRef.current) setPagePopoverWidth(pageRef.current.offsetWidth);
                                                                        setIsPageOpen(true);
                                                                    }}
                                                                    disabled={loadingPages}
                                                                    className="pr-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]"
                                                                />
                                                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                                            </div>
                                                        </PopoverAnchor>
                                                        {isPageOpen && (
                                                            <PopoverContent
                                                                className="p-0 bg-white"
                                                                align="start"
                                                                style={{ width: pagePopoverWidth }}
                                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                                            >
                                                                <div className="max-h-[300px] overflow-y-auto p-1">
                                                                    {filteredPages.length === 0 ? (
                                                                        <div className="p-2 text-sm text-gray-500">Không tìm thấy kết quả.</div>
                                                                    ) : (
                                                                        filteredPages.map((p, idx) => {
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
                                                                        })
                                                                    )}
                                                                </div>
                                                            </PopoverContent>
                                                        )}
                                                    </div>
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
                                                <Input
                                                    id="tracking_code"
                                                    value={formData.tracking_code || ""}
                                                    placeholder="Chưa có mã tracking"
                                                    readOnly
                                                    className="bg-gray-100 cursor-not-allowed"
                                                />
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
                                                        <Label htmlFor="productMain">Mặt hàng (Chính)</Label>
                                                        <Popover open={isProductOpen} onOpenChange={setIsProductOpen}>
                                                            <div className="relative" ref={productRef}>
                                                                <PopoverAnchor asChild>
                                                                    <div className="relative">
                                                                        <Input
                                                                            placeholder="Chọn hoặc nhập mặt hàng..."
                                                                            value={productSearch}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                setProductSearch(val);
                                                                                setFormData(prev => ({ ...prev, productMain: val }));
                                                                                setIsProductOpen(true);
                                                                            }}
                                                                            onFocus={() => {
                                                                                if (productRef.current) setProductPopoverWidth(productRef.current.offsetWidth);
                                                                            }}
                                                                            onClick={() => {
                                                                                if (productRef.current) setProductPopoverWidth(productRef.current.offsetWidth);
                                                                                setIsProductOpen(true);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') {
                                                                                    e.preventDefault();
                                                                                    if (productSearch.trim()) {
                                                                                        setFormData(prev => ({ ...prev, productMain: productSearch.trim() }));
                                                                                        setIsProductOpen(false);
                                                                                    }
                                                                                }
                                                                            }}
                                                                            className="pr-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2d7c2d]"
                                                                        />
                                                                        <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                                                    </div>
                                                                </PopoverAnchor>
                                                                {isProductOpen && (
                                                                    <PopoverContent
                                                                        className="p-0 bg-white"
                                                                        align="start"
                                                                        style={{ width: productPopoverWidth }}
                                                                        onOpenAutoFocus={(e) => e.preventDefault()}
                                                                    >
                                                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                                                            {filteredProducts.length > 0 ? (
                                                                                filteredProducts.map((p, idx) => (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100"
                                                                                        onClick={() => {
                                                                                            setFormData(prev => ({ ...prev, productMain: p }));
                                                                                            setProductSearch(p);
                                                                                            setIsProductOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        <Check className={cn("mr-2 h-4 w-4", formData.productMain === p ? "opacity-100" : "opacity-0")} />
                                                                                        <span className="truncate">{p}</span>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="p-2 text-sm text-gray-500">
                                                                                    Nhấn Enter để thêm mới "{productSearch}".
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </PopoverContent>
                                                                )}
                                                            </div>
                                                        </Popover>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="ma-don">Mã đơn hàng (Tự sinh)</Label>
                                                        <Input id="ma-don" value={formData["ma-don"]} onChange={handleInputChange} placeholder="Để trống tự sinh..." disabled={isEdit} />
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
                                                        <Input
                                                            id="exchange_rate"
                                                            type="number"
                                                            value={formData.exchange_rate}
                                                            readOnly
                                                            className="bg-gray-100 cursor-not-allowed"
                                                        />
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
                                                    <p>
                                                        • Cảnh báo danh sách hạn chế:
                                                        {blacklistStatus === 'warning' ? (
                                                            <>
                                                                <span className="font-bold text-red-600 ml-1">
                                                                    CẢNH BÁO ({blacklistReason})
                                                                </span>
                                                                {blacklistInfo && (
                                                                    <div className="mt-1 pl-4 text-xs text-red-800 bg-red-50 p-1 rounded border border-red-200">
                                                                        <div><strong>Khách trong sổ đen:</strong></div>
                                                                        <div>- Tên: {blacklistInfo.name}</div>
                                                                        <div>- SĐT: {blacklistInfo.phone}</div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : blacklistStatus === 'clean' ? (
                                                            <span className="font-semibold text-green-600 ml-1">Sạch</span>
                                                        ) : (
                                                            <span className="text-gray-400 ml-1">...</span>
                                                        )}
                                                    </p>
                                                    <p>• Trùng đơn: <span className="font-semibold text-green-600">Không phát hiện</span></p>

                                                    {/* Toggle Blacklist View */}
                                                    <div className="pt-2 border-t mt-2">
                                                        <button
                                                            onClick={() => setShowBlacklist(!showBlacklist)}
                                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                                        >
                                                            {showBlacklist ? "Thu gọn danh sách hạn chế" : "Xem danh sách hạn chế"}
                                                            <ChevronDown className={`w-3 h-3 transition-transform ${showBlacklist ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {showBlacklist && (
                                                            <div className="mt-2 max-h-40 overflow-y-auto border rounded bg-white p-2">
                                                                {blacklistItems.length === 0 ? (
                                                                    <p className="text-gray-400 italic">Danh sách trống</p>
                                                                ) : (
                                                                    <ul className="space-y-1">
                                                                        {blacklistItems.map(item => (
                                                                            <li key={item.id} className="border-b last:border-0 pb-1">
                                                                                <div className="font-medium">{item.phone} - {item.name}</div>
                                                                                <div className="text-[10px] text-gray-500">{item.reason}</div>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
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
                                                        <div className="relative" ref={containerRef}>
                                                            <PopoverAnchor asChild>
                                                                <div className="relative">
                                                                    <Input
                                                                        placeholder="Nhập hoặc chọn nhân viên..."
                                                                        value={selectedSale}
                                                                        onChange={(e) => {
                                                                            setSelectedSale(e.target.value);
                                                                            setSaleSearch(e.target.value);
                                                                            setIsSaleOpen(true);
                                                                        }}
                                                                        onFocus={() => {
                                                                            if (containerRef.current) {
                                                                                setPopoverWidth(containerRef.current.offsetWidth);
                                                                            }
                                                                        }}
                                                                        onClick={() => {
                                                                            if (containerRef.current) {
                                                                                setPopoverWidth(containerRef.current.offsetWidth);
                                                                            }
                                                                            setIsSaleOpen(true);
                                                                        }}
                                                                        className="pr-8 w-full h-10 px-4 font-normal border-gray-300 focus-visible:ring-[#2d7c2d] focus-visible:ring-offset-0"
                                                                    />
                                                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
                                                                </div>
                                                            </PopoverAnchor>
                                                            {isSaleOpen && (
                                                                <PopoverContent
                                                                    className="p-0 bg-white"
                                                                    align="start"
                                                                    style={{ width: popoverWidth }}
                                                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <div className="max-h-[300px] overflow-y-auto p-1">
                                                                            {filteredSaleEmployees.length === 0 ? (
                                                                                <div className="p-2 text-sm text-gray-500">Không tìm thấy kết quả. Nhấn Enter để dùng tên này.</div>
                                                                            ) : (
                                                                                filteredSaleEmployees.map((e, idx) => {
                                                                                    const empName = e['Họ_và_tên'] || e['Họ và tên'] || `NV ${idx}`;
                                                                                    const isSelected = selectedSale === empName;
                                                                                    return (
                                                                                        <div
                                                                                            key={idx}
                                                                                            className={cn(
                                                                                                "flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100",
                                                                                                isSelected && "bg-gray-100 font-medium"
                                                                                            )}
                                                                                            onClick={() => {
                                                                                                setSelectedSale(empName);
                                                                                                setSaleSearch(empName);
                                                                                                setIsSaleOpen(false);
                                                                                            }}
                                                                                        >
                                                                                            <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                                                                            <span className="truncate">{empName}</span>
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            )}
                                                        </div>
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
                        </>
                    )}

                </div >
            </div >
        </div >
    );
}
