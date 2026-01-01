<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Lấy tổng quan thống kê cho dashboard
     */
    public function getStats(): array
    {
        return [
            'revenue' => $this->getRevenueStats(),
            'orders' => $this->getOrderStats(),
            'top_products' => $this->getTopProducts(10),
            'low_stock' => $this->getLowStockProducts(),
        ];
    }

    /**
     * Thống kê doanh thu (hôm nay, tuần, tháng) + growth %
     */
    private function getRevenueStats(): array
    {
        $now = Carbon::now();

        // Doanh thu hôm nay
        $today = Order::whereDate('created_at', $now->toDateString())
            ->where('payment_status', 'paid')
            ->sum('total');

        // Doanh thu hôm qua (để tính growth)
        $yesterday = Order::whereDate('created_at', $now->copy()->subDay()->toDateString())
            ->where('payment_status', 'paid')
            ->sum('total');

        // Doanh thu tuần này (Monday - Sunday)
        $weekStart = $now->copy()->startOfWeek();
        $weekEnd = $now->copy()->endOfWeek();
        $thisWeek = Order::whereBetween('created_at', [$weekStart, $weekEnd])
            ->where('payment_status', 'paid')
            ->sum('total');

        // Doanh thu tuần trước (để tính growth)
        $lastWeekStart = $now->copy()->subWeek()->startOfWeek();
        $lastWeekEnd = $now->copy()->subWeek()->endOfWeek();
        $lastWeek = Order::whereBetween('created_at', [$lastWeekStart, $lastWeekEnd])
            ->where('payment_status', 'paid')
            ->sum('total');

        // Doanh thu tháng này
        $monthStart = $now->copy()->startOfMonth();
        $monthEnd = $now->copy()->endOfMonth();
        $thisMonth = Order::whereBetween('created_at', [$monthStart, $monthEnd])
            ->where('payment_status', 'paid')
            ->sum('total');

        // Doanh thu tháng trước (để tính growth)
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();
        $lastMonth = Order::whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->where('payment_status', 'paid')
            ->sum('total');

        // Tổng doanh thu (all time)
        $total = Order::where('payment_status', 'paid')->sum('total');

        return [
            'today' => (float) $today,
            'week' => (float) $thisWeek,
            'month' => (float) $thisMonth,
            'total' => (float) $total,
            'growth' => [
                'today' => $this->calculateGrowth($today, $yesterday),
                'week' => $this->calculateGrowth($thisWeek, $lastWeek),
                'month' => $this->calculateGrowth($thisMonth, $lastMonth),
            ],
        ];
    }

    /**
     * Thống kê đơn hàng
     */
    private function getOrderStats(): array
    {
        $total = Order::count();
        $pending = Order::where('status', 'PENDING')->count();
        $processing = Order::where('status', 'PROCESSING')->count();
        $completed = Order::where('status', 'COMPLETED')->count();
        $cancelled = Order::where('status', 'CANCELLED')->count();

        // Average Order Value (chỉ tính đơn đã thanh toán)
        $aov = Order::where('payment_status', 'paid')->avg('total');

        return [
            'total' => $total,
            'pending' => $pending,
            'processing' => $processing,
            'completed' => $completed,
            'cancelled' => $cancelled,
            'average_order_value' => (float) ($aov ?? 0),
        ];
    }

    /**
     * Top sản phẩm bán chạy
     */
    private function getTopProducts(int $limit = 10): array
    {
        return Product::select(
                'products.id',
                'products.name',
                'products.code',
                'products.price',
                'products.sold_count',
                'products.stock_quantity',
                DB::raw('COALESCE(SUM(order_items.quantity), 0) as total_sold'),
                DB::raw('COALESCE(SUM(order_items.subtotal), 0) as total_revenue')
            )
            ->leftJoin('order_items', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('orders', 'order_items.order_id', '=', 'orders.id')
            ->where(function($query) {
                $query->whereNull('orders.id')
                    ->orWhere('orders.payment_status', 'paid');
            })
            ->groupBy('products.id', 'products.name', 'products.code', 'products.price', 'products.sold_count', 'products.stock_quantity')
            ->orderBy('total_sold', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'price' => (float) $product->price,
                    'sold_count' => $product->sold_count,
                    'stock_quantity' => $product->stock_quantity,
                    'total_sold' => (int) $product->total_sold,
                    'total_revenue' => (float) $product->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Sản phẩm sắp hết hàng (stock < min_stock_level)
     */
    private function getLowStockProducts(): array
    {
        return Product::select('id', 'name', 'code', 'stock_quantity', 'min_stock_level')
            ->whereColumn('stock_quantity', '<=', 'min_stock_level')
            ->where('is_active', true)
            ->orderBy('stock_quantity', 'asc')
            ->limit(10)
            ->get()
            ->toArray();
    }

    /**
     * Revenue trend cho line chart (7, 30, hoặc 90 ngày)
     */
    public function getRevenueTrend(int $days = 7): array
    {
        $endDate = Carbon::now();
        $startDate = $endDate->copy()->subDays($days - 1)->startOfDay();

        $revenues = Order::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as order_count')
            )
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        // Tạo array đầy đủ các ngày (fill missing dates với 0)
        $result = [];
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $found = $revenues->firstWhere('date', $dateStr);

            $result[] = [
                'date' => $dateStr,
                'revenue' => $found ? (float) $found->revenue : 0,
                'order_count' => $found ? (int) $found->order_count : 0,
            ];

            $currentDate->addDay();
        }

        return $result;
    }

    /**
     * Phân bổ đơn hàng theo trạng thái cho pie chart
     */
    public function getOrderStatusDistribution(): array
    {
        $total = Order::count();

        if ($total === 0) {
            return [];
        }

        $distribution = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get()
            ->map(function ($item) use ($total) {
                return [
                    'status' => $item->status,
                    'count' => (int) $item->count,
                    'percentage' => round(($item->count / $total) * 100, 2),
                ];
            })
            ->toArray();

        return $distribution;
    }

    /**
     * Tính % tăng/giảm so với kỳ trước
     */
    private function calculateGrowth(float $current, float $previous): float
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 2);
    }
}
