import {
  Activity,
  Award,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  DollarSign,
  Edit3,
  FileText,
  ListTodo,
  Megaphone,
  Menu,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { supabase } from "../supabase/config";

function Home() {
  const navigate = useNavigate();
  const { canView } = usePermissions();
  const [userRole, setUserRole] = useState("user");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "user";
    setUserRole(role);
  }, []);

  const allMenuItems = [
    {
      id: "home",
      label: "Menu chức năng",
      icon: <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center"><div className="grid grid-cols-2 gap-0.5 w-3 h-3"><div className="bg-white rounded-sm"></div><div className="bg-white rounded-sm"></div><div className="bg-white rounded-sm"></div><div className="bg-white rounded-sm"></div></div></div>,
      path: "/",
      active: location.pathname === "/" || location.pathname === "/trang-chu",
    },
    {
      id: "dashboard",
      label: "Dashboard điều hành",
      icon: <BarChart3 className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "dashboard-growth",
          label: "Dashboard Tăng trưởng",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          isExternal: true,
        },
        {
          id: "dashboard-kpi",
          label: "Dashboard KPI",
          icon: <Target className="w-4 h-4" />,
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          isExternal: true,
        },
        {
          id: "dashboard-okr",
          label: "Dashboard OKR",
          icon: <Award className="w-4 h-4" />,
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          isExternal: true,
        },
        {
          id: "dashboard-cancel",
          label: "Dashboard Đơn hủy",
          icon: <XCircle className="w-4 h-4" />,
          path: "#",
          disabled: true, // Custom flag if needed, or just path #
        },
        {
          id: "dashboard-ops",
          label: "Dashboard Vận hành",
          icon: <Activity className="w-4 h-4" />,
          path: "https://dashboard-psi-six-69.vercel.app/",
          isExternal: true,
        },
      ],
    },
    {
      id: "crm",
      label: "CSKH & CRM",
      icon: <Users className="w-5 h-5" />,
      path: "#",
      // permission: 'MODULE_CSKH', // Optional: Hide entire group if no child is visible
      subItems: [
        {
          id: "crm-list",
          label: "Danh sách đơn",
          icon: <Users className="w-4 h-4" />,
          path: "/quan-ly-cskh",
          permission: 'CSKH_LIST',
        },
        {
          id: "crm-paid",
          label: "Đơn đã thu tiền/cần CS",
          icon: <FileText className="w-4 h-4" />,
          path: "/don-chia-cskh",
          permission: 'CSKH_PAID',
        },
        {
          id: "crm-new-order",
          label: "Nhập đơn mới",
          icon: <PlusCircle className="w-4 h-4" />,
          path: "/nhap-don",
          permission: 'CSKH_NEW_ORDER',
        },
        {
          id: "crm-input-report",
          label: "Nhập báo cáo",
          icon: <Edit3 className="w-4 h-4" />,
          path: "/nhap-bao-cao-cskh",
          permission: 'CSKH_INPUT',
        },
        {
          id: "crm-view-report",
          label: "Xem báo cáo Sale",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-cskh",
          permission: 'CSKH_VIEW',
        },
        {
          id: "crm-history",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-cskh",
          permission: 'CSKH_HISTORY',
        },
      ],
    },
    {
      id: "sale",
      label: "Quản lý Sale & Order",
      icon: <ShoppingCart className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "order-list",
          label: "Danh sách đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/danh-sach-don",
          permission: 'SALE_ORDERS',
        },
        {
          id: "new-order",
          label: "Nhập đơn mới",
          icon: <PlusCircle className="w-4 h-4" />,
          path: "/nhap-don",
          permission: 'SALE_NEW_ORDER', // Note: reused path but permission specific to module
        },
        {
          id: "sale-report",
          label: "Sale nhập báo cáo",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "/sale-nhap-bao-cao",
          permission: 'SALE_INPUT',
        },
        {
          id: "view-sale-report",
          label: "Xem báo cáo Sale",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-sale",
          permission: 'SALE_VIEW',
        },
        {
          id: "sale-manual-report",
          label: "Danh sách báo cáo tay",
          icon: <Database className="w-4 h-4" />,
          path: "/danh-sach-bao-cao-tay",
          permission: 'SALE_MANUAL',
        },
        {
          id: "sale-history",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-sale-order",
          permission: 'SALE_HISTORY',
        },
      ],
    },
    {
      id: "delivery",
      label: "Quản lý giao hàng",
      icon: <Package className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "delivery-list",
          label: "Quản lý vận đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/van-don",
          permission: 'ORDERS_LIST',
        },
        {
          id: "delivery-report",
          label: "Báo cáo vận đơn",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/bao-cao-van-don",
          // permission: 'ORDERS_REPORT', // Not in map yet?
        },
        {
          id: "delivery-history",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-van-don",
          permission: 'ORDERS_HISTORY',
        },
        {
          id: "ffm",
          label: "FFM",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/ffm",
          permission: 'ORDERS_FFM',
        },
      ],
    },
    {
      id: "marketing",
      label: "Quản lý Marketing",
      icon: <Megaphone className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "mkt-input",
          label: "Nhập báo cáo",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "/bao-cao-marketing",
          permission: 'MKT_INPUT',
        },
        {
          id: "mkt-view",
          label: "Xem báo cáo MKT",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-mkt",
          permission: 'MKT_VIEW',
        },
        {
          id: "mkt-detail",
          label: "Danh sách đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/bao-cao-chi-tiet",
          permission: 'MKT_ORDERS',
        },
        {
          id: "mkt-pages",
          label: "Danh sách Page",
          icon: <ListTodo className="w-4 h-4" />,
          path: "/danh-sach-page",
          permission: 'MKT_PAGES',
        },
        {
          id: "mkt-manual",
          label: "Ds báo cáo tay",
          icon: <Database className="w-4 h-4" />,
          path: "/danh-sach-bao-cao-tay-mkt",
          permission: 'MKT_MANUAL',
        },
      ],
    },
    {
      id: "rnd",
      label: "Quản lý R&D",
      icon: <TrendingUp className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "rnd-input",
          label: "Nhập báo cáo",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "/bao-cao-rd",
          permission: 'RND_INPUT',
        },
        {
          id: "rnd-view",
          label: "Xem báo cáo R&D",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-rd",
          permission: 'RND_VIEW',
        },
        {
          id: "rnd-orders",
          label: "Danh sách đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/bao-cao-chi-tiet-rd",
          permission: 'RND_ORDERS',
        },
        {
          id: "rnd-pages",
          label: "Danh sách Page",
          icon: <ListTodo className="w-4 h-4" />,
          path: "/danh-sach-page-rd",
          permission: 'RND_PAGES',
        },
        {
          id: "rnd-manual",
          label: "Ds báo cáo tay",
          icon: <Database className="w-4 h-4" />,
          path: "/danh-sach-bao-cao-tay-rd",
          permission: 'RND_MANUAL',
        },
        {
          id: "rnd-new-order",
          label: "Nhập đơn mới",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "/nhap-don",
          permission: 'RND_NEW_ORDER',
        },
        {
          id: "rnd-history",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-sale-order",
          permission: 'RND_HISTORY',
        },
      ],
    },
    {
      id: "hr",
      label: "Quản lý nhân sự",
      icon: <Users className="w-5 h-5" />,
      path: "#",
      // adminOnly: true, // Removed to allow granular permissions
      subItems: [
        {
          id: "hr-management",
          label: "Bảng tin nội bộ",
          icon: <Users className="w-4 h-4" />,
          path: "/nhan-su",
          adminOnly: true,
        },
        {
          id: "hr-records",
          label: "Hồ sơ nhân sự",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/employees",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-recruitment",
          label: "Tuyển dụng",
          icon: <UserPlus className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/recruitment",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-salary",
          label: "Bậc lương & thăng tiến",
          icon: <DollarSign className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/salary",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-competency",
          label: "Năng lực nhân sự",
          icon: <Award className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/competency",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-kpi",
          label: "KPI",
          icon: <Target className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/kpi",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-tasks",
          label: "Giao việc",
          icon: <ListTodo className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/tasks",
          isExternal: true,
          adminOnly: true,
        },
        {
          id: "hr-attendance",
          label: "Chấm công & lương",
          icon: <CalendarCheck className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/attendance",
          isExternal: true,
          adminOnly: true,
        },
        // Removed Honor (Tôn vinh) item
      ],
    },
    {
      id: "finance",
      label: "Quản lý tài chính",
      icon: <DollarSign className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "finance-master",
          label: "Tài chính nền tảng",
          icon: <DollarSign className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/master-data",
          isExternal: true,
        },
        {
          id: "finance-revenue",
          label: "Quản lý thu",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/revenue",
          isExternal: true,
        },
        {
          id: "finance-cost",
          label: "Quản lý chi",
          icon: <DollarSign className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/cost",
          isExternal: true,
        },
        {
          id: "finance-ledger",
          label: "Sổ quỹ & Dòng tiền",
          icon: <DollarSign className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/ledger",
          isExternal: true,
        },
        {
          id: "finance-reports",
          label: "Báo cáo quản trị",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/management-reports",
          isExternal: true,
        },
        {
          id: "finance-f3",
          label: "Dữ liệu F3",
          icon: <Menu className="w-4 h-4" />,
          path: "https://lumi-finance-manager.vercel.app/#/f3-datasheet",
          isExternal: true,
        },
      ],
    },

    {
      id: "settings",
      label: "Cài đặt hệ thống",
      icon: <Settings className="w-5 h-5" />,
      path: "#",
      adminOnly: true,
      subItems: [
        {
          id: "admin-tools",
          label: "Công cụ quản trị & Chốt ca",
          icon: <Settings className="w-4 h-4" />,
          path: "/admin-tools",
        },
        {
          id: "change-logs",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-thay-doi",
        },
      ]
    },
  ];

  const allContentSections = [
    {
      title: "DASHBOARD ĐIỀU HÀNH",
      items: [
        {
          title: "Dashboard Tăng trưởng",
          icon: <TrendingUp className="w-8 h-8" />,
          color: "bg-orange-500",
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Dashboard KPI",
          icon: <Target className="w-8 h-8" />,
          color: "bg-blue-600",
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Dashboard OKR",
          icon: <Award className="w-8 h-8" />,
          color: "bg-indigo-600",
          path: "https://redirect.zalo.me/v3/verifyv2/pc?token=P6BqnjfrMGXk3lx3rnrRPsWD_gdV7LDYO0Ft-uiMM6Gt1FsbWXaDF3KEhlRQ45yqPWpm-pTZP0&continue=https%3A%2F%2Fdashboard-lumiquantri.vercel.app%2F",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Dashboard Đơn hủy",
          icon: <XCircle className="w-8 h-8" />,
          color: "bg-red-600",
          path: "#",
          status: "Sắp ra mắt",
        },
        {
          title: "Dashboard Vận hành",
          icon: <Activity className="w-8 h-8" />,
          color: "bg-teal-600",
          path: "https://dashboard-psi-six-69.vercel.app/",
          status: "Mở ứng dụng",
          isExternal: true,
        },
      ],
    },
    {
      title: "CSKH & CRM",
      items: [
        {
          title: "Danh sách đơn",
          icon: <Users className="w-8 h-8" />,
          color: "bg-blue-500",
          path: "/quan-ly-cskh",
          status: "Mở ứng dụng",
          permission: 'CSKH_LIST',
        },
        {
          title: "Đơn đã thu tiền/cần CS",
          icon: <FileText className="w-8 h-8" />,
          color: "bg-cyan-500",
          path: "/don-chia-cskh",
          status: "Mở ứng dụng",
          permission: 'CSKH_PAID',
        },
        {
          title: "Nhập đơn mới",
          icon: <PlusCircle className="w-8 h-8" />,
          color: "bg-green-500",
          path: "/nhap-don",
          status: "Mở ứng dụng",
          permission: 'CSKH_NEW_ORDER',
        },
        {
          title: "Nhập báo cáo",
          icon: <Edit3 className="w-8 h-8" />,
          color: "bg-blue-500",
          path: "/nhap-bao-cao-cskh",
          status: "Mở ứng dụng",
          permission: 'CSKH_INPUT',
        },
        {
          title: "Xem báo cáo CSKH",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-600",
          path: "/xem-bao-cao-cskh",
          status: "Mở ứng dụng",
          permission: 'CSKH_VIEW',
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/lich-su-cskh",
          status: "Mở ứng dụng",
          permission: 'CSKH_HISTORY',
        },
      ],
    },
    {
      title: "QUẢN LÝ SALE & ORDER",
      items: [
        {
          title: "Danh sách đơn",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-purple-500",
          path: "/danh-sach-don",
          status: "Mở ứng dụng",
          permission: 'SALE_ORDERS',
        },
        {
          title: "Nhập đơn mới",
          icon: <PlusCircle className="w-8 h-8" />,
          color: "bg-purple-500", // Matched existing file
          path: "/nhap-don",
          status: "Mở ứng dụng",
          permission: 'SALE_NEW_ORDER',
        },
        {
          title: "Sale nhập báo cáo",
          icon: <TrendingUp className="w-8 h-8" />,
          color: "bg-blue-600",
          path: "/sale-nhap-bao-cao",
          status: "Mở ứng dụng",
          permission: 'SALE_INPUT',
        },
        {
          title: "Xem báo cáo Sale",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-600",
          path: "/xem-bao-cao-sale",
          status: "Mở ứng dụng",
          permission: 'SALE_VIEW',
        },
        {
          title: "Ds báo cáo tay",
          icon: <Database className="w-8 h-8" />,
          color: "bg-cyan-600",
          path: "/danh-sach-bao-cao-tay",
          status: "Mở ứng dụng",
          permission: 'SALE_MANUAL',
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/lich-su-sale-order",
          status: "Mở ứng dụng",
          permission: 'SALE_HISTORY',
        },
      ],
    },
    {
      title: "QUẢN LÝ GIAO HÀNG",
      items: [
        {
          title: "Quản lý vận đơn",
          icon: <Package className="w-8 h-8" />,
          color: "bg-[#F37021]",
          path: "/van-don",
          status: "Mở ứng dụng",
          permission: 'ORDERS_LIST',
        },
        {
          title: "Báo cáo vận đơn",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-teal-500",
          path: "/bao-cao-van-don",
          status: "Mở ứng dụng",
          // permission: 'ORDERS_REPORT',
        },
        {
          title: "Chỉnh sửa đơn",
          icon: <Edit3 className="w-8 h-8" />,
          color: "bg-cyan-500",
          path: "/chinh-sua-don",
          status: "Mở ứng dụng",
        },
        {
          title: "FFM",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-indigo-500",
          path: "/ffm",
          status: "Mở ứng dụng",
          permission: 'ORDERS_FFM',
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-500", // Choosing a neutral color or distinct color
          path: "/lich-su-van-don",
          status: "Mở ứng dụng",
          permission: 'ORDERS_HISTORY',
        },
      ],
    },
    {
      title: "QUẢN LÝ MARKETING",
      items: [
        {
          title: "Nhập báo cáo",
          icon: <TrendingUp className="w-8 h-8" />,
          color: "bg-green-500",
          path: "/bao-cao-marketing",
          status: "Mở ứng dụng",
          permission: 'MKT_INPUT',
        },
        {
          title: "Xem báo cáo MKT",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-500",
          path: "/xem-bao-cao-mkt",
          status: "Mở ứng dụng",
          permission: 'MKT_VIEW',
        },
        {
          title: "Danh sách đơn",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-blue-500",
          path: "/bao-cao-chi-tiet",
          status: "Mở ứng dụng",
          permission: 'MKT_ORDERS',
        },
        {
          title: "Danh sách Page",
          icon: <ListTodo className="w-8 h-8" />,
          color: "bg-purple-600",
          path: "/danh-sach-page",
          status: "Mở ứng dụng",
          permission: 'MKT_PAGES',
        },
        {
          title: "Ds báo cáo tay",
          icon: <Database className="w-8 h-8" />,
          color: "bg-teal-600",
          path: "/danh-sach-bao-cao-tay-mkt",
          status: "Mở ứng dụng",
          permission: 'MKT_MANUAL',
        },
      ],
    },
    {
      title: "QUẢN LÝ R&D",
      items: [
        {
          title: "Nhập báo cáo",
          icon: <TrendingUp className="w-7 h-7" />,
          color: "bg-gradient-to-br from-pink-500 to-rose-600",
          path: "/bao-cao-rd",
          status: "Mở ứng dụng",
          permission: 'RND_INPUT',
        },
        {
          title: "Xem báo cáo R&D",
          icon: <BarChart3 className="w-7 h-7" />,
          color: "bg-gradient-to-br from-pink-500 to-rose-600",
          path: "/xem-bao-cao-rd",
          status: "Mở ứng dụng",
          permission: 'RND_VIEW',
        },
        {
          title: "Danh sách đơn",
          icon: <ClipboardList className="w-7 h-7" />,
          color: "bg-gradient-to-br from-purple-500 to-pink-600",
          path: "/bao-cao-chi-tiet-rd",
          status: "Mở ứng dụng",
          permission: 'RND_ORDERS',
        },
        {
          title: "Danh sách Page",
          icon: <ListTodo className="w-7 h-7" />,
          color: "bg-gradient-to-br from-orange-400 to-pink-500",
          path: "/danh-sach-page-rd",
          status: "Mở ứng dụng",
          permission: 'RND_PAGES',
        },
        {
          title: "Ds báo cáo tay",
          icon: <Database className="w-7 h-7" />,
          color: "bg-gradient-to-br from-teal-500 to-cyan-600",
          path: "/danh-sach-bao-cao-tay-rd",
          status: "Mở ứng dụng",
          permission: 'RND_MANUAL',
        },
        {
          title: "Nhập đơn mới",
          icon: <TrendingUp className="w-7 h-7" />,
          color: "bg-gradient-to-br from-green-500 to-emerald-600",
          path: "/nhap-don",
          status: "Mở ứng dụng",
          permission: 'RND_NEW_ORDER',
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-7 h-7" />,
          color: "bg-gray-600",
          path: "/lich-su-sale-order",
          status: "Mở ứng dụng",
          permission: 'RND_HISTORY',
        },
      ],
    },
    {
      title: "QUẢN LÝ NHÂN SỰ",
      items: [
        {
          title: "Bảng tin nội bộ",
          icon: <Users className="w-8 h-8" />,
          color: "bg-pink-500",
          path: "/nhan-su",
          status: "Mở ứng dụng",
          adminOnly: true,
        },
        {
          title: "Hồ sơ nhân sự",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/employees",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "Tuyển dụng",
          icon: <UserPlus className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/recruitment",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "Bậc lương & thăng tiến",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/salary",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "Năng lực nhân sự",
          icon: <Award className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/competency",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "KPI",
          icon: <Target className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/kpi",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "Giao việc",
          icon: <ListTodo className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/tasks",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        {
          title: "Chấm công & lương",
          icon: <CalendarCheck className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/attendance",
          status: "Mở ứng dụng",
          isExternal: true,
          adminOnly: true,
        },
        // Removed Honor card
      ],
    },
    {
      title: "QUẢN LÝ TÀI CHÍNH",
      items: [
        {
          title: "Quản lý tài chính",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-purple-500",
          path: "#",
          status: "Sắp ra mắt",
          comingSoon: true,
        },
        {
          title: "Quản lý tài chính nền tảng",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-teal-600",
          path: "https://lumi-finance-manager.vercel.app/#/master-data",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Quản lý thu",
          icon: <TrendingUp className="w-8 h-8" />,
          color: "bg-green-600",
          path: "https://lumi-finance-manager.vercel.app/#/revenue",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Quản lý chi",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-red-600",
          path: "https://lumi-finance-manager.vercel.app/#/cost",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Sổ quỹ & Dòng tiền",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-blue-600",
          path: "https://lumi-finance-manager.vercel.app/#/ledger",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Báo cáo tài chính quản trị",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-600",
          path: "https://lumi-finance-manager.vercel.app/#/management-reports",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Dữ liệu F3",
          icon: <Menu className="w-8 h-8" />,
          color: "bg-indigo-600",
          path: "https://lumi-finance-manager.vercel.app/#/f3-datasheet",
          status: "Mở ứng dụng",
          isExternal: true,
        },
      ],
    },

    {
      title: "CÀI ĐẶT HỆ THỐNG",
      items: [
        {
          title: "Công cụ quản trị",
          icon: <Settings className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/admin-tools",
          status: "Mở ứng dụng",
          adminOnly: true,
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/lich-su-thay-doi",
          status: "Mở ứng dụng",
          adminOnly: true,
        },

      ],
    },
  ];

  // --- RECURSIVE PERMISSION FILTERING ---

  // Helper to check if an item (or any of its children) is visible
  const isItemVisible = (item) => {
    // 1. Admin Bypass
    if (userRole === 'admin') return true;
    if (item.adminOnly) return false;

    // 2. Check explicit permission if present for leaf node
    if (item.permission) {
      return canView(item.permission);
    }

    // 3. If it has sub-items, check if AT LEAST ONE sub-item is visible
    if (item.subItems && item.subItems.length > 0) {
      // Filter subItems first to see what remains
      const visibleSubItems = item.subItems.filter(sub => isItemVisible(sub));
      return visibleSubItems.length > 0;
    }

    // 4. Default safe fallback: if no permission stricture defined, show it (or hide it? strict vs loose)
    // For this system, let's look at legacy behavior. Previous behavior was loose unless restricted.
    // However, for new RBAC, modules should be hidden if empty. 

    // For top-level items without permission (like 'home'), show them.
    // For items without children and without permission specified, show them unless adminOnly was checked above.
    return true;
  };

  // Filter Menu Items
  const filteredMenuItems = allMenuItems
    .map(item => {
      // Clone item to avoid mutating original
      const newItem = { ...item };
      if (newItem.subItems) {
        newItem.subItems = newItem.subItems.filter(sub => isItemVisible(sub));
      }
      return newItem;
    })
    .filter(item => {
      // Keep if visible AND (no children OR has visible children)
      if (item.subItems && item.subItems.length === 0) return false;
      return isItemVisible(item);
    });

  // Filter Dashboard Cards (Sections)
  const filteredSections = allContentSections
    .map(section => {
      // Filter items in section
      const visibleItems = section.items.filter(item => isItemVisible(item));
      return { ...section, items: visibleItems };
    })
    .filter(section => section.items.length > 0);

  // --- NEWS FEED LOGIC ---
  const [news, setNews] = useState([]);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'normal', image_url: '' });
  const [newsLoading, setNewsLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setNews(data);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('news-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('news-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleAddNews = async () => {
    if (!newPost.title) return alert("Vui lòng nhập tiêu đề");
    setNewsLoading(true);
    try {
      let finalImageUrl = newPost.image_url;

      // Upload image file if provided
      if (imageFile) {
        finalImageUrl = await handleImageUpload(imageFile);
      }

      const { error } = await supabase.from('news').insert([{
        ...newPost,
        image_url: finalImageUrl,
        created_by: userRole // simplified
      }]);
      if (error) throw error;
      alert("Đăng tin thành công!");
      setIsAddNewsOpen(false);
      setNewPost({ title: '', content: '', type: 'normal', image_url: '' });
      setImageFile(null);
      fetchNews();
    } catch (e) {
      alert("Lỗi đăng tin: " + e.message);
    } finally {
      setNewsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"
          } flex flex-col sticky top-0 h-screen`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-end">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>


        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-2">


          {filteredMenuItems.map((item) => {
            const isExpanded = expandedMenus[item.id];
            return (
              <div key={item.id}>
                <div
                  onClick={(e) => {
                    if (item.subItems) {
                      e.preventDefault(); // Prevent navigation for parent items with submenus
                      toggleMenu(item.id);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors cursor-pointer ${item.active
                    ? "bg-green-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <span className={item.active ? "text-white" : "text-gray-600"}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.subItems && (
                    isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )
                  )}
                </div>
                {!sidebarCollapsed && item.subItems && isExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.subItems.filter(subItem => {
                      if (subItem.adminOnly && userRole !== 'admin') return false;
                      if (subItem.permission && !canView(subItem.permission)) return false;
                      return true;
                    }).map((subItem) => (
                      subItem.isExternal ? (
                        <div
                          key={subItem.id}
                          onClick={() => navigate(`/external-view?url=${encodeURIComponent(subItem.path)}`)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </div>
                      ) : (
                        <Link
                          key={subItem.id}
                          to={subItem.path}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Bảng tin Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-red-600">Bảng tin</h1>
              <button onClick={() => setIsAddNewsOpen(true)} className="text-sm bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 flex items-center gap-1">
                <PlusCircle size={16} /> Đăng tin
              </button>
            </div>

            {/* News Add Modal */}
            {isAddNewsOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Đăng tin mới</h3>
                  <select
                    className="w-full border p-2 rounded mb-3"
                    value={newPost.type}
                    onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                  >
                    <option value="normal">Tin thường</option>
                    <option value="featured">Tin nổi bật (Có ảnh lớn)</option>
                  </select>

                  {newPost.type === 'featured' && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh tin</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full border p-2 rounded mb-2"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            setImageFile(file);
                            setNewPost({ ...newPost, image_url: '' });
                          }
                        }}
                      />
                      {imageFile && (
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-600">📎 {imageFile.name}</p>
                          <button
                            onClick={() => setImageFile(null)}
                            className="text-xs text-red-500 hover:underline mt-1"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">Hoặc dán link ảnh:</div>
                      <input
                        className="w-full border p-2 rounded mt-1"
                        placeholder="https://..."
                        value={newPost.image_url}
                        onChange={e => {
                          setNewPost({ ...newPost, image_url: e.target.value });
                          setImageFile(null);
                        }}
                        disabled={!!imageFile}
                      />

                      {/* Image Preview */}
                      {(imageFile || newPost.image_url) && (
                        <div className="mt-2 w-full h-32 bg-gray-100 rounded border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                          <img
                            src={imageFile ? URL.createObjectURL(imageFile) : newPost.image_url}
                            alt="Preview"
                            className="h-full w-full object-contain"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <input
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Tiêu đề tin..."
                    value={newPost.title}
                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                  />

                  <textarea
                    className="w-full border p-2 rounded mb-3"
                    placeholder="Nội dung tóm tắt..."
                    rows={3}
                    value={newPost.content}
                    onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddNewsOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                    <button onClick={handleAddNews} disabled={newsLoading} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                      {newsLoading ? 'Đang đăng...' : 'Đăng tin'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {news.length === 0 ? (
              <div className="bg-white p-6 rounded shadow text-center text-gray-500">Chưa có tin tức nào. Hãy bấm "Đăng tin" để tạo mới.</div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Find Featured News (First 'featured' or just first item) */}
                {(() => {
                  const featured = news.find(n => n.type === 'featured') || news[0];
                  const others = news.filter(n => n.id !== featured.id).slice(0, 5);

                  return (
                    <>
                      {/* Block 1: Featured Image + Title */}
                      <div className="flex-1 lg:w-1/3 flex flex-col">
                        <div className="bg-black/5 border border-red-200 rounded-lg h-64 flex items-center justify-center shadow-sm overflow-hidden group relative">
                          {featured.image_url ? (
                            <img
                              src={featured.image_url}
                              alt="Cover"
                              className="w-full h-full object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-100 w-full h-full">
                              <Megaphone size={32} className="mb-2 opacity-50" />
                              <span className="text-xs">(Chưa có ảnh)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Block 2: Detailed Content for Featured (or Second Item) */}
                      <div className="flex-1 lg:w-1/3 bg-white border border-red-200 rounded-lg p-4 h-64 shadow-sm relative overflow-y-auto">
                        <h3 className="text-lg font-bold text-red-600 mb-2 sticky top-0 bg-white pb-2 border-b border-red-100">Nội dung</h3>
                        <h3 className="font-bold text-base text-gray-800 mb-2">{featured.title}</h3>
                        <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                          {featured.content.length > 200 ? (
                            <>
                              {featured.content.slice(0, 200)}...
                              <Link to={`/news/${featured.id}`} className="text-red-500 hover:underline font-medium ml-1">
                                xem thêm
                              </Link>
                            </>
                          ) : (
                            featured.content
                          )}
                        </div>
                      </div>

                      {/* Block 3: Latest/Other News */}
                      <div className="flex-1 lg:w-1/3 bg-white border border-red-200 rounded-lg p-4 h-64 shadow-sm relative overflow-y-auto">
                        <h3 className="text-lg font-bold text-red-600 mb-4 sticky top-0 bg-white pb-2 border-b border-red-100">Tin tức khác</h3>
                        <ul className="space-y-3">
                          {others.map(item => (
                            <li key={item.id} className="border-b border-gray-50 pb-2 last:border-0 hover:bg-gray-50 p-2 rounded transition cursor-pointer">
                              <Link to={`/news/${item.id}`} className="block">
                                <div className="font-medium text-gray-800 text-sm mb-1 hover:text-red-600 transition-colors">
                                  {item.title}
                                </div>
                                {/* Optional: Add date back if user wants, but currently keeping it minimal as requested */}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  );
                })()}

              </div>
            )}
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center">
                <div className="grid grid-cols-2 gap-1 w-6 h-6">
                  <div className="bg-white rounded-sm"></div>
                  <div className="bg-white rounded-sm"></div>
                  <div className="bg-white rounded-sm"></div>
                  <div className="bg-white rounded-sm"></div>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Menu chức năng</h1>
            </div>
          </div>

          {/* Content Sections */}
          {filteredSections.map((section, sectionIndex) => (
            section.items.length > 0 && (
              <div key={sectionIndex} className="mb-8">
                <h2 className="text-sm font-bold text-gray-700 uppercase mb-4">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.items.map((item, itemIndex) => (
                    item.isExternal ? (
                      <div
                        key={itemIndex}
                        onClick={() => navigate(`/external-view?url=${encodeURIComponent(item.path)}`)}
                        className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200 cursor-pointer ${item.comingSoon ? "opacity-75" : ""
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`${item.color} text-white p-3.5 rounded-2xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
                              {item.title}
                            </h3>
                            <p
                              className={`text-xs font-medium ${item.comingSoon
                                ? "text-gray-400"
                                : "text-gray-500"
                                }`}
                            >
                              {item.status}
                            </p>
                          </div>
                          {item.comingSoon && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={itemIndex}
                        to={item.path}
                        className={`group relative bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200 ${item.comingSoon ? "opacity-75" : ""
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`${item.color} text-white p-3.5 rounded-2xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                          >
                            {item.icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
                              {item.title}
                            </h3>
                            <p
                              className={`text-xs font-medium ${item.comingSoon
                                ? "text-gray-400"
                                : "text-gray-500"
                                }`}
                            >
                              {item.status}
                            </p>
                          </div>
                          {item.comingSoon && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </Link>
                    )
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div >
  );
}

export default Home;
