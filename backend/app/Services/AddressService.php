<?php

namespace App\Services;

use App\Models\Address;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AddressService
{
    /**
     * Lấy tất cả địa chỉ của user
     */
    public function getUserAddresses(int $userId): Collection
    {
        return Address::where('user_id', $userId)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Lấy địa chỉ mặc định của user
     */
    public function getDefaultAddress(int $userId): ?Address
    {
        return Address::where('user_id', $userId)
            ->where('is_default', true)
            ->first();
    }

    /**
     * Tạo địa chỉ mới
     */
    public function createAddress(int $userId, array $data): Address
    {
        $data['user_id'] = $userId;

        DB::beginTransaction();
        try {
            // Nếu set is_default = true, bỏ default của các địa chỉ khác
            if (isset($data['is_default']) && $data['is_default']) {
                Address::where('user_id', $userId)
                    ->update(['is_default' => false]);
            } else {
                // Nếu là địa chỉ đầu tiên, tự động set default
                $existingCount = Address::where('user_id', $userId)->count();
                if ($existingCount === 0) {
                    $data['is_default'] = true;
                }
            }

            $address = Address::create($data);

            DB::commit();

            return $address;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cập nhật địa chỉ
     */
    public function updateAddress(int $userId, int $addressId, array $data): Address
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Nếu set is_default = true, bỏ default của các địa chỉ khác
            if (isset($data['is_default']) && $data['is_default']) {
                Address::where('user_id', $userId)
                    ->where('id', '!=', $addressId)
                    ->update(['is_default' => false]);
            }

            $address->update($data);

            DB::commit();

            return $address->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Set địa chỉ làm mặc định
     */
    public function setDefaultAddress(int $userId, int $addressId): Address
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Bỏ default của các địa chỉ khác
            Address::where('user_id', $userId)
                ->where('id', '!=', $addressId)
                ->update(['is_default' => false]);

            // Set địa chỉ này làm default
            $address->update(['is_default' => true]);

            DB::commit();

            return $address->fresh();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Xóa địa chỉ
     */
    public function deleteAddress(int $userId, int $addressId): void
    {
        $address = Address::where('id', $addressId)
            ->where('user_id', $userId)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $wasDefault = $address->is_default;
            $address->delete();

            // Nếu xóa địa chỉ default, set địa chỉ khác làm default
            if ($wasDefault) {
                $nextAddress = Address::where('user_id', $userId)->first();
                if ($nextAddress) {
                    $nextAddress->update(['is_default' => true]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
