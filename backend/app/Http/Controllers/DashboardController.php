<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Lấy tổng quan thống kê dashboard
     * GET /admin/dashboard/stats
     */
    public function getStats(): JsonResponse
    {
        try {
            $stats = $this->dashboardService->getStats();

            return response()->json([
                'success' => true,
                'data' => $stats,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tải thống kê dashboard',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy revenue trend cho line chart
     * GET /admin/charts/revenue-trend?days=7|30|90
     */
    public function getRevenueTrend(Request $request): JsonResponse
    {
        try {
            $days = $request->input('days', 7);

            // Validate days parameter
            if (!in_array($days, [7, 30, 90])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tham số ngày không hợp lệ. Giá trị cho phép: 7, 30, 90',
                ], 400);
            }

            $trend = $this->dashboardService->getRevenueTrend($days);

            return response()->json([
                'success' => true,
                'data' => $trend,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tải xu hướng doanh thu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy phân bổ đơn hàng theo trạng thái cho pie chart
     * GET /admin/charts/order-status
     */
    public function getOrderStatusDistribution(): JsonResponse
    {
        try {
            $distribution = $this->dashboardService->getOrderStatusDistribution();

            return response()->json([
                'success' => true,
                'data' => $distribution,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể tải phân bổ trạng thái đơn hàng',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
