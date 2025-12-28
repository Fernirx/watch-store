<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ProductService
{
    /**
     * Lấy danh sách sản phẩm với filters và pagination
     */
    public function getProducts(array $filters = []): LengthAwarePaginator
    {
        $query = Product::with(['category', 'brand']);

        // Admin có thể xem tất cả, user chỉ xem active
        if (!isset($filters['admin_mode']) || !$filters['admin_mode']) {
            $query->where('is_active', true);
        }

        // Apply filters
        $this->applyFilters($query, $filters);

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';

        $allowedSorts = ['created_at', 'price', 'name', 'sold_count', 'view_count', 'stock_quantity'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Pagination
        $perPage = $filters['per_page'] ?? 12;

        return $query->paginate($perPage);
    }

    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    public function getProductById(int $id): ?Product
    {
        $product = Product::with(['category', 'brand'])->find($id);

        if ($product) {
            // Tăng view count
            $product->increment('view_count');
        }

        return $product;
    }

    /**
     * Tạo sản phẩm mới
     */
    public function createProduct(array $data): Product
    {
        // Auto-generate code nếu không có
        if (empty($data['code'])) {
            $data['code'] = $this->generateProductCode();
        }

        // Xử lý features array
        if (isset($data['features']) && is_string($data['features'])) {
            $data['features'] = json_decode($data['features'], true);
        }

        return Product::create($data);
    }

    /**
     * Cập nhật sản phẩm
     */
    public function updateProduct(int $id, array $data): Product
    {
        $product = Product::findOrFail($id);

        // Xử lý features array
        if (isset($data['features']) && is_string($data['features'])) {
            $data['features'] = json_decode($data['features'], true);
        }

        $product->update($data);

        return $product->fresh(['category', 'brand']);
    }

    /**
     * Xóa sản phẩm
     */
    public function deleteProduct(int $id): bool
    {
        $product = Product::findOrFail($id);

        return $product->delete();
    }

    /**
     * Lấy sản phẩm nổi bật
     */
    public function getFeaturedProducts(int $limit = 8): Collection
    {
        return Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('is_featured', true)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Lấy sản phẩm mới
     */
    public function getNewProducts(int $limit = 8): Collection
    {
        return Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('is_new', true)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Lấy sản phẩm đang sale
     */
    public function getOnSaleProducts(int $limit = 8): Collection
    {
        return Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('is_on_sale', true)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Lấy sản phẩm theo category
     */
    public function getProductsByCategory(int $categoryId, int $limit = 12): Collection
    {
        return Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('category_id', $categoryId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Lấy sản phẩm liên quan (cùng category, khác ID)
     */
    public function getRelatedProducts(int $productId, int $categoryId, int $limit = 4): Collection
    {
        return Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('category_id', $categoryId)
            ->where('id', '!=', $productId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Apply filters vào query
     */
    private function applyFilters($query, array $filters): void
    {
        // Category filter
        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        // Brand filter
        if (!empty($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        // Search by name, code, description
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('code', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        // Price range
        if (!empty($filters['min_price'])) {
            $query->where('price', '>=', $filters['min_price']);
        }
        if (!empty($filters['max_price'])) {
            $query->where('price', '<=', $filters['max_price']);
        }

        // Gender filter
        if (!empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        // Movement type filter
        if (!empty($filters['movement_type'])) {
            $query->where('movement_type', $filters['movement_type']);
        }

        // Materials filters
        if (!empty($filters['case_material'])) {
            $query->where('case_material', 'like', '%' . $filters['case_material'] . '%');
        }
        if (!empty($filters['strap_material'])) {
            $query->where('strap_material', 'like', '%' . $filters['strap_material'] . '%');
        }
        if (!empty($filters['glass_material'])) {
            $query->where('glass_material', 'like', '%' . $filters['glass_material'] . '%');
        }

        // Colors filters
        if (!empty($filters['dial_color'])) {
            $query->where('dial_color', $filters['dial_color']);
        }
        if (!empty($filters['case_color'])) {
            $query->where('case_color', $filters['case_color']);
        }
        if (!empty($filters['strap_color'])) {
            $query->where('strap_color', $filters['strap_color']);
        }

        // Water resistance
        if (!empty($filters['water_resistance'])) {
            $query->where('water_resistance', $filters['water_resistance']);
        }

        // Case size range
        if (!empty($filters['min_case_size'])) {
            $query->where('case_size', '>=', $filters['min_case_size']);
        }
        if (!empty($filters['max_case_size'])) {
            $query->where('case_size', '<=', $filters['max_case_size']);
        }

        // Badge filters
        if (isset($filters['is_featured'])) {
            $query->where('is_featured', filter_var($filters['is_featured'], FILTER_VALIDATE_BOOLEAN));
        }
        if (isset($filters['is_new'])) {
            $query->where('is_new', filter_var($filters['is_new'], FILTER_VALIDATE_BOOLEAN));
        }
        if (isset($filters['is_on_sale'])) {
            $query->where('is_on_sale', filter_var($filters['is_on_sale'], FILTER_VALIDATE_BOOLEAN));
        }
        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // Stock filters
        if (!empty($filters['min_stock'])) {
            $query->where('stock_quantity', '>=', $filters['min_stock']);
        }
        if (isset($filters['in_stock']) && $filters['in_stock']) {
            $query->where('stock_quantity', '>', 0);
        }
        if (isset($filters['low_stock']) && $filters['low_stock']) {
            $query->whereColumn('stock_quantity', '<=', 'min_stock_level');
        }
        if (isset($filters['max_stock'])) {
            $query->where('stock_quantity', '<=', $filters['max_stock']);
        }
    }

    /**
     * Generate unique product code
     */
    private function generateProductCode(): string
    {
        do {
            $code = 'WATCH-' . time() . '-' . rand(1000, 9999);
        } while (Product::where('code', $code)->exists());

        return $code;
    }

    /**
     * Kiểm tra sản phẩm có đủ tồn kho không
     */
    public function checkStock(int $productId, int $quantity = 1): bool
    {
        $product = Product::find($productId);

        if (!$product) {
            return false;
        }

        return $product->stock_quantity >= $quantity;
    }

    /**
     * Giảm số lượng tồn kho
     */
    public function decreaseStock(int $productId, int $quantity): void
    {
        $product = Product::findOrFail($productId);
        $product->decrement('stock_quantity', $quantity);
        $product->increment('sold_count', $quantity);
    }

    /**
     * Tăng số lượng tồn kho (khi hủy đơn)
     */
    public function increaseStock(int $productId, int $quantity): void
    {
        $product = Product::findOrFail($productId);
        $product->increment('stock_quantity', $quantity);
        $product->decrement('sold_count', $quantity);
    }
}
