<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Lấy danh sách users với filters và pagination
     */
    public function getUsers(array $filters = []): LengthAwarePaginator
    {
        $query = User::query();

        // Filter by role
        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        // Filter by active status
        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Search by name or email
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $filters['per_page'] ?? 15;

        return $query->paginate($perPage);
    }

    /**
     * Lấy chi tiết user theo ID
     */
    public function getUserById(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Tạo user mới
     */
    public function createUser(array $data, $avatarFile = null): User
    {
        // Set default is_active if not provided
        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        // Hash password
        $data['password'] = Hash::make($data['password']);

        // Upload avatar if provided
        if ($avatarFile) {
            $uploadResult = $this->cloudinaryService->upload($avatarFile, 'watch-store/avatars');
            $data['avatar_url'] = $uploadResult['url'];
        }

        $user = User::create($data);

        // Remove password from response
        $user->makeHidden('password');

        return $user;
    }

    /**
     * Cập nhật user
     */
    public function updateUser(int $id, array $data, $avatarFile = null): User
    {
        $user = User::findOrFail($id);

        // Hash password if provided
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            // Remove password from data if empty
            unset($data['password']);
        }

        // Upload avatar if provided
        if ($avatarFile) {
            // Delete old avatar if exists
            if ($user->avatar_url) {
                preg_match('/\/v\d+\/(.+)\.\w+$/', $user->avatar_url, $matches);
                if (isset($matches[1])) {
                    $this->cloudinaryService->delete($matches[1]);
                }
            }

            $uploadResult = $this->cloudinaryService->upload($avatarFile, 'watch-store/avatars');
            $data['avatar_url'] = $uploadResult['url'];
        }

        $user->update($data);
        $user->makeHidden('password');

        return $user->fresh();
    }

    /**
     * Xóa user
     */
    public function deleteUser(int $id, int $currentUserId): void
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === $currentUserId) {
            throw new \Exception('You cannot delete your own account');
        }

        $user->delete();
    }

    /**
     * Toggle trạng thái active của user
     */
    public function toggleUserStatus(int $id, int $currentUserId): User
    {
        $user = User::findOrFail($id);

        // Prevent deactivating yourself
        if ($user->id === $currentUserId) {
            throw new \Exception('You cannot deactivate your own account');
        }

        $user->is_active = !$user->is_active;
        $user->save();
        $user->makeHidden('password');

        return $user;
    }
}
