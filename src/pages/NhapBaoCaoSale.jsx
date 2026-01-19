import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import './NhapBaoCaoSale.css';

export default function NhapBaoCaoSale() {
    const [currentUserInfo, setCurrentUserInfo] = useState({ ten: '', email: '', team: '', branch: '', position: '' });
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        shift: 'Sáng',
        product: '',
        market: 'VN',
        mess_count: 0,
        response_count: 0,
        order_count: 0,
        revenue_mess: 0
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Get user info from localStorage or fetch from DB if needed
        // Ideally we should get full info from a context or re-fetch based on email
        const ten = localStorage.getItem('username') || '';
        const email = localStorage.getItem('userEmail') || '';
        const team = localStorage.getItem('userTeam') || ''; // Assuming these exist or will be filled
        const branch = localStorage.getItem('userBranch') || '';
        const position = localStorage.getItem('userRole') || '';

        setCurrentUserInfo({ ten, email, team, branch, position });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('count') || name.includes('revenue') ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('sales_reports')
                .insert([
                    {
                        name: currentUserInfo.ten,
                        email: currentUserInfo.email,
                        team: currentUserInfo.team,
                        branch: currentUserInfo.branch,
                        position: currentUserInfo.position,
                        date: formData.date,
                        shift: formData.shift,
                        product: formData.product,
                        market: formData.market,
                        mess_count: formData.mess_count,
                        response_count: formData.response_count,
                        order_count: formData.order_count,
                        revenue_mess: formData.revenue_mess,
                        created_by: currentUserInfo.email
                    }
                ]);

            if (error) throw error;

            setMessage('Gửi báo cáo thành công!');
            // Reset form but keep some defaults
            setFormData(prev => ({
                ...prev,
                mess_count: 0,
                response_count: 0,
                order_count: 0,
                revenue_mess: 0
            }));
        } catch (error) {
            console.error('Error submitting report:', error);
            setMessage('Có lỗi xảy ra: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUserInfo.ten || !currentUserInfo.email) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                Đang tải thông tin người dùng... (Vui lòng đảm bảo bạn đã đăng nhập)
            </div>
        );
    }

    return (
        <div className="nhap-bao-cao-wrapper">
            <div className="form-container">
                <h2>Nhập Báo Cáo Sale (Thủ Công)</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Ngày báo cáo:</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ca làm việc:</label>
                            <select name="shift" value={formData.shift} onChange={handleChange}>
                                <option value="Sáng">Sáng</option>
                                <option value="Chiều">Chiều</option>
                                <option value="Tối">Tối</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Thị trường:</label>
                            <input
                                type="text"
                                name="market"
                                value={formData.market}
                                onChange={handleChange}
                                list="market-options"
                                placeholder="VN, TH, US..."
                            />
                            <datalist id="market-options">
                                <option value="VN" />
                                <option value="TH" />
                                <option value="US" />
                                <option value="Global" />
                            </datalist>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Sản phẩm:</label>
                        <input
                            type="text"
                            name="product"
                            value={formData.product}
                            onChange={handleChange}
                            placeholder="Nhập tên sản phẩm..."
                            required
                        />
                    </div>

                    <div className="metrics-section">
                        <h3>Số liệu</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số Mess:</label>
                                <input
                                    type="number"
                                    name="mess_count"
                                    value={formData.mess_count}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phản hồi:</label>
                                <input
                                    type="number"
                                    name="response_count"
                                    value={formData.response_count}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Số đơn (Mess):</label>
                                <input
                                    type="number"
                                    name="order_count"
                                    value={formData.order_count}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Doanh số (Mess):</label>
                                <input
                                    type="number"
                                    name="revenue_mess"
                                    value={formData.revenue_mess}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                    </button>

                    {message && <div className={`message ${message.includes('lỗi') ? 'error' : 'success'}`}>{message}</div>}
                </form>
            </div>
        </div>
    );
}
