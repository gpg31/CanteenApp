import api from '@/lib/api';

export interface MenuItem {
  item_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

const menuService = {
  getAllItems: async (): Promise<MenuItem[]> => {
    const response = await api.get('/menu');
    return response.data;
  },

  getItemsByCategory: async (category: string): Promise<MenuItem[]> => {
    const response = await api.get(`/menu/category/${category}`);
    return response.data;
  },

  getItemById: async (id: string): Promise<MenuItem> => {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  // For vendors only
  createItem: async (item: Omit<MenuItem, 'item_id'>): Promise<MenuItem> => {
    const response = await api.post('/vendor/menu', item);
    return response.data;
  },

  // For vendors only
  updateItem: async (id: string, item: Partial<MenuItem>): Promise<MenuItem> => {
    const response = await api.put(`/vendor/menu/${id}`, item);
    return response.data;
  },

  // For vendors only
  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/vendor/menu/${id}`);
  },

  // For vendors only
  toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
    const response = await api.patch(`/vendor/menu/${id}/toggle-availability`, {
      is_available: isAvailable
    });
    return response.data;
  },

  // For vendors only
  bulkUpdateAvailability: async (items: { item_id: string; is_available: boolean }[]): Promise<MenuItem[]> => {
    const response = await api.patch('/vendor/menu/bulk/availability', { items });
    return response.data;
  }
};

export default menuService;
