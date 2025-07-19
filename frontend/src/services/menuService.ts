import supabase from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface MenuItem {
  item_id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  category?: MenuCategory;
  image_url: string | null;
  is_available: boolean;
  vendor_id: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description: string;
}

const menuService = {
  getAllItems: async (vendorId?: string): Promise<MenuItem[]> => {
    try {
      let query = supabase
        .from('menu_items')
        .select(`
          *,
          category:categories (
            id,
            name,
            description
          )
        `)
        .eq('is_available', true);

      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch menu items');
    }
  },

  getItemById: async (itemId: string): Promise<MenuItem> => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories (
            id,
            name,
            description
          )
        `)
        .eq('item_id', itemId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Item not found');
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch menu item');
    }
  },

  getCategories: async (): Promise<MenuCategory[]> => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  // Vendor operations
  createItem: async (item: Omit<MenuItem, 'item_id'>): Promise<MenuItem> => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create menu item');
    }
  },

  updateItem: async (itemId: string, updates: Partial<MenuItem>): Promise<MenuItem> => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update menu item');
    }
  },

  deleteItem: async (itemId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('item_id', itemId);

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete menu item');
    }
  },

  updateAvailability: async (itemId: string, isAvailable: boolean): Promise<MenuItem> => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('item_id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update item availability');
    }
  },

  bulkUpdateAvailability: async (updates: { itemId: string; isAvailable: boolean }[]): Promise<void> => {
    try {
      const { error } = await supabase.rpc('update_menu_items_availability', {
        items: updates.map(u => ({
          id: u.itemId,
          is_available: u.isAvailable
        }))
      });

      if (error) throw error;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update items availability');
    }
  }
};

export default menuService;
