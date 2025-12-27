<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockTransaction;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Import stock (Nhập kho)
     *
     * @param array $items Array of items to import [['product_id' => 1, 'quantity' => 10, 'unit_price' => 100, 'supplier_id' => 1]]
     * @param int $performedBy User ID who performs the import
     * @param string|null $notes Additional notes
     * @return array
     */
    public function importStock(array $items, int $performedBy, ?string $notes = null): array
    {
        DB::beginTransaction();

        try {
            $transactions = [];
            $updatedProducts = [];

            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];
                $unitPrice = (float) $item['unit_price'];
                $supplierId = $item['supplier_id'] ?? null;

                // Create stock transaction
                $transaction = StockTransaction::create([
                    'type' => 'IMPORT',
                    'product_id' => $product->id,
                    'supplier_id' => $supplierId,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'reference_type' => 'MANUAL',
                    'performed_by' => $performedBy,
                    'notes' => $notes,
                    'transaction_date' => now(),
                ]);

                // Update product stock quantity
                $product->stock_quantity += $quantity;

                // Update cost price (weighted average)
                if ($product->stock_quantity > 0) {
                    $oldValue = ($product->cost_price ?? 0) * ($product->stock_quantity - $quantity);
                    $newValue = $unitPrice * $quantity;
                    $product->cost_price = ($oldValue + $newValue) / $product->stock_quantity;
                }

                $product->save();

                $transactions[] = $transaction;
                $updatedProducts[] = $product;
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Import stock successfully',
                'transactions' => $transactions,
                'products' => $updatedProducts,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Export stock (Xuất kho)
     *
     * @param array $items Array of items to export [['product_id' => 1, 'quantity' => 5]]
     * @param int $performedBy User ID who performs the export
     * @param string|null $referenceType Type of reference (ORDER, MANUAL, etc.)
     * @param int|null $referenceId Reference ID (order_id if from order)
     * @param string|null $notes Additional notes
     * @return array
     */
    public function exportStock(
        array $items,
        int $performedBy,
        ?string $referenceType = 'MANUAL',
        ?int $referenceId = null,
        ?string $notes = null
    ): array {
        DB::beginTransaction();

        try {
            // First, validate all items have sufficient stock
            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];

                if ($product->stock_quantity < $quantity) {
                    throw new \Exception("Insufficient stock for product '{$product->name}'. Available: {$product->stock_quantity}, Requested: {$quantity}");
                }
            }

            $transactions = [];
            $updatedProducts = [];

            // Process export
            foreach ($items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];

                // Create stock transaction
                $transaction = StockTransaction::create([
                    'type' => 'EXPORT',
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'performed_by' => $performedBy,
                    'notes' => $notes,
                    'transaction_date' => now(),
                ]);

                // Update product stock quantity
                $product->stock_quantity -= $quantity;
                $product->save();

                $transactions[] = $transaction;
                $updatedProducts[] = $product;
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Export stock successfully',
                'transactions' => $transactions,
                'products' => $updatedProducts,
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get low stock products (below minimum level)
     */
    public function getLowStockProducts()
    {
        return Product::whereColumn('stock_quantity', '<=', 'min_stock_level')
            ->where('is_active', true)
            ->with(['category', 'brand', 'supplier'])
            ->get();
    }

    /**
     * Get stock report by product
     */
    public function getStockReport(array $filters = [])
    {
        $query = Product::with(['category', 'brand', 'supplier']);

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['brand_id'])) {
            $query->where('brand_id', $filters['brand_id']);
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['low_stock']) && $filters['low_stock']) {
            $query->whereColumn('stock_quantity', '<=', 'min_stock_level');
        }

        return $query->get();
    }

    /**
     * Get transaction history
     */
    public function getTransactionHistory(array $filters = [])
    {
        $query = StockTransaction::with(['product', 'supplier', 'performedBy'])
            ->orderBy('transaction_date', 'desc');

        if (isset($filters['product_id'])) {
            $query->where('product_id', $filters['product_id']);
        }

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['supplier_id'])) {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        if (isset($filters['from_date'])) {
            $query->where('transaction_date', '>=', $filters['from_date']);
        }

        if (isset($filters['to_date'])) {
            $query->where('transaction_date', '<=', $filters['to_date']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }
}
