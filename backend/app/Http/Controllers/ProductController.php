<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Controllers\Controller;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    protected $cloudinaryService;
    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }
    public function index(Request $request)
    {
        try {
            $query = Product::with(['category', 'brand']);

            // Admin có thể xem tất cả, user chỉ xem active
            if (!$request->user() || $request->user()->role !== 'ADMIN') {
                $query->where('is_active', true);
            }

            // Filter by category
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            // Filter by brand
            if ($request->has('brand_id')) {
                $query->where('brand_id', $request->brand_id);
            }

            // Price range filter
            if ($request->has('min_price')) {
                $query->where('price', '>=', $request->min_price);
            }
            if ($request->has('max_price')) {
                $query->where('price', '<=', $request->max_price);
            }

            // Gender filter
            if ($request->has('gender')) {
                $query->where('gender', $request->gender);
            }

            // Movement type filter
            if ($request->has('movement_type')) {
                $query->where('movement_type', $request->movement_type);
            }

            // Material filters
            if ($request->has('case_material')) {
                $query->where('case_material', 'like', '%' . $request->case_material . '%');
            }
            if ($request->has('strap_material')) {
                $query->where('strap_material', 'like', '%' . $request->strap_material . '%');
            }
            if ($request->has('glass_material')) {
                $query->where('glass_material', 'like', '%' . $request->glass_material . '%');
            }

            // Color filters
            if ($request->has('dial_color')) {
                $query->where('dial_color', $request->dial_color);
            }

            // Water resistance filter
            if ($request->has('water_resistance')) {
                $query->where('water_resistance', $request->water_resistance);
            }

            // Case size range
            if ($request->has('min_case_size')) {
                $query->where('case_size', '>=', $request->min_case_size);
            }
            if ($request->has('max_case_size')) {
                $query->where('case_size', '<=', $request->max_case_size);
            }

            // Badge filters
            if ($request->has('is_featured')) {
                $query->where('is_featured', $request->is_featured);
            }
            if ($request->has('is_new')) {
                $query->where('is_new', $request->is_new);
            }
            if ($request->has('is_on_sale')) {
                $query->where('is_on_sale', $request->is_on_sale);
            }

            // Search by name or code
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('code', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Stock filters
            if ($request->has('min_stock')) {
                $query->where('stock_quantity', '>=', $request->min_stock);
            }
            if ($request->has('in_stock')) {
                $query->where('stock_quantity', '>', 0);
            }
            if ($request->has('low_stock')) {
                $query->whereColumn('stock_quantity', '<=', 'min_stock_level');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            // Allow sorting by popular fields
            $allowedSorts = ['created_at', 'price', 'name', 'sold_count', 'view_count', 'stock_quantity'];
            if (in_array($sortBy, $allowedSorts)) {
                $query->orderBy($sortBy, $sortOrder);
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->get('per_page', 12);
            $products = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch products',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                // Foreign Keys
                'category_id' => 'required|exists:categories,id',
                'brand_id' => 'required|exists:brands,id',

                // Basic Information
                'code' => 'nullable|string|max:50|unique:products,code',
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|unique:products,slug',
                'description' => 'nullable|string',

                // Pricing
                'price' => 'required|numeric|min:0',
                'original_price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',

                // Inventory Management
                'stock_quantity' => 'required|integer|min:0',
                'min_stock_level' => 'nullable|integer|min:0',
                'reorder_point' => 'nullable|integer|min:0',

                // Product Details
                'warranty_period' => 'nullable|string|max:50',
                'origin_country' => 'nullable|string|max:100',
                'gender' => 'nullable|in:Nam,Nữ,Unisex',

                // Movement (Bộ máy)
                'movement_type' => 'nullable|in:Quartz,Automatic,Manual,Solar',
                'movement_name' => 'nullable|string|max:100',
                'power_reserve' => 'nullable|string|max:50',

                // Materials (Chất liệu)
                'case_material' => 'nullable|string|max:100',
                'strap_material' => 'nullable|string|max:100',
                'glass_material' => 'nullable|string|max:100',

                // Colors
                'dial_color' => 'nullable|string|max:50',
                'case_color' => 'nullable|string|max:50',
                'strap_color' => 'nullable|string|max:50',

                // Water Resistance
                'water_resistance' => 'nullable|string|max:50',

                // Battery
                'battery_type' => 'nullable|string|max:50',
                'battery_voltage' => 'nullable|string|max:20',

                // Technical Specifications
                'case_size' => 'nullable|numeric|min:0',
                'case_thickness' => 'nullable|numeric|min:0',
                'weight' => 'nullable|numeric|min:0',

                // Features & Images
                'features' => 'nullable|array',
                'image' => 'nullable|image|max:2048',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Auto-generate code if not provided
            if (!isset($validated['code'])) {
                $validated['code'] = 'WATCH-' . time() . '-' . rand(1000, 9999);
            }

            // Auto-generate slug from name if not provided
            if (!isset($validated['slug']) && isset($validated['name'])) {
                $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
            }

            // Handle image upload
            if ($request->hasFile('image')) {
                $uploadedImage = $this->cloudinaryService->upload($request->file('image'), 'watch-store/products');
                $validated['images'] = [$uploadedImage];
            }
            elseif ($request->hasFile('images')) {
                $uploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');
                $validated['images'] = $uploadedImages;
            }

            $product = Product::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->load(['category', 'brand']),
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
                'message' => 'Failed to create product',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $id)
    {
        try {
            $product = Product::with(['category', 'brand'])->findOrFail($id);

            // Increment view count
            $product->increment('view_count');

            return response()->json([
                'success' => true,
                'data' => $product,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }
    }

    public function update(Request $request, string $id) {
        try {
            $product = Product::findOrFail($id);
            $validated = $request->validate([
                // Foreign Keys
                'category_id' => 'nullable|exists:categories,id',
                'brand_id' => 'nullable|exists:brands,id',

                // Basic Information
                'code' => 'nullable|string|max:50|unique:products,code,' . $id,
                'name' => 'nullable|string|max:255',
                'slug' => 'nullable|string|max:255|unique:products,slug,' . $id,
                'description' => 'nullable|string',

                // Pricing
                'price' => 'nullable|numeric|min:0',
                'original_price' => 'nullable|numeric|min:0',
                'cost_price' => 'nullable|numeric|min:0',

                // Inventory Management
                'stock_quantity' => 'nullable|integer|min:0',
                'min_stock_level' => 'nullable|integer|min:0',
                'reorder_point' => 'nullable|integer|min:0',

                // Product Details
                'warranty_period' => 'nullable|string|max:50',
                'origin_country' => 'nullable|string|max:100',
                'gender' => 'nullable|in:Nam,Nữ,Unisex',

                // Movement (Bộ máy)
                'movement_type' => 'nullable|in:Quartz,Automatic,Manual,Solar',
                'movement_name' => 'nullable|string|max:100',
                'power_reserve' => 'nullable|string|max:50',

                // Materials (Chất liệu)
                'case_material' => 'nullable|string|max:100',
                'strap_material' => 'nullable|string|max:100',
                'glass_material' => 'nullable|string|max:100',

                // Colors
                'dial_color' => 'nullable|string|max:50',
                'case_color' => 'nullable|string|max:50',
                'strap_color' => 'nullable|string|max:50',

                // Water Resistance
                'water_resistance' => 'nullable|string|max:50',

                // Battery
                'battery_type' => 'nullable|string|max:50',
                'battery_voltage' => 'nullable|string|max:20',

                // Technical Specifications
                'case_size' => 'nullable|numeric|min:0',
                'case_thickness' => 'nullable|numeric|min:0',
                'weight' => 'nullable|numeric|min:0',

                // Features & Images
                'features' => 'nullable|array',
                'image' => 'nullable|image|max:2048',
                'images' => 'nullable|array',
                'images.*' => 'image|max:2048',
                'specifications' => 'nullable|array',

                // Status & Badges
                'is_new' => 'nullable|boolean',
                'is_on_sale' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
            ]);

            // Auto-generate slug from name if name is updated but slug is not provided
            if (isset($validated['name']) && !isset($validated['slug'])) {
                $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);
            }

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old images from Cloudinary
                if ($product->images && is_array($product->images)) {
                    foreach ($product->images as $image) {
                        if (isset($image['public_id'])) {
                            $this->cloudinaryService->delete($image['public_id']);
                        }
                    }
                }
                $uploadedImage = $this->cloudinaryService->upload($request->file('image'), 'watch-store/products');
                $validated['images'] = [$uploadedImage];
            }
            elseif ($request->hasFile('images')) {
                if ($product->images && is_array($product->images)) {
                    foreach ($product->images as $image) {
                        if (isset($image['public_id'])) {
                            $this->cloudinaryService->delete($image['public_id']);
                        }
                    }
                }
                $uploadedImages = $this->cloudinaryService->uploadMultiple($request->file('images'), 'watch-store/products');
                $validated['images'] = $uploadedImages;
            }

            $product->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product->load(['category', 'brand']),
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
                'message' => 'Failed to update product',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(string $id) {
        try {
            $product = Product::findOrFail($id);
            if ($product->images && is_array($product->images)) {
                foreach ($product->images as $image) {
                    if (isset($image['public_id'])) {
                        $this->cloudinaryService->delete($image['public_id']);
                    }
                }
            }
            $product->delete();
            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
