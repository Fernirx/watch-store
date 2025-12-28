<?php

namespace App\Http\Controllers;

use App\Services\GuestOtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Guest Checkout OTP Controller
 *
 * Xử lý xác thực email cho guest checkout
 */
class GuestOtpController extends Controller
{
    protected GuestOtpService $guestOtpService;

    public function __construct(GuestOtpService $guestOtpService)
    {
        $this->guestOtpService = $guestOtpService;
    }

    /**
     * Gửi OTP cho guest checkout
     */
    public function sendCheckoutOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'guest_token' => 'required|string',
            ]);

            $result = $this->guestOtpService->sendCheckoutOtp(
                $validated['email'],
                $validated['guest_token']
            );

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'expires_at' => $result['expires_at'],
                ],
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
                'message' => 'Không thể gửi OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xác thực OTP cho guest checkout
     */
    public function verifyCheckoutOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'otp' => 'required|string|size:6',
                'guest_token' => 'required|string',
            ]);

            $result = $this->guestOtpService->verifyCheckoutOtp(
                $validated['email'],
                $validated['otp'],
                $validated['guest_token']
            );

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'email' => $result['email'],
                    'verified_at' => $result['verified_at'],
                ],
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
                'message' => 'Xác thực thất bại',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Gửi lại OTP cho guest checkout
     */
    public function resendCheckoutOtp(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'guest_token' => 'required|string',
            ]);

            $result = $this->guestOtpService->resendCheckoutOtp(
                $validated['email'],
                $validated['guest_token']
            );

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'expires_at' => $result['expires_at'],
                ],
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
                'message' => 'Không thể gửi lại OTP',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
