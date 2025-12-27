<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác nhận đơn hàng</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
        }
        .order-info {
            background-color: white;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
        }
        .order-items {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .order-items th, .order-items td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .order-items th {
            background-color: #f5f5f5;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
            color: #4CAF50;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 0 0 5px 5px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Đơn hàng đã được xác nhận</h1>
    </div>

    <div class="content">
        <p>Xin chào <strong>{{ $order->customer_name }}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại <strong>Watch Store</strong>!</p>

        <div class="order-info">
            <h3>Thông tin đơn hàng</h3>
            <p><strong>Mã đơn hàng:</strong> {{ $order->order_number }}</p>
            <p><strong>Ngày đặt:</strong> {{ $order->created_at->format('d/m/Y H:i') }}</p>
            <p><strong>Trạng thái:</strong> Chờ xử lý</p>
            <p><strong>Phương thức thanh toán:</strong>
                @if($order->payment_method === 'cod')
                    Thanh toán khi nhận hàng (COD)
                @else
                    VNPay
                @endif
            </p>
        </div>

        <div class="order-info">
            <h3>Thông tin giao hàng</h3>
            <p><strong>Người nhận:</strong> {{ $order->customer_name }}</p>
            <p><strong>Email:</strong> {{ $order->customer_email }}</p>
            <p><strong>Số điện thoại:</strong> {{ $order->shipping_phone }}</p>
            <p><strong>Địa chỉ:</strong> {{ $order->shipping_address }}</p>
            @if($order->notes)
            <p><strong>Ghi chú:</strong> {{ $order->notes }}</p>
            @endif
        </div>

        <h3>Chi tiết sản phẩm</h3>
        <table class="order-items">
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format($item->price, 0, ',', '.') }}₫</td>
                    <td>{{ number_format($item->subtotal, 0, ',', '.') }}₫</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Tạm tính:</strong></td>
                    <td>{{ number_format($order->subtotal, 0, ',', '.') }}₫</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;"><strong>Phí vận chuyển:</strong></td>
                    <td>{{ number_format($order->shipping_fee, 0, ',', '.') }}₫</td>
                </tr>
                <tr>
                    <td colspan="3" style="text-align: right;" class="total">TỔNG CỘNG:</td>
                    <td class="total">{{ number_format($order->total, 0, ',', '.') }}₫</td>
                </tr>
            </tfoot>
        </table>


        <p style="margin-top: 20px;">Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất. Bạn có thể theo dõi trạng thái đơn hàng qua email này.</p>

        <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
    </div>

    <div class="footer">
        <p>Cảm ơn bạn đã tin tưởng Watch Store!</p>
        <p>📧 Email: support@watchstore.com | 📞 Hotline: 1900 xxxx</p>
    </div>
</body>
</html>
