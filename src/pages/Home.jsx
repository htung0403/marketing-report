import {
  Award,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Edit3,
  FileText,
  ListTodo,
  Medal,
  Megaphone,
  Menu,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  Target,
  TrendingUp,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";

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
      ],
    },
    {
      id: "crm",
      label: "CSKH & CRM",
      icon: <Users className="w-5 h-5" />,
      path: "#",
      subItems: [
        {
          id: "crm-list",
          label: "Danh sách đơn",
          icon: <Users className="w-4 h-4" />,
          path: "/quan-ly-cskh",
        },
        {
          id: "crm-paid",
          label: "Đơn đã thu tiền/cần CS",
          icon: <FileText className="w-4 h-4" />,
          path: "/don-chia-cskh",
        },
        {
          id: "crm-new-order",
          label: "Nhập đơn mới",
          icon: <PlusCircle className="w-4 h-4" />,
          path: "/nhap-don",
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
        },

        {
          id: "new-order",
          label: "Nhập đơn mới",
          icon: <PlusCircle className="w-4 h-4" />,
          path: "/nhap-don",
        },
        {
          id: "sale-report",
          label: "Sale nhập báo cáo",
          icon: <TrendingUp className="w-4 h-4" />,
          path: "/sale-nhap-bao-cao",
        },
        {
          id: "view-sale-report",
          label: "Xem báo cáo Sale",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-sale",
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
        },
        {
          id: "delivery-report",
          label: "Báo cáo vận đơn",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/bao-cao-van-don",
        },
        {
          id: "delivery-history",
          label: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/lich-su-van-don",
        },
        {
          id: "edit-order",
          label: "Chỉnh sửa đơn",
          icon: <Edit3 className="w-4 h-4" />,
          path: "#",
        },
        {
          id: "ffm",
          label: "FFM",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/ffm",
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
        },
        {
          id: "mkt-view",
          label: "Xem báo cáo MKT",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-mkt",
        },
        {
          id: "mkt-detail",
          label: "Danh sách đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/bao-cao-chi-tiet",
        },
        {
          id: "mkt-pages",
          label: "Danh sách Page",
          icon: <ListTodo className="w-4 h-4" />,
          path: "/danh-sach-page",
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
        },
        {
          id: "rnd-view",
          label: "Xem báo cáo R&D",
          icon: <BarChart3 className="w-4 h-4" />,
          path: "/xem-bao-cao-rd",
        },
        {
          id: "rnd-detail",
          label: "Danh sách đơn",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "/bao-cao-chi-tiet-rd",
        },
        {
          id: "rnd-pages",
          label: "Danh sách Page",
          icon: <ListTodo className="w-4 h-4" />,
          path: "/danh-sach-page-rd",
        },
      ],
    },
    {
      id: "hr",
      label: "Quản lý nhân sự",
      icon: <Users className="w-5 h-5" />,
      path: "#",
      adminOnly: true,
      subItems: [
        {
          id: "hr-management",
          label: "Quản lý nhân sự",
          icon: <Users className="w-4 h-4" />,
          path: "/nhan-su",
        },
        {
          id: "hr-records",
          label: "Hồ sơ nhân sự",
          icon: <ClipboardList className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/employees",
          isExternal: true,
        },
        {
          id: "hr-recruitment",
          label: "Tuyển dụng",
          icon: <UserPlus className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/recruitment",
          isExternal: true,
        },
        {
          id: "hr-salary",
          label: "Bậc lương & thăng tiến",
          icon: <DollarSign className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/salary",
          isExternal: true,
        },
        {
          id: "hr-competency",
          label: "Năng lực nhân sự",
          icon: <Award className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/competency",
          isExternal: true,
        },
        {
          id: "hr-kpi",
          label: "KPI",
          icon: <Target className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/kpi",
          isExternal: true,
        },
        {
          id: "hr-tasks",
          label: "Giao việc",
          icon: <ListTodo className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/tasks",
          isExternal: true,
        },
        {
          id: "hr-attendance",
          label: "Chấm công & lương",
          icon: <CalendarCheck className="w-4 h-4" />,
          path: "https://hr-management-self.vercel.app/attendance",
          isExternal: true,
        },

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
        },
        {
          title: "Đơn đã thu tiền/cần CS",
          icon: <FileText className="w-8 h-8" />,
          color: "bg-cyan-500",
          path: "/don-chia-cskh",
          status: "Mở ứng dụng",
        },
        {
          title: "Nhập đơn mới",
          icon: <PlusCircle className="w-8 h-8" />,
          color: "bg-green-500",
          path: "/nhap-don",
          status: "Mở ứng dụng",
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/lich-su-cskh",
          status: "Mở ứng dụng",
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
        },

        {
          title: "Nhập đơn mới",
          icon: <PlusCircle className="w-8 h-8" />,
          color: "bg-purple-500",
          path: "/nhap-don",
          status: "Mở ứng dụng",
        },
        {
          title: "Sale nhập báo cáo",
          icon: <TrendingUp className="w-8 h-8" />,
          color: "bg-blue-600",
          path: "/sale-nhap-bao-cao",
          status: "Mở ứng dụng",
        },
        {
          title: "Xem báo cáo Sale",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-600",
          path: "/xem-bao-cao-sale",
          status: "Mở ứng dụng",
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-600",
          path: "/lich-su-sale-order",
          status: "Mở ứng dụng",
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
        },
        {
          title: "Báo cáo vận đơn",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-teal-500",
          path: "/bao-cao-van-don",
          status: "Mở ứng dụng",
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
        },
        {
          title: "Lịch sử thay đổi",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-gray-500", // Choosing a neutral color or distinct color
          path: "/lich-su-van-don",
          status: "Mở ứng dụng",
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
        },
        {
          title: "Xem báo cáo MKT",
          icon: <BarChart3 className="w-8 h-8" />,
          color: "bg-orange-500",
          path: "/xem-bao-cao-mkt",
          status: "Mở ứng dụng",
        },
        {
          title: "Danh sách đơn",
          icon: <ClipboardList className="w-8 h-8" />,
          color: "bg-blue-500",
          path: "/bao-cao-chi-tiet",
          status: "Mở ứng dụng",
        },
        {
          title: "Danh sách Page",
          icon: <ListTodo className="w-8 h-8" />,
          color: "bg-purple-600",
          path: "/danh-sach-page",
          status: "Mở ứng dụng",
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
        },
        {
          title: "Xem báo cáo R&D",
          icon: <BarChart3 className="w-7 h-7" />,
          color: "bg-gradient-to-br from-pink-500 to-rose-600",
          path: "/xem-bao-cao-rd",
          status: "Mở ứng dụng",
        },
        {
          title: "Danh sách đơn",
          icon: <ClipboardList className="w-7 h-7" />,
          color: "bg-gradient-to-br from-purple-500 to-pink-600",
          path: "/bao-cao-chi-tiet-rd",
          status: "Mở ứng dụng",
        },
        {
          title: "Danh sách Page",
          icon: <ListTodo className="w-7 h-7" />,
          color: "bg-gradient-to-br from-orange-400 to-pink-500",
          path: "/danh-sach-page-rd",
          status: "Mở ứng dụng",
        },
      ],
    },
    {
      title: "QUẢN LÝ NHÂN SỰ",
      items: [
        {
          title: "Quản lý nhân sự",
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
        },
        {
          title: "Tuyển dụng",
          icon: <UserPlus className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/recruitment",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Bậc lương & thăng tiến",
          icon: <DollarSign className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/salary",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Năng lực nhân sự",
          icon: <Award className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/competency",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "KPI",
          icon: <Target className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/kpi",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Giao việc",
          icon: <ListTodo className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/tasks",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Chấm công & lương",
          icon: <CalendarCheck className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/attendance",
          status: "Mở ứng dụng",
          isExternal: true,
        },
        {
          title: "Tôn vinh",
          icon: <Medal className="w-8 h-8" />,
          color: "bg-pink-600",
          path: "https://hr-management-self.vercel.app/honor",
          status: "Mở ứng dụng",
          isExternal: true,
        },



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

  const RBAC_MAP = {
    'rnd': 'MODULE_RND',
    'sale': 'MODULE_SALE',
    'delivery': 'MODULE_ORDERS',
    'crm': 'MODULE_CSKH',
    'settings': 'MODULE_ADMIN',
    'marketing': 'MODULE_MKT',
    'hr': 'MODULE_ADMIN',
    'finance': 'MODULE_ADMIN'
  };

  const isVisible = (id) => {
    const resCode = RBAC_MAP[id];
    if (!resCode) return true;
    return canView(resCode);
  };

  const filteredMenuItems = allMenuItems.filter(
    (item) => isVisible(item.id) && (!item.adminOnly || userRole === "admin")
  );

  const SECTION_RBAC_MAP = {
    "QUẢN LÝ R&D": 'MODULE_RND',
    "QUẢN LÝ MARKETING": 'MODULE_MKT',
    "QUẢN LÝ SALE & ORDER": 'MODULE_SALE',
    "QUẢN LÝ GIAO HÀNG": 'MODULE_ORDERS',
    "CSKH & CRM": 'MODULE_CSKH',
    "CÀI ĐẶT HỆ THỐNG": 'MODULE_ADMIN',
    "QUẢN LÝ TÀI CHÍNH": 'MODULE_ADMIN',
    "QUẢN LÝ NHÂN SỰ": 'MODULE_ADMIN'
  };

  const filteredSections = allContentSections.filter(section => {
    const resCode = SECTION_RBAC_MAP[section.title];
    if (!resCode) return true;
    return canView(resCode);
  }).map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.adminOnly || userRole === "admin"
    ),
  }));

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
                    {item.subItems.map((subItem) => (
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
