<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // Foreign Keys
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('brand_id')->constrained()->onDelete('cascade');
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->onDelete('set null')->comment('Nhà cung cấp');

            // Basic Information
            $table->string('code', 50)->unique()->comment('Mã sản phẩm duy nhất');
            $table->string('name', 255)->comment('Tên sản phẩm');
            $table->text('description')->nullable()->comment('Mô tả chi tiết');

            // Pricing
            $table->decimal('price', 15, 2)->comment('Giá bán hiện tại (VNĐ)');
            $table->decimal('original_price', 15, 2)->nullable()->comment('Giá gốc trước giảm (VNĐ)');
            $table->decimal('cost_price', 15, 2)->nullable()->comment('Giá vốn nhập (VNĐ)');

            // Inventory Management
            $table->integer('stock_quantity')->default(0)->comment('Số lượng tồn kho');
            $table->integer('min_stock_level')->default(10)->comment('Mức tồn kho tối thiểu');
            $table->integer('reorder_point')->default(5)->comment('Điểm đặt hàng lại');

            // Product Details
            $table->string('warranty_period', 50)->nullable()->comment('Thời gian bảo hành (VD: 12 tháng)');
            $table->string('origin_country', 100)->nullable()->comment('Quốc gia sản xuất');
            $table->string('gender', 20)->nullable()->comment('Giới tính (Nam/Nữ/Unisex)');

            // Movement (Bộ máy)
            $table->enum('movement_type', ['Quartz', 'Automatic', 'Manual', 'Solar'])->nullable()->comment('Loại bộ máy');
            $table->string('movement_name', 100)->nullable()->comment('Tên bộ máy cụ thể (VD: Miyota 2035)');
            $table->string('power_reserve', 50)->nullable()->comment('Trữ cót (VD: 48 hours)');

            // Materials (Chất liệu)
            $table->string('case_material', 100)->nullable()->comment('Chất liệu vỏ (VD: Thép không gỉ 316L)');
            $table->string('strap_material', 100)->nullable()->comment('Chất liệu dây (VD: Da thật)');
            $table->string('glass_material', 100)->nullable()->comment('Chất liệu kính (VD: Sapphire)');

            // Colors
            $table->string('dial_color', 50)->nullable()->comment('Màu mặt số');
            $table->string('case_color', 50)->nullable()->comment('Màu vỏ');
            $table->string('strap_color', 50)->nullable()->comment('Màu dây');

            // Water Resistance
            $table->string('water_resistance', 50)->nullable()->comment('Mức chống nước (VD: 3 ATM, 5 ATM)');

            // Battery (cho đồng hồ Quartz)
            $table->string('battery_type', 50)->nullable()->comment('Loại pin (VD: SR626SW)');
            $table->string('battery_voltage', 20)->nullable()->comment('Điện áp pin (VD: 1.5V)');

            // Technical Specifications
            $table->decimal('case_size', 6, 2)->nullable()->comment('Đường kính vỏ (mm)');
            $table->decimal('case_thickness', 6, 2)->nullable()->comment('Độ dày (mm)');
            $table->decimal('weight', 8, 2)->nullable()->comment('Trọng lượng (gram)');

            // Features (JSON array)
            $table->json('features')->nullable()->comment('Danh sách tính năng (Chronograph, Date Display, GMT...)');

            // Images (JSON array)
            $table->json('images')->nullable()->comment('Danh sách hình ảnh sản phẩm');

            // Additional Specifications (JSON for flexibility)
            $table->json('specifications')->nullable()->comment('Thông số kỹ thuật bổ sung');

            // Status & Badges
            $table->boolean('is_new')->default(false)->comment('Hiển thị badge NEW');
            $table->boolean('is_on_sale')->default(false)->comment('Hiển thị badge SALE');
            $table->boolean('is_featured')->default(false)->comment('Sản phẩm nổi bật');
            $table->boolean('is_active')->default(true)->comment('Hiển thị trên web');

            // Statistics
            $table->integer('sold_count')->default(0)->comment('Số lượng đã bán');
            $table->unsignedInteger('view_count')->default(0)->comment('Số lượt xem');

            // Reviews
            $table->decimal('average_rating', 3, 2)->default(0)->comment('Điểm đánh giá trung bình (0-5)');
            $table->unsignedInteger('review_count')->default(0)->comment('Số lượng đánh giá');

            // Timestamps
            $table->timestamps();

            // Indexes
            $table->index('name');
            $table->index(['brand_id', 'is_active']);
            $table->index(['category_id', 'is_active']);
            $table->index(['price', 'stock_quantity']);
            $table->index(['is_new', 'is_on_sale']);
            $table->index('movement_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
