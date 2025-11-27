<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class VNPayService
{
    protected $tmnCode;
    protected $hashSecret;
    protected $url;
    protected $returnUrl;
    protected $locale;

    public function __construct()
    {
        $this->tmnCode = config('vnpay.tmn_code');
        $this->hashSecret = config('vnpay.hash_secret');
        $this->url = config('vnpay.url');
        $this->returnUrl = config('vnpay.return_url');
        $this->locale = config('vnpay.locale');
    }

    public function createPaymentUrl($orderId, $amount, $orderInfo, $ipAddr)
    {
        $vnpData = [
            'vnp_Version' => '2.1.0',
            'vnp_TmnCode' => $this->tmnCode,
            'vnp_Amount' => $amount * 100, // VNPay yêu cầu số tiền nhân 100
            'vnp_Command' => 'pay',
            'vnp_CreateDate' => date('YmdHis'),
            'vnp_CurrCode' => config('vnpay.currency_code'),
            'vnp_IpAddr' => $ipAddr,
            'vnp_Locale' => $this->locale,
            'vnp_OrderInfo' => $orderInfo,
            'vnp_OrderType' => 'other',
            'vnp_ReturnUrl' => $this->returnUrl,
            'vnp_TxnRef' => $orderId . '_' . time(), // Mã giao dịch unique
        ];
        ksort($vnpData);

        // Tạo hash data và query string theo chuẩn VNPay
        $i = 0;
        $hashData = "";
        $query = "";

        foreach ($vnpData as $key => $value) {
            if ($value != null && $value != '') {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
                $query .= urlencode($key) . "=" . urlencode($value) . '&';
            }
        }

        // Tạo secure hash
        $vnpSecureHash = hash_hmac('sha512', $hashData, $this->hashSecret);

        // URL thanh toán
        $paymentUrl = $this->url . "?" . $query . 'vnp_SecureHash=' . $vnpSecureHash;

        Log::info('VNPay Payment URL Debug', [
            'hashData' => $hashData,
            'hash' => $vnpSecureHash,
            'secret' => substr($this->hashSecret, 0, 10) . '...'
        ]);

        return $paymentUrl;
    }

    public function validateResponse($responseData)
    {
        $vnpSecureHash = $responseData['vnp_SecureHash'] ?? '';
        unset($responseData['vnp_SecureHash']);
        unset($responseData['vnp_SecureHashType']);

        // Sắp xếp dữ liệu
        ksort($responseData);

        // Tạo hash data theo chuẩn VNPay
        $i = 0;
        $hashData = "";
        foreach ($responseData as $key => $value) {
            if ($value != null && $value != '') {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
            }
        }

        // Tạo secure hash để so sánh
        $secureHash = hash_hmac('sha512', $hashData, $this->hashSecret);

        Log::info('VNPay Response Validation', [
            'hashData' => $hashData,
            'computed_hash' => $secureHash,
            'vnpay_hash' => $vnpSecureHash,
            'match' => $secureHash === $vnpSecureHash
        ]);

        return $secureHash === $vnpSecureHash;
    }

    public function getResponseMessage($responseCode)
    {
        $messages = [
            '00' => 'Giao dịch thành công',
            '07' => 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
            '10' => 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
            '11' => 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
            '12' => 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
            '13' => 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.',
            '24' => 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
            '51' => 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
            '65' => 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
            '75' => 'Ngân hàng thanh toán đang bảo trì.',
            '79' => 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch',
            '99' => 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)',
        ];

        return $messages[$responseCode] ?? 'Lỗi không xác định';
    }
}
