<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Business Validator Helper
 *
 * Helper đơn giản để validate nghiệp vụ và gửi cảnh báo
 * - Ghi log khi phát hiện bất thường
 * - Gửi email cho admin nếu là critical
 */
class BusinessValidator
{
    /**
     * Validate và cảnh báo nếu có vấn đề
     *
     * @param string $type Loại validation (CRITICAL, WARNING, INFO)
     * @param string $code Mã lỗi
     * @param array $context Thông tin chi tiết
     * @param bool $sendEmail Có gửi email không (default: true cho CRITICAL)
     */
    public static function alert(string $type, string $code, array $context, bool $sendEmail = null): void
    {
        // Tự động gửi email nếu là CRITICAL
        if ($sendEmail === null) {
            $sendEmail = ($type === 'CRITICAL');
        }

        $message = self::formatMessage($type, $code, $context);

        // Ghi log theo severity
        switch ($type) {
            case 'CRITICAL':
                Log::critical($message, $context);
                break;
            case 'WARNING':
                Log::warning($message, $context);
                break;
            default:
                Log::info($message, $context);
        }

        // Gửi email cho admin nếu cần
        if ($sendEmail && $type === 'CRITICAL') {
            self::sendAdminEmail($code, $context);
        }
    }

    /**
     * Format message cho log
     */
    private static function formatMessage(string $type, string $code, array $context): string
    {
        $emoji = match($type) {
            'CRITICAL' => '🔴',
            'WARNING' => '🟡',
            default => 'ℹ️'
        };

        return "{$emoji} {$type}: {$code}";
    }

    /**
     * Gửi email cảnh báo cho admin
     */
    private static function sendAdminEmail(string $code, array $context): void
    {
        try {
            $adminEmail = env('ADMIN_EMAIL', 'admin@watchstore.com');

            Mail::send('emails.business_alert', [
                'code' => $code,
                'context' => $context,
                'time' => now()->toDateTimeString(),
            ], function ($message) use ($adminEmail, $code) {
                $message->to($adminEmail)
                        ->subject("🔴 CRITICAL: {$code}");
            });
        } catch (\Exception $e) {
            // Nếu gửi email fail, chỉ log lại, không throw exception
            Log::error('Failed to send admin email', [
                'error' => $e->getMessage(),
                'code' => $code,
            ]);
        }
    }

    /**
     * Kiểm tra stock âm và cảnh báo
     */
    public static function checkNegativeStock(int $productId, int $stockQuantity, string $productName): void
    {
        if ($stockQuantity < 0) {
            self::alert('CRITICAL', 'NEGATIVE_STOCK', [
                'product_id' => $productId,
                'product_name' => $productName,
                'stock_quantity' => $stockQuantity,
                'message' => 'Sản phẩm có số lượng tồn kho âm - Vấn đề toàn vẹn dữ liệu!',
            ]);
        }
    }

    /**
     * Kiểm tra order-payment consistency
     */
    public static function checkOrderPaymentConsistency(
        int $orderId,
        string $orderNumber,
        string $status,
        string $paymentStatus,
        float $total
    ): void {
        // RULE 1: Order CANCELLED nhưng đã PAID
        if ($status === 'CANCELLED' && $paymentStatus === 'paid') {
            self::alert('CRITICAL', 'PAID_ORDER_CANCELLED', [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'total' => $total,
                'message' => 'Đơn hàng đã hủy nhưng đã thanh toán - CẦN HOÀN TIỀN!',
                'action_required' => 'Liên hệ khách hàng để hoàn tiền',
            ]);
        }

        // RULE 2: Order COMPLETED nhưng chưa PAID
        if ($status === 'COMPLETED' && $paymentStatus !== 'paid') {
            self::alert('CRITICAL', 'COMPLETED_ORDER_UNPAID', [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'status' => $status,
                'payment_status' => $paymentStatus,
                'total' => $total,
                'message' => 'Đơn hàng hoàn thành nhưng chưa thanh toán - MẤT DOANH THU!',
                'action_required' => 'Xác minh thanh toán và cập nhật trạng thái',
            ]);
        }
    }

    /**
     * Kiểm tra coupon usage vượt giới hạn
     */
    public static function checkCouponOverLimit(
        int $couponId,
        string $couponCode,
        int $usageLimit,
        int $actualUsage
    ): void {
        if ($actualUsage > $usageLimit) {
            self::alert('CRITICAL', 'COUPON_OVER_LIMIT', [
                'coupon_id' => $couponId,
                'coupon_code' => $couponCode,
                'usage_limit' => $usageLimit,
                'actual_usage' => $actualUsage,
                'over_by' => $actualUsage - $usageLimit,
                'message' => 'Mã giảm giá được sử dụng vượt quá giới hạn - mất doanh thu!',
            ]);
        }
    }

    /**
     * Cảnh báo khi có hành vi đáng ngờ (suspicious activity)
     */
    public static function alertSuspiciousActivity(string $activityType, array $details): void
    {
        self::alert('WARNING', 'SUSPICIOUS_ACTIVITY', array_merge([
            'activity_type' => $activityType,
        ], $details));
    }

    /**
     * Kiểm tra stock đủ trước khi tạo order
     */
    public static function validateSufficientStock(array $items): bool
    {
        $hasIssue = false;

        foreach ($items as $item) {
            $product = $item->product;
            $requestedQty = $item->quantity;

            if ($product->stock_quantity < $requestedQty) {
                self::alert('WARNING', 'INSUFFICIENT_STOCK_ON_ORDER', [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'requested_quantity' => $requestedQty,
                    'available_stock' => $product->stock_quantity,
                    'shortage' => $requestedQty - $product->stock_quantity,
                    'message' => 'Cố gắng tạo đơn hàng với số lượng tồn kho không đủ',
                ]);
                $hasIssue = true;
            }
        }

        return !$hasIssue;
    }

    /**
     * Log info khi có sự kiện quan trọng (không phải lỗi)
     */
    public static function logBusinessEvent(string $eventType, array $context): void
    {
        self::alert('INFO', $eventType, $context, false);
    }
}
