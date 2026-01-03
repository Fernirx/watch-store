<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    // ========== CUSTOMER ENDPOINTS ==========

    /**
     * Get all visible notifications for customers
     */
    public function indexForCustomers(): JsonResponse
    {
        $notifications = Notification::visible()
            ->orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Get single notification detail
     */
    public function show(int $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $notification,
        ]);
    }

    // ========== ADMIN ENDPOINTS ==========

    /**
     * Get all notifications for admin (including inactive)
     */
    public function index(): JsonResponse
    {
        $notifications = Notification::orderBy('priority', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Create new notification
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:SYSTEM,PROMOTION,MAINTENANCE,FEATURE',
            'image_url' => 'nullable|string|max:500',
            'link_url' => 'nullable|string|max:500',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
            'is_active' => 'boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        $notification = Notification::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tạo thông báo thành công',
            'data' => $notification,
        ], 201);
    }

    /**
     * Update notification
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'required|in:SYSTEM,PROMOTION,MAINTENANCE,FEATURE',
            'image_url' => 'nullable|string|max:500',
            'link_url' => 'nullable|string|max:500',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
            'is_active' => 'boolean',
            'priority' => 'nullable|integer|min:0',
        ]);

        $notification->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật thông báo thành công',
            'data' => $notification,
        ]);
    }

    /**
     * Delete notification
     */
    public function destroy(int $id): JsonResponse
    {
        $notification = Notification::findOrFail($id);
        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Xóa thông báo thành công',
        ]);
    }
}
