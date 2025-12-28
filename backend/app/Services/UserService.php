<?php

namespace App\Services;

use App\Models\User;
use App\Models\Customer;
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
        $query = User::with('customer');

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
                $q->where('email', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
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
        return User::with('customer')->find($id);
    }

    /**
     * Tạo user mới
     */
    public function createUser(array $data, $avatarFile = null): User
    {
        // Tách data: user vs customer
        $userData = [];
        $customerData = [];

        // User fields
        foreach (['email', 'password', 'role', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $userData[$field] = $data[$field];
            }
        }

        // Customer fields
        foreach (['name', 'shipping_phone', 'shipping_name', 'shipping_address'] as $field) {
            if (isset($data[$field])) {
                $customerData[$field] = $data[$field];
            }
        }

        // Set default is_active if not provided
        if (!isset($userData['is_active'])) {
            $userData['is_active'] = true;
        }

        // Hash password
        $userData['password'] = Hash::make($userData['password']);

        // Upload avatar if provided
        if ($avatarFile) {
            $uploadResult = $this->cloudinaryService->upload($avatarFile, 'watch-store/avatars');
            $userData['avatar_url'] = $uploadResult['url'];
        }

        // Create user
        $user = User::create($userData);

        // Create customer record
        if (!empty($customerData)) {
            Customer::create([
                'user_id' => $user->id,
                ...$customerData,
            ]);
        }

        // Remove password from response
        $user->makeHidden('password');

        return $user->fresh('customer');
    }

    /**
     * Cập nhật user
     */
    public function updateUser(int $id, array $data, $avatarFile = null): User
    {
        $user = User::findOrFail($id);

        // Tách data: user vs customer
        $userData = [];
        $customerData = [];

        // User fields
        foreach (['email', 'password', 'role', 'is_active'] as $field) {
            if (isset($data[$field])) {
                $userData[$field] = $data[$field];
            }
        }

        // Customer fields
        foreach (['name', 'shipping_phone', 'shipping_name', 'shipping_address'] as $field) {
            if (isset($data[$field])) {
                $customerData[$field] = $data[$field];
            }
        }

        // Hash password if provided
        if (isset($userData['password']) && !empty($userData['password'])) {
            $userData['password'] = Hash::make($userData['password']);
        } else {
            // Remove password from data if empty
            unset($userData['password']);
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
            $userData['avatar_url'] = $uploadResult['url'];
        }

        // Update user
        if (!empty($userData)) {
            $user->update($userData);
        }

        // Update hoặc tạo customer
        if (!empty($customerData)) {
            if ($user->customer) {
                $user->customer->update($customerData);
            } else {
                Customer::create([
                    'user_id' => $user->id,
                    ...$customerData,
                ]);
            }
        }

        $user->makeHidden('password');

        return $user->fresh('customer');
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
