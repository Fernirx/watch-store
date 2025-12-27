import { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
  };

  const handleBack = () => {
    setSelectedNotification(null);
  };

  const getTypeBadge = (type) => {
    const typeMap = {
      SYSTEM: { label: 'Hệ thống', class: 'type-system' },
      PROMOTION: { label: 'Khuyến mãi', class: 'type-promotion' },
      MAINTENANCE: { label: 'Bảo trì', class: 'type-maintenance' },
      FEATURE: { label: 'Tính năng mới', class: 'type-feature' },
    };
    const typeInfo = typeMap[type] || { label: type, class: 'type-default' };
    return <span className={`notification-type-badge ${typeInfo.class}`}>{typeInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="notifications-page">
        <div className="container">
          <div className="loading">Đang tải thông báo...</div>
        </div>
      </div>
    );
  }

  // Detail view
  if (selectedNotification) {
    return (
      <div className="notifications-page">
        <div className="container">
          <button onClick={handleBack} className="btn-back">
            ← Quay lại
          </button>

          <div className="notification-detail">
            <div className="notification-detail-header">
              {getTypeBadge(selectedNotification.type)}
              <h1>{selectedNotification.title}</h1>
              <p className="notification-date">
                {new Date(selectedNotification.created_at).toLocaleString('vi-VN')}
              </p>
            </div>

            {selectedNotification.image_url && (
              <div className="notification-image">
                <img src={selectedNotification.image_url} alt={selectedNotification.title} />
              </div>
            )}

            <div className="notification-content">
              <div dangerouslySetInnerHTML={{ __html: selectedNotification.content.replace(/\n/g, '<br>') }} />
            </div>

            {selectedNotification.link_url && (
              <div className="notification-action">
                <a href={selectedNotification.link_url} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  Xem chi tiết →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="notifications-page">
      <div className="container">
        <h1>Thông Báo</h1>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h3>Chưa có thông báo nào</h3>
            <p>Các thông báo mới nhất sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="notification-card"
                onClick={() => handleNotificationClick(notification)}
              >
                {notification.image_url && (
                  <div className="notification-thumbnail">
                    <img src={notification.image_url} alt={notification.title} />
                  </div>
                )}
                <div className="notification-body">
                  <div className="notification-header">
                    {getTypeBadge(notification.type)}
                    <span className="notification-date">
                      {new Date(notification.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="notification-title">{notification.title}</h3>
                  <p className="notification-preview">
                    {notification.content.substring(0, 150)}
                    {notification.content.length > 150 && '...'}
                  </p>
                </div>
                <div className="notification-arrow">→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
