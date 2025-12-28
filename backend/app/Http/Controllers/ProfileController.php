<?php

namespace App\Http\Controllers;

use App\Services\ProfileService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    protected ProfileService $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    /**
     * Lấy thông tin profile của user hiện tại
     */
    public function show(Request $request): JsonResponse
    {
        try {
            $user = $this->profileService->getProfile($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch profile',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật thông tin profile
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'email' => 'sometimes|required|email|max:100|unique:users,email,' . $user->id,
                'shipping_name' => 'sometimes|nullable|string|max:200',
                'shipping_phone' => 'sometimes|nullable|string|max:15',
                'shipping_address' => 'sometimes|nullable|string',
            ]);

            $updatedUser = $this->profileService->updateProfile($user->id, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $updatedUser,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            $result = $this->profileService->uploadAvatar(
                $request->user()->id,
                $request->file('avatar')
            );

            return response()->json([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
                'data' => $result,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Avatar upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload avatar',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa avatar
     */
    public function deleteAvatar(Request $request): JsonResponse
    {
        try {
            $this->profileService->deleteAvatar($request->user()->id);

            return response()->json([
                'success' => true,
                'message' => 'Avatar deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete avatar',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Đổi mật khẩu
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $this->profileService->changePassword(
                $request->user()->id,
                $validated['current_password'],
                $validated['new_password']
            );

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
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
}
