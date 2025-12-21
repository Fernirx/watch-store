<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class OptionalAuth
{
    /**
     * Handle an incoming request.
     * Authenticate user if token exists, but don't reject if missing.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Try to authenticate user if token exists
            if ($request->bearerToken()) {
                JWTAuth::parseToken()->authenticate();
            }
        } catch (JWTException $e) {
            // Token invalid or expired - continue without auth
            // Don't throw error, just let request proceed
            \Log::debug('Optional auth: Token invalid or expired');
        }

        return $next($request);
    }
}
