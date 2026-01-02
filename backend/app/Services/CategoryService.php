<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Lấy danh sách category (admin xem tất cả, user chỉ xem active)
     */
    public function getCategories(bool $adminMode = false): Collection
    {
        $query = Category::query();

        // Nếu không phải admin mode, chỉ lấy category active
        if (!$adminMode) {
            $query->where('is_active', true);
        }

        return $query->get();
    }

    /**
     * Lấy chi tiết category theo ID
     */
    public function getCategoryById(int $id): ?Category
    {
        return Category::find($id);
    }

    /**
     * Tạo category mới
     */
    public function createCategory(array $data, $imageFile = null): Category
    {
        // Upload image nếu có
        if ($imageFile) {
            $uploadResult = $this->cloudinaryService->upload($imageFile, 'watch-store/categories');
            $data['image_url'] = $uploadResult['url'];
            $data['image_public_id'] = $uploadResult['public_id'];
        }

        return Category::create($data);
    }

    /**
     * Cập nhật category
     */
    public function updateCategory(int $id, array $data, $imageFile = null): Category
    {
        $category = Category::findOrFail($id);

        // Upload image mới nếu có
        if ($imageFile) {
            // Xóa image cũ
            if ($category->image_public_id) {
                $this->cloudinaryService->delete($category->image_public_id);
            }

            $uploadResult = $this->cloudinaryService->upload($imageFile, 'watch-store/categories');
            $data['image_url'] = $uploadResult['url'];
            $data['image_public_id'] = $uploadResult['public_id'];
        }

        $category->update($data);

        return $category->fresh();
    }

    /**
     * Xóa category
     */
    public function deleteCategory(int $id): bool
    {
        $category = Category::findOrFail($id);

        // Xóa image trên Cloudinary
        if ($category->image_public_id) {
            $this->cloudinaryService->delete($category->image_public_id);
        }

        return $category->delete();
    }
}
