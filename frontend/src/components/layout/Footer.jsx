import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TAWATCH</h3>
            <p>Cửa hàng đồng hồ cao cấp hàng đầu Việt Nam</p>
          </div>

          <div className="footer-section">
            <h4>Về Chúng Tôi</h4>
            <ul>
              <li><Link to="/about">Giới Thiệu</Link></li>
              <li><Link to="/contact">Liên Hệ</Link></li>
              <li><Link to="/stores">Hệ Thống Cửa Hàng</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Chính Sách</h4>
            <ul>
              <li><Link to="/privacy">Chính Sách Bảo Mật</Link></li>
              <li><Link to="/terms">Điều Khoản Sử Dụng</Link></li>
              <li><Link to="/return-policy">Chính Sách Đổi Trả</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Liên Hệ</h4>
            <ul>
              <li>Email: hungphu@watchstore.vn</li>
              <li>Hotline: 1900 xxxx xxxx</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 Hưng Phú Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
