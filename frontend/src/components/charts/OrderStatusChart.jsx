import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import './Charts.css';

const OrderStatusChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Màu sắc cho từng trạng thái
  const COLORS = {
    PENDING: '#FFA500',     // Orange
    PROCESSING: '#4169E1',  // Royal Blue
    COMPLETED: '#32CD32',   // Lime Green
    CANCELLED: '#DC143C',   // Crimson
  };

  // Tên hiển thị tiếng Việt
  const STATUS_LABELS = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  useEffect(() => {
    fetchOrderStatus();
  }, []);

  const fetchOrderStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getOrderStatusDistribution();

      if (response.success && response.data.length > 0) {
        // Format data cho chart
        const formattedData = response.data.map(item => ({
          name: STATUS_LABELS[item.status] || item.status,
          status: item.status,
          value: item.count,
          percentage: item.percentage,
        }));
        setData(formattedData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
      setError('Không thể tải dữ liệu biểu đồ');
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{item.name}</p>
          <p className="tooltip-value">Số lượng: {item.value}</p>
          <p className="tooltip-percentage">{item.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 5) return null; // Ẩn label nếu % quá nhỏ

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`${percentage.toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-loading">Đang tải biểu đồ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <div className="chart-error">{error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>Phân bổ Đơn hàng theo Trạng thái</h3>
        </div>
        <div className="chart-empty">Chưa có dữ liệu đơn hàng</div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Phân bổ Đơn hàng theo Trạng thái</h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.status] || '#999999'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '14px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="chart-stats">
        {data.map((item, index) => (
          <div key={index} className="stat-item">
            <div
              className="stat-color"
              style={{ backgroundColor: COLORS[item.status] }}
            ></div>
            <span className="stat-label">{item.name}:</span>
            <span className="stat-value">{item.value} đơn</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderStatusChart;
