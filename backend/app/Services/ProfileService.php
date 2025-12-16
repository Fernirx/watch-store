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
     * Lấy thông tin profile của user
     */
    public function getProfile(int $userId): User
    {
        $user = User::findOrFail($userId);
        $user->load('defaultAddress');

        return $user;
    }

    /**
     * Cập nhật thông tin profile
     */
    public function updateProfile(int $userId, array $data): User
    {
        $user = User::findOrFail($userId);
        $user->update($data);

        return $user->fresh();
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
