<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if authenticated user account is active
 *
 * This middleware should be applied to ALL authenticated routes
 * to prevent deactivated users from accessing the system.
 */
class CheckAccountActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If user is authenticated, check if account is active
        if ($user && !$user->is_active) {
            // Invalidate current JWT token
            auth('api')->logout();

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact support for assistance.',
            ], 403);
        }

        return $next($request);
    }
}
