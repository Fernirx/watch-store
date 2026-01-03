<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Chưa xác thực',
            ], 401);
        }

        // CRITICAL: Check if account is active
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tài khoản không hoạt động. Truy cập bị từ chối.',
            ], 403);
        }

        if ($user->role !== $role) {
            return response()->json([
                'success' => false,
                'message' => 'Không có quyền truy cập. Vai trò yêu cầu: ' . $role,
            ], 403);
        }

        return $next($request);
    }
}
