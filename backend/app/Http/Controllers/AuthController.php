<?php

namespace App\Http\Controllers;

use App\Services\AuthService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Đăng nhập
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);

            $data = $this->authService->login($validated['email'], $validated['password'], $request);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => $data,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Đăng ký
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $data = $this->authService->register($validated);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'data' => $data,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Đăng xuất
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $this->authService->logout($request->user());

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy thông tin user hiện tại
     */
    public function me(Request $request): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $request->user(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'refresh_token' => 'required|string',
            ]);

            $data = $this->authService->refreshToken($validated['refresh_token'], $request);

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'data' => $data,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 401);
        }
    }

    /**
     * Gửi OTP đăng ký
     */
    public function sendRegisterOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $this->authService->sendRegisterOtp($validated);

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your email. Valid for 5 minutes.',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xác thực OTP đăng ký
     */
    public function verifyRegisterOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
            ]);

            $data = $this->authService->verifyRegisterOtp($validated['email'], $validated['otp'], $request);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => $data,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Gửi OTP quên mật khẩu
     */
    public function sendForgotPasswordOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
            ]);

            $this->authService->sendForgotPasswordOtp($validated['email']);

            return response()->json([
                'success' => true,
                'message' => 'OTP sent to your email. Valid for 5 minutes.',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset mật khẩu
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email|exists:users,email',
                'otp' => 'required|string|size:6',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $this->authService->resetPassword(
                $validated['email'],
                $validated['otp'],
                $validated['password']
            );

            return response()->json([
                'success' => true,
                'message' => 'Password reset successful. Please login with your new password.',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Redirect to Google OAuth
     */
    public function googleRedirect(Request $request)
    {
        try {
            // Lưu guest_token vào session để dùng sau khi callback
            if ($request->has('guest_token')) {
                session(['google_oauth_guest_token' => $request->input('guest_token')]);
            }

            return Socialite::driver('google')->redirect();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to redirect to Google',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Google OAuth callback
     */
    public function googleCallback(Request $request): \Illuminate\Http\RedirectResponse
    {
        try {
            // Lấy guest_token từ session nếu có
            $guestToken = session('google_oauth_guest_token');
            if ($guestToken) {
                $request->merge(['guest_token' => $guestToken]);
                session()->forget('google_oauth_guest_token'); // Xóa sau khi sử dụng
            }

            $result = $this->authService->handleGoogleCallback($request);

            $frontendUrl = config('app.frontend_url');
            return redirect()->away(
                $frontendUrl . '/auth/google/callback?token=' . $result['token'] . '&refresh_token=' . $result['refresh_token'] . '&user=' . urlencode(json_encode($result['user']))
            );
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Google authentication failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
