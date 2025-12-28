# Quy Tắc Nghiệp Vụ - Watch Store

## Tổng Quan

Hệ thống kiểm tra và validate các quy tắc nghiệp vụ quan trọng trong thời gian thực (inline validation). Khi phát hiện bất thường:
- **Ghi log** tự động vào Laravel log
- **Gửi email** cho admin nếu là lỗi nghiêm trọng (CRITICAL)

**KHÔNG SỬ DỤNG**: Cron jobs, Scheduled tasks, hoặc Background jobs.

---

## Cơ Chế Validation

### BusinessValidator Helper
File: `backend/app/Helpers/BusinessValidator.php`

**Chức năng chính**:
- `alert()` - Ghi log và gửi email cảnh báo
- `checkNegativeStock()` - Kiểm tra stock âm
- `checkOrderPaymentConsistency()` - Kiểm tra nhất quán order-payment
- `checkCouponOverLimit()` - Kiểm tra coupon vượt giới hạn
- `logBusinessEvent()` - Ghi log sự kiện quan trọng

**Severity Levels**:
- **CRITICAL** 🔴: Gửi email + log (vấn đề nghiêm trọng cần xử lý ngay)
- **WARNING** 🟡: Chỉ log (cần theo dõi)
- **INFO** ℹ️: Chỉ log (sự kiện bình thường)

---

## Quy Tắc Nghiệp Vụ

### 1. Quản Lý Tồn Kho

**RULE**: Stock không được âm
- **Kiểm tra**: Sau mỗi lần giảm stock (export)
- **Location**: `OrderService::createOrder()` - line 157-163
- **Action**: Gửi email CRITICAL nếu stock < 0

### 2. Nhất Quán Order - Payment

**RULE 1**: Order CANCELLED nhưng đã PAID → Cần hoàn tiền
- **Severity**: CRITICAL
- **Action**: Email admin với thông tin order để xử lý refund

**RULE 2**: Order COMPLETED nhưng chưa PAID → Mất doanh thu
- **Severity**: CRITICAL
- **Action**: Email admin để verify thanh toán

**Kiểm tra tại**:
- `OrderService::updateOrderStatus()` - line 232-239
- `OrderService::updatePaymentStatus()` - line 263-270
- `OrderService::cancelOrder()` - line 332-339

### 3. Giới Hạn Coupon

**RULE**: Coupon usage_count không được vượt usage_limit
- **Kiểm tra**: Sau mỗi lần apply coupon
- **Location**: `CouponService::applyCoupon()` - line 182-191
- **Action**: Gửi email CRITICAL nếu vượt giới hạn

**Anti-fraud**: Track theo cả email VÀ phone để ngăn tái sử dụng

### 4. Validation Patterns

**Centralized Patterns**:
- Backend: `app/Rules/ValidationRules.php`
- Frontend: `frontend/src/utils/validation.js`

**Patterns được đồng bộ**:
- **Số điện thoại VN**: `0xxxxxxxxx` (10-11 chữ số)
- **Email**: Standard email format
- **Tên tiếng Việt**: Chữ cái VN + khoảng trắng + gạch ngang (2-100 ký tự)
- **Mã coupon**: Chữ in hoa + số (3-50 ký tự)
- **Mã sản phẩm**: Chữ cái + số + gạch ngang/gạch dưới (3-50 ký tự)

---

## Business Events Được Log

Các sự kiện quan trọng được ghi log tự động:

1. **ORDER_CREATED** - Đơn hàng mới
2. **ORDER_STATUS_UPDATED** - Cập nhật trạng thái đơn
3. **PAYMENT_STATUS_UPDATED** - Cập nhật trạng thái thanh toán
4. **ORDER_CANCELLED** - Hủy đơn hàng
5. **COUPON_APPLIED** - Áp dụng mã giảm giá
6. **COUPON_RESTORED** - Hoàn lại coupon khi hủy đơn

---

## Cấu Hình Email

Thêm vào `.env`:
```env
ADMIN_EMAIL=admin@watchstore.com
```

Template email: `backend/resources/views/emails/business_alert.blade.php`

---

## Xử Lý Khi Nhận Cảnh Báo

### CRITICAL: NEGATIVE_STOCK
1. Kiểm tra log để xem product_id nào bị âm
2. Kiểm tra StockTransaction để trace lịch sử
3. Điều chỉnh stock về đúng bằng tay (Import adjustment)

### CRITICAL: PAID_ORDER_CANCELLED
1. Kiểm tra order details trong email
2. Liên hệ khách hàng để xác nhận
3. Xử lý hoàn tiền qua payment gateway hoặc chuyển khoản

### CRITICAL: COMPLETED_ORDER_UNPAID
1. Kiểm tra payment_method (COD hay VNPay)
2. Nếu COD: Xác nhận đã thu tiền chưa
3. Nếu VNPay: Kiểm tra VNPay dashboard
4. Cập nhật payment_status thủ công nếu đã thanh toán

### CRITICAL: COUPON_OVER_LIMIT
1. Kiểm tra CouponUsage để xem ai đã dùng
2. Kiểm tra có fraud không (cùng email/phone nhiều lần)
3. Điều chỉnh usage_limit hoặc vô hiệu hóa coupon

---

## Database Constraints

### Products
- `stock_quantity`: >= 0
- `price`: > 0
- `code`: unique

### Orders
- `status`: PENDING, PROCESSING, COMPLETED, CANCELLED
- `payment_status`: pending, paid, failed, refunded
- `payment_method`: cod, vnpay
- **Constraint**: CANCELLED + paid = cần refund

### Coupons
- `usage_count` <= `usage_limit`
- `valid_from` <= `valid_until`
- Anti-reuse: Track by email OR phone

---

## Module Hiện Có

### Backend (Laravel)
- Products, Brands, Categories
- Orders, OrderItems
- Carts, CartItems
- Coupons, CouponUsages
- Reviews
- Users, Addresses
- StockTransactions
- Suppliers

### Frontend (React)
- Product catalog & detail
- Shopping cart
- Checkout (COD + VNPay)
- User authentication
- Order management
- Admin dashboard

---

**Lưu Ý**: Tất cả validation đều chạy inline (real-time), không cần setup cron hay scheduled tasks.
