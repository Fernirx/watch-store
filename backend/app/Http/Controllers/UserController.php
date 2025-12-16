<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected UserService $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Lấy danh sách users
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'role' => $request->get('role'),
                'is_active' => $request->get('is_active'),
                'search' => $request->get('search'),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
                'per_page' => $request->get('per_page', 15),
            ];

            $users = $this->userService->getUsers($filters);

            return response()->json([
                'success' => true,
                'data' => $users,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch users',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Lấy chi tiết user
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = $this->userService->getUserById((int)$id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 404);
        }
    }

    /**
     * Tạo user mới
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'email' => 'required|email|max:100|unique:users,email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string|max:15',
                'role' => ['required', Rule::in(['USER', 'ADMIN'])],
                'is_active' => 'nullable|boolean',
                'avatar' => 'nullable|image|max:2048',
            ]);

            $avatarFile = $request->hasFile('avatar') ? $request->file('avatar') : null;

            $user = $this->userService->createUser($validated, $avatarFile);

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user,
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
                'message' => 'Failed to create user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cập nhật user
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'string|max:100',
                'email' => ['email', 'max:100', Rule::unique('users', 'email')->ignore($id)],
                'password' => 'nullable|string|min:6',
                'phone' => 'nullable|string|max:15',
                'role' => [Rule::in(['USER', 'ADMIN'])],
                'is_active' => 'nullable|boolean',
                'avatar' => 'nullable|image|max:2048',
            ]);

            $avatarFile = $request->hasFile('avatar') ? $request->file('avatar') : null;

            $user = $this->userService->updateUser((int)$id, $validated, $avatarFile);

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user,
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
                'message' => 'Failed to update user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Xóa user
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $this->userService->deleteUser((int)$id, auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], $e->getMessage() === 'You cannot delete your own account' ? 403 : 500);
        }
    }

    /**
     * Toggle trạng thái user
     */
    public function toggleStatus(string $id): JsonResponse
    {
        try {
            $user = $this->userService->toggleUserStatus((int)$id, auth()->id());

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error' => $e->getMessage(),
            ], $e->getMessage() === 'You cannot deactivate your own account' ? 403 : 500);
        }
    }
}
