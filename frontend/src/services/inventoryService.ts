import api from '@/lib/api';

export interface DailyInventoryItem {
  inventory_id?: string;
  menu_item_id: string;
  inventory_date: string;
  quantity_initial: number;
  quantity_remaining: number;
}

export interface InventoryItemWithDetails {
  itemId: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  available: boolean;
  inventoryStatus: {
    inventoryId: string;
    date: string;
    initialQuantity: number;
    quantityRemaining: number;
    stockPercentage: number;
    soldOut: boolean;
  } | null;
}

const inventoryService = {
  // Get all inventory items for today
  getTodayInventory: async (): Promise<DailyInventoryItem[]> => {
    const response = await api.get('/inventory/today');
    return response.data;
  },

  // Set initial inventory for the day
  setTodayInventory: async (inventoryItems: Array<{
    item_id: string;
    quantity_initial: number;
  }>): Promise<DailyInventoryItem[]> => {
    const response = await api.post('/inventory/set-today', { inventoryItems });
    return response.data;
  },

  // Update remaining quantity for a specific inventory item
  updateInventoryQuantity: async (
    inventoryId: string,
    quantityRemaining: number
  ): Promise<DailyInventoryItem> => {
    const response = await api.patch(`/inventory/${inventoryId}`, { quantity_remaining: quantityRemaining });
    return response.data;
  },

  // Bulk update remaining quantities
  bulkUpdateInventory: async (items: Array<{
    inventory_id: string;
    quantity_remaining: number;
  }>): Promise<DailyInventoryItem[]> => {
    const response = await api.patch('/inventory/bulk/update', { items });
    return response.data;
  },

  // Get inventory history
  getInventoryHistory: async (startDate?: string, endDate?: string): Promise<DailyInventoryItem[]> => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/inventory/history?${params.toString()}`);
    return response.data;
  },
};

export default inventoryService;
