<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProfileService
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Lấy thông tin profile của user (bao gồm customer)
     */
    public function getProfile(int $userId): User
    {
        $user = User::with('customer')->findOrFail($userId);

        return $user;
    }

    /**
     * Cập nhật thông tin profile (customer data)
     */
    public function updateProfile(int $userId, array $data): User
    {
        $user = User::findOrFail($userId);

        // Tách data: user table chỉ có avatar_url (nếu có)
        $userData = [];
        $customerData = [];

        // Phân loại data
        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'shipping_name', 'shipping_phone', 'shipping_address'])) {
                $customerData[$key] = $value;
            } elseif ($key === 'avatar_url') {
                $userData[$key] = $value;
            }
        }

        // Update user table (nếu có)
        if (!empty($userData)) {
            $user->update($userData);
        }

        // Update hoặc tạo customer
        if (!empty($customerData)) {
            if ($user->customer) {
                $user->customer->update($customerData);
            } else {
                // Tạo customer nếu chưa có (trường hợp user cũ hoặc Google login)
                $user->customer()->create($customerData);
            }
        }

        return $user->fresh('customer');
    }

    /**
     * Upload avatar
     */
    public function uploadAvatar(int $userId, $avatarFile): array
    {
        $user = User::findOrFail($userId);

        // Upload ảnh mới lên Cloudinary
        $uploadedFile = $this->cloudinaryService->upload(
            $avatarFile,
            'watch-store/avatars'
        );

        // Xóa ảnh cũ nếu có
        if ($user->avatar_url) {
            // Extract public_id từ Cloudinary URL
            // VD: https://res.cloudinary.com/xxx/image/upload/v123/watch-store/avatars/abc.jpg
            // public_id = watch-store/avatars/abc
            preg_match('/\/v\d+\/(.+)\.\w+$/', $user->avatar_url, $matches);
            if (isset($matches[1])) {
                $this->cloudinaryService->delete($matches[1]);
            }
        }

        // Cập nhật avatar_url trong database
        $user->update(['avatar_url' => $uploadedFile['url']]);

        return [
            'avatar_url' => $uploadedFile['url'],
        ];
    }

    /**
     * Xóa avatar
     */
    public function deleteAvatar(int $userId): void
    {
        $user = User::findOrFail($userId);

        if ($user->avatar_url) {
            // Extract public_id và xóa từ Cloudinary
            preg_match('/\/v\d+\/(.+)\.\w+$/', $user->avatar_url, $matches);
            if (isset($matches[1])) {
                $this->cloudinaryService->delete($matches[1]);
            }

            // Xóa avatar_url trong database
            $user->update(['avatar_url' => null]);
        }
    }

    /**
     * Đổi mật khẩu
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): void
    {
        $user = User::findOrFail($userId);

        // Kiểm tra mật khẩu hiện tại
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \Exception('Current password is incorrect');
        }

        // Cập nhật mật khẩu mới
        $user->update([
            'password' => Hash::make($newPassword),
        ]);
    }
}
