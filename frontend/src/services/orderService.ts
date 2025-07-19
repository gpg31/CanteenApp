import supabase from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface OrderUser {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  vendor_id: string;
  total_amount: number;
  status: string;
  order_date: string;
  items: OrderItem[];
  user?: OrderUser;
}

export interface OrderItem {
  item_id: string;
  name: string;
  quantity: number;
  price_at_order: number;
  menu_item?: {
    name: string;
    price: number;
  };
}

const orderService = {
  createOrder: async (vendorId: string, items: { itemId: string; quantity: number }[]): Promise<Order> => {
    try {
      // Start a Supabase transaction using RPC
      const { data: order, error } = await supabase.rpc('create_order', {
        p_vendor_id: vendorId,
        p_items: items
      });

      if (error) throw error;
      return order;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create order');
    }
  },

  getOrder: async (orderId: string): Promise<Order> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            menu_item:menu_items (
              name,
              price
            )
          )
        `)
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Order not found');
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch order');
    }
  },

  getUserOrders: async (status?: string): Promise<Order[]> => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            menu_item:menu_items (
              name,
              price
            )
          )
        `)
        .order('order_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch orders');
    }
  },

  getVendorOrders: async (status?: string): Promise<Order[]> => {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            *,
            menu_item:menu_items (
              name,
              price
            )
          ),
          user:users (
            name,
            email,
            phone
          )
        `)
        .order('order_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch vendor orders');
    }
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<Order> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('order_id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update order status');
    }
  },

  // Subscribe to order updates
  subscribeToOrder: (orderId: string, callback: (order: Order) => void) => {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          callback(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};

export default orderService;
