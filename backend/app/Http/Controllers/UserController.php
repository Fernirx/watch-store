<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Controllers\Controller;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function index(Request $request)
    {
        try {
            $query = User::query();

            // Filter by role
            if ($request->filled('role')) {
                $query->where('role', $request->role);
            }

            // Filter by active status
            if ($request->filled('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            // Search by name or email
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);

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

    public function show(string $id)
    {
        try {
            $user = User::findOrFail($id);
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

    public function store(Request $request)
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

            // Set default is_active if not provided
            if (!isset($validated['is_active'])) {
                $validated['is_active'] = true;
            }

            // Hash password
            $validated['password'] = Hash::make($validated['password']);

            // Upload avatar if provided
            if ($request->hasFile('avatar')) {
                $uploadResult = $this->cloudinaryService->upload($request->file('avatar'), 'watch-store/avatars');
                $validated['avatar_url'] = $uploadResult['url'];
            }

            $user = User::create($validated);

            // Remove password from response
            $user->makeHidden('password');

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

    public function update(Request $request, string $id)
    {
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'name' => 'string|max:100',
                'email' => ['email', 'max:100', Rule::unique('users', 'email')->ignore($id)],
                'password' => 'nullable|string|min:6',
                'phone' => 'nullable|string|max:15',
                'role' => [Rule::in(['USER', 'ADMIN'])],
                'is_active' => 'nullable|boolean',
                'avatar' => 'nullable|image|max:2048',
            ]);

            // Hash password if provided
            if (isset($validated['password']) && !empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                // Remove password from validated if empty
                unset($validated['password']);
            }

            // Upload avatar if provided
            if ($request->hasFile('avatar')) {
                // Delete old avatar if exists
                if ($user->avatar_url) {
                    // Extract public_id from URL and delete
                    // Note: You may need to store public_id in database for better handling
                }

                $uploadResult = $this->cloudinaryService->upload($request->file('avatar'), 'watch-store/avatars');
                $validated['avatar_url'] = $uploadResult['url'];
            }

            $user->update($validated);
            $user->makeHidden('password');

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

    public function destroy(string $id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account',
                ], 403);
            }

            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function toggleStatus(string $id)
    {
        try {
            $user = User::findOrFail($id);

            // Prevent deactivating yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot deactivate your own account',
                ], 403);
            }

            $user->is_active = !$user->is_active;
            $user->save();
            $user->makeHidden('password');

            return response()->json([
                'success' => true,
                'message' => 'User status updated successfully',
                'data' => $user,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user status',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
