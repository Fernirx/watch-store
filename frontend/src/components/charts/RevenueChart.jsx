import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dashboardService from '../../services/dashboardService';
import './Charts.css';

const RevenueChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(7);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRevenueTrend();
  }, [selectedDays]);

  const fetchRevenueTrend = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getRevenueTrend(selectedDays);

      if (response.success) {
        // Format data cho chart
        const formattedData = response.data.map(item => ({
          date: formatDate(item.date),
          revenue: item.revenue,
          orders: item.order_count,
        }));
        setData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching revenue trend:', err);
      setError('Không thể tải dữ liệu biểu đồ');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}/${month}`;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{payload[0].payload.date}</p>
          <p className="tooltip-revenue">
            Doanh thu: {formatCurrency(payload[0].value)}
          </p>
          <p className="tooltip-orders">
            Đơn hàng: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
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

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Xu hướng Doanh thu</h3>
        <div className="chart-filters">
          <button
            className={selectedDays === 7 ? 'active' : ''}
            onClick={() => setSelectedDays(7)}
          >
            7 ngày
          </button>
          <button
            className={selectedDays === 30 ? 'active' : ''}
            onClick={() => setSelectedDays(30)}
          >
            30 ngày
          </button>
          <button
            className={selectedDays === 90 ? 'active' : ''}
            onClick={() => setSelectedDays(90)}
          >
            90 ngày
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#8884d8"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#82ca9d"
            style={{ fontSize: '12px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="revenue"
            stroke="#8884d8"
            strokeWidth={2}
            name="Doanh thu (VNĐ)"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            stroke="#82ca9d"
            strokeWidth={2}
            name="Số đơn hàng"
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
