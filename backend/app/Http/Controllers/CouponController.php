<?php

namespace App\Http\Controllers;

use App\Services\CouponService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CouponController extends Controller
{
    protected CouponService $couponService;

    public function __construct(CouponService $couponService)
    {
        $this->couponService = $couponService;
    }

    // ========== ADMIN ENDPOINTS ==========

    /**
     * GET /admin/coupons - List all coupons
     */
    public function index(): JsonResponse
    {
        try {
            $coupons = $this->couponService->getCoupons();
            return response()->json([
                'success' => true,
                'data' => $coupons,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch coupons',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /admin/coupons/{id} - Get coupon details
     */
    public function show(string $id): JsonResponse
    {
        try {
            $coupon = $this->couponService->getCouponById((int)$id);

            if (!$coupon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Coupon not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $coupon,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Coupon not found',
            ], 404);
        }
    }

    /**
     * POST /admin/coupons - Create new coupon
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'min:3',
                    'max:50',
                    'unique:coupons,code',
                    'regex:/^[A-Z0-9_-]+$/'
                ],
                'description' => 'nullable|string',
                'discount_type' => 'required|in:PERCENTAGE,FIXED',
                'discount_value' => 'required|numeric|min:0',
                'max_discount' => 'nullable|numeric|min:0',
                'min_order_value' => 'nullable|numeric|min:0',
                'usage_type' => 'required|in:SINGLE_USE,LIMITED_USE',
                'usage_limit' => 'nullable|integer|min:1',
                'valid_from' => 'nullable|date',
                'valid_until' => 'nullable|date|after:valid_from',
                'is_active' => 'boolean',
            ], [
                'code.regex' => 'Mã coupon chỉ được chứa chữ in hoa, số, gạch ngang (-) và gạch dưới (_)',
                'code.min' => 'Mã coupon phải có ít nhất 3 ký tự',
            ]);

            // Validation: PERCENTAGE must be 0-100
            if ($validated['discount_type'] === 'PERCENTAGE' && $validated['discount_value'] > 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phần trăm giảm giá phải từ 0-100',
                ], 422);
            }

            // Validation: LIMITED_USE requires usage_limit
            if ($validated['usage_type'] === 'LIMITED_USE' && empty($validated['usage_limit'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vui lòng nhập số lần sử dụng tối đa',
                ], 422);
            }

            $coupon = $this->couponService->createCoupon($validated);

            return response()->json([
                'success' => true,
                'message' => 'Coupon created successfully',
                'data' => $coupon,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['code'])) {
                $message = 'Mã coupon "' . $request->input('code') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.';
            }

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
                'fields' => isset($errors['code']) ? 'code' : null,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create coupon',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /admin/coupons/{id} - Update coupon
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'string',
                    'min:3',
                    'max:50',
                    'unique:coupons,code,' . $id,
                    'regex:/^[A-Z0-9_-]+$/'
                ],
                'description' => 'nullable|string',
                'discount_type' => 'in:PERCENTAGE,FIXED',
                'discount_value' => 'numeric|min:0',
                'max_discount' => 'nullable|numeric|min:0',
                'min_order_value' => 'nullable|numeric|min:0',
                'usage_type' => 'in:SINGLE_USE,LIMITED_USE',
                'usage_limit' => 'nullable|integer|min:1',
                'valid_from' => 'nullable|date',
                'valid_until' => 'nullable|date',
                'is_active' => 'boolean',
            ]);

            $coupon = $this->couponService->updateCoupon((int)$id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Coupon updated successfully',
                'data' => $coupon,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = $e->errors();
            $message = 'Dữ liệu không hợp lệ';

            if (isset($errors['code'])) {
                $message = 'Mã coupon "' . $request->input('code') . '" đã tồn tại trong hệ thống. Vui lòng sử dụng mã khác.';
            }

            return response()->json([
                'success' => false,
                'message' => $message,
                'errors' => $errors,
                'fields' => isset($errors['code']) ? 'code' : null,
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update coupon',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /admin/coupons/{id} - Delete coupon
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->couponService->deleteCoupon((int)$id);

            return response()->json([
                'success' => true,
                'message' => 'Coupon deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    // ========== CUSTOMER ENDPOINTS ==========

    /**
     * POST /coupons/validate - Validate coupon before applying
     */
    public function validate(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'min:3',
                    'max:50',
                    'regex:/^[A-Z0-9_-]+$/'
                ],
                'subtotal' => 'required|numeric|min:0',
                'email' => 'required|email',
                'phone' => [
                    'required',
                    'string',
                    'max:15',
                    'regex:/^(0)(3[2-9]|5[689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/'
                ],
            ], [
                'code.regex' => 'Mã coupon không hợp lệ',
                'phone.regex' => 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)',
            ]);

            $userId = $request->user() ? $request->user()->id : null;

            $result = $this->couponService->validateCoupon(
                $validated['code'],
                $validated['subtotal'],
                $validated['email'],
                $validated['phone'],
                $userId
            );

            if (!$result['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'code' => $result['coupon']->code,
                    'discount_amount' => $result['discount_amount'],
                    'discount_type' => $result['coupon']->discount_type,
                    'discount_value' => $result['coupon']->discount_value,
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
                'message' => 'Failed to validate coupon',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
