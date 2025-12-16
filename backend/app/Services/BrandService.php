<?php

namespace App\Services;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Collection;

class BrandService
{
    protected CloudinaryService $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Lấy danh sách brand đang active
     */
    public function getBrands(): Collection
    {
        return Brand::where('is_active', true)->get();
    }

    /**
     * Lấy chi tiết brand theo ID
     */
    public function getBrandById(int $id): ?Brand
    {
        return Brand::find($id);
    }

    /**
     * Tạo brand mới
     */
    public function createBrand(array $data, $logoFile = null): Brand
    {
        // Upload logo nếu có
        if ($logoFile) {
            $uploadResult = $this->cloudinaryService->upload($logoFile, 'watch-store/brands');
            $data['logo_url'] = $uploadResult['url'];
            $data['logo_public_id'] = $uploadResult['public_id'];
        }

        return Brand::create($data);
    }

    /**
     * Cập nhật brand
     */
    public function updateBrand(int $id, array $data, $logoFile = null): Brand
    {
        $brand = Brand::findOrFail($id);

        // Upload logo mới nếu có
        if ($logoFile) {
            // Xóa logo cũ
            if ($brand->logo_public_id) {
                $this->cloudinaryService->delete($brand->logo_public_id);
            }

            $uploadResult = $this->cloudinaryService->upload($logoFile, 'watch-store/brands');
            $data['logo_url'] = $uploadResult['url'];
            $data['logo_public_id'] = $uploadResult['public_id'];
        }

        $brand->update($data);

        return $brand->fresh();
    }

    /**
     * Xóa brand
     */
    public function deleteBrand(int $id): bool
    {
        $brand = Brand::findOrFail($id);

        // Xóa logo trên Cloudinary
        if ($brand->logo_public_id) {
            $this->cloudinaryService->delete($brand->logo_public_id);
        }

        return $brand->delete();
    }
}
