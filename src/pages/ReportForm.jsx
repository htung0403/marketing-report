import { useState, useEffect, useMemo } from 'react';
import { database } from '../firebase/config';
import { ref, push, get, set } from 'firebase/database';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useReportData } from '../hooks/useReportData';

function ReportForm() {
  // Changed to array to support multiple rows
  const [formRows, setFormRows] = useState([{
    name: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    shift: '',
    product: '',
    market: '',
    tkqc: '',
    cpqc: '',
    mess_cmt: '',
    orders: '',
    revenue: '',
    team: '',
    id_ns: '',
    branch: ''
  }]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedRows, setExpandedRows] = useState(new Set([0]));

  // Read current user context from localStorage to pass into useReportData
  const userRole = localStorage.getItem('userRole') || '';
  const userTeam = localStorage.getItem('userTeam') || '';
  const userEmail = localStorage.getItem('userEmail') || '';

  const { masterData = [], firebaseReports = [], loading: reportsLoading = false } = useReportData(userRole, userTeam, userEmail);

  // derive product and market options from report data (masterData + firebaseReports)
  const productOptions = useMemo(() => {
    const s = new Set();
    masterData.forEach(r => r.product && s.add(String(r.product).trim()));
    firebaseReports.forEach(r => r.product && s.add(String(r.product).trim()));
    return Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [masterData, firebaseReports]);

  const marketOptions = useMemo(() => {
    const s = new Set();
    masterData.forEach(r => r.market && s.add(String(r.market).trim()));
    firebaseReports.forEach(r => r.market && s.add(String(r.market).trim()));
    return Array.from(s).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [masterData, firebaseReports]);

  // Load current user info (name, email, team, id) from localStorage on mount
  useEffect(() => {
    const name = localStorage.getItem('username') || '';
    const email = localStorage.getItem('userEmail') || '';
    const team = localStorage.getItem('userTeam') || '';
    const id_ns = localStorage.getItem('userId') || '';

    setFormRows((prev) => {
      if (!prev || prev.length === 0) return [{ name, email, date: new Date().toISOString().split('T')[0], shift: '', product: '', market: '', tkqc: '', cpqc: '', mess_cmt: '', orders: '', revenue: '', team, id_ns, branch: '' }];
      const newRows = [...prev];
      newRows[0] = { ...newRows[0], name, email, team, id_ns };
      return newRows;
    });
  }, []);

  const formatNumberInput = (value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    return cleanValue ? new Intl.NumberFormat('de-DE').format(cleanValue) : '';
  };

  const cleanNumberInput = (value) => {
    return value.replace(/[^0-9]/g, '');
  };

  const handleChange = (e, rowIndex) => {
    const { name, value } = e.target;
    const numberFields = ['cpqc', 'mess_cmt', 'orders', 'revenue'];
    
    const newRows = [...formRows];
    if (numberFields.includes(name)) {
      const formattedValue = formatNumberInput(value);
      newRows[rowIndex] = { ...newRows[rowIndex], [name]: formattedValue };
    } else {
      newRows[rowIndex] = { ...newRows[rowIndex], [name]: value };
    }
    setFormRows(newRows);
    
    const errorKey = `${rowIndex}-${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    formRows.forEach((row, index) => {
      if (!row.name.trim()) newErrors[`${index}-name`] = 'Required';
      if (!row.email.trim()) newErrors[`${index}-email`] = 'Required';
      if (!row.date) newErrors[`${index}-date`] = 'Required';
      if (!row.shift) newErrors[`${index}-shift`] = 'Required';
      if (!row.product.trim()) newErrors[`${index}-product`] = 'Required';
      if (!row.market.trim()) newErrors[`${index}-market`] = 'Required';
      if (!row.tkqc.trim()) newErrors[`${index}-tkqc`] = 'Required';
      if (!row.cpqc) newErrors[`${index}-cpqc`] = 'Required';
      if (!row.mess_cmt) newErrors[`${index}-mess_cmt`] = 'Required';
      if (!row.orders) newErrors[`${index}-orders`] = 'Required';
      if (!row.revenue) newErrors[`${index}-revenue`] = 'Required';
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
      const reportsRef = ref(database, 'reports');

      // Prepare pushes for all rows
      const pushes = formRows.map((row) => {
        const payload = {
          name: row.name || localStorage.getItem('username') || '',
          email: row.email || localStorage.getItem('userEmail') || '',
          date: row.date || new Date().toISOString().split('T')[0],
          shift: row.shift || '',
          product: row.product || '',
          market: row.market || '',
          tkqc: row.tkqc || '',
          cpqc: Number(cleanNumberInput(String(row.cpqc || ''))) || 0,
          mess_cmt: Number(cleanNumberInput(String(row.mess_cmt || ''))) || 0,
          orders: Number(cleanNumberInput(String(row.orders || ''))) || 0,
          revenue: Number(cleanNumberInput(String(row.revenue || ''))) || 0,
          team: row.team || localStorage.getItem('userTeam') || '',
          id_ns: row.id_ns || localStorage.getItem('userId') || '',
          branch: row.branch || '',
          // store ISO timestamp string so DB records have consistent datetime format
          timestamp: new Date().toISOString(),
          // default status for new reports
          status: row.status || 'pending'
        };

        const newRef = push(reportsRef);
        return set(newRef, payload);
      });

      // Wait until all pushes finish
      await Promise.all(pushes);

      toast.success(`Đã lưu thành công ${formRows.length} báo cáo!`, { position: 'top-right', autoClose: 3000 });

      // Reset form to a single empty row but keep current user info populated
      const name = localStorage.getItem('username') || '';
      const email = localStorage.getItem('userEmail') || '';
      const team = localStorage.getItem('userTeam') || '';
      const id_ns = localStorage.getItem('userId') || '';

      const emptyRow = {
        name,
        email,
        date: new Date().toISOString().split('T')[0],
        shift: '',
        product: '',
        market: '',
        tkqc: '',
        cpqc: '',
        mess_cmt: '',
        orders: '',
        revenue: '',
        team,
        id_ns,
        branch: ''
      };

      setFormRows([emptyRow]);
      setErrors({});
      setExpandedRows(new Set([0]));
    } catch (err) {
      console.error('Error saving reports to Firebase:', err);
      toast.error('Lỗi khi lưu báo cáo: ' + (err.message || ''), { position: 'top-right', autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    // Create a cleared new row. Prefill reporter info from localStorage so user doesn't retype it.
    const name = localStorage.getItem('username') || '';
    const email = localStorage.getItem('userEmail') || '';
    const team = localStorage.getItem('userTeam') || '';
    const id_ns = localStorage.getItem('userId') || '';

    const newRow = {
      name,
      email,
      date: new Date().toISOString().split('T')[0],
      shift: '',
      product: '',
      market: '',
      tkqc: '',
      cpqc: '',
      mess_cmt: '',
      orders: '',
      revenue: '',
      team,
      id_ns,
      branch: ''
    };

    // append without mutating existing rows
    setFormRows(prev => [...prev, newRow]);

    // expand the newly added row (its index will be the previous length)
    const newExpanded = new Set(expandedRows);
    newExpanded.add(formRows.length);
    setExpandedRows(newExpanded);
  };

  const deleteRow = (rowIndex) => {
    const newRows = formRows.filter((_, index) => index !== rowIndex);
    setFormRows(newRows);
    const newExpanded = new Set(expandedRows);
    newExpanded.delete(rowIndex);
    setExpandedRows(newExpanded);
  };

  const toggleRow = (rowIndex) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Modern Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <img
                src="https://www.appsheet.com/template/gettablefileurl?appName=Appsheet-325045268&tableName=Kho%20%E1%BA%A3nh&fileName=Kho%20%E1%BA%A3nh_Images%2Ff930e667.%E1%BA%A2nh.025539.jpg"
                alt="Logo"
                className="h-16 w-16 rounded-full shadow-lg mr-4"
              />
              <div>
                <h1 className="text-3xl font-bold bg-green-500 bg-clip-text text-transparent">
                  Báo Cáo Marketing
                </h1>
                <p className="text-gray-500 mt-1">LumiGlobal Report System</p>
              </div>
            </div>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm báo cáo
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {formRows.map((row, rowIndex) => {
            const isExpanded = expandedRows.has(rowIndex);
            const hasErrors = Object.keys(errors).some(key => key.startsWith(`${rowIndex}-`));
            
            return (
              <div key={rowIndex} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
                {/* Card Header */}
                <div 
                  className={`p-6 cursor-pointer select-none transition-colors ${hasErrors ? 'bg-red-50' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}
                  onClick={() => toggleRow(rowIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${hasErrors ? 'bg-red-500' : 'bg-gradient-to-br from-green-500 to-green-300'}`}>
                        {rowIndex + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {row.product || 'Báo cáo chưa có sản phẩm'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {row.market || 'Chưa chọn thị trường'} • {row.shift || 'Chưa chọn ca'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasErrors && (
                        <span className="text-xs font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full">
                          Thiếu thông tin
                        </span>
                      )}
                      {formRows.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRow(rowIndex);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <svg 
                        className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                {isExpanded && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* User Info Section */}
                      <div className="lg:col-span-3">
                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Thông tin người báo cáo
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tên</label>
                            <input
                              type="text"
                              name="name"
                              value={row.name}
                              disabled
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={row.email}
                              disabled
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày <span className="text-red-500">*</span></label>
                            <input
                              type="date"
                              name="date"
                              value={row.date}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-date`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Campaign Info */}
                      <div className="lg:col-span-3">
                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Thông tin chiến dịch
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ca <span className="text-red-500">*</span></label>
                            <select
                              name="shift"
                              value={row.shift}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-shift`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Chọn ca</option>
                              <option value="Hết ca">Hết ca</option>
                              <option value="Giữa ca">Giữa ca</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sản phẩm <span className="text-red-500">*</span></label>
                            <select
                              name="product"
                              value={row.product}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-product`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Chọn sản phẩm</option>
                              {reportsLoading ? (
                                <option value="" disabled>Đang tải dữ liệu sản phẩm...</option>
                              ) : productOptions.length === 0 ? (
                                <option value="">Không có dữ liệu sản phẩm</option>
                              ) : (
                                productOptions.map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thị trường <span className="text-red-500">*</span></label>
                            <select
                              name="market"
                              value={row.market}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-market`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                            >
                              <option value="">Chọn thị trường</option>
                              {reportsLoading ? (
                                <option value="" disabled>Đang tải dữ liệu thị trường...</option>
                              ) : marketOptions.length === 0 ? (
                                <option value="">Không có dữ liệu thị trường</option>
                              ) : (
                                marketOptions.map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))
                              )}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">TKQC <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              name="tkqc"
                              value={row.tkqc}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-tkqc`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                              placeholder="Nhập TKQC"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="lg:col-span-3">
                        <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Chỉ số hiệu suất
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CPQC <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="cpqc"
                              value={row.cpqc}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-cpqc`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mess/Cmt <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="mess_cmt"
                              value={row.mess_cmt}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-mess_cmt`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Số đơn <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="orders"
                              value={row.orders}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-orders`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Doanh số <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              inputMode="numeric"
                              name="revenue"
                              value={row.revenue}
                              onChange={(e) => handleChange(e, rowIndex)}
                              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors[`${rowIndex}-revenue`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-lg text-white shadow-xl transition-all duration-300 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-500 hover:shadow-2xl hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Gửi {formRows.length} báo cáo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportForm;