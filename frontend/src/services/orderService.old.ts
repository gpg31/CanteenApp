import api from '@/lib/api';

export interface OrderItem {
  order_item_id?: string;
  item_id: string;
  name: string;
  quantity: number;
  price_at_order: number;
}

export interface Order {
  order_id?: string;
  user_id?: string;
  order_date?: string;
  total_amount: number;
  status?: 'placed' | 'preparing' | 'ready_for_pickup' | 'completed' | 'cancelled';
  pickup_slot: string; // Time in HH:MM format
  items: OrderItem[];
  payment?: {
    payment_id?: string;
    payment_method: 'UPI' | 'Cash';
    status: 'pending' | 'successful' | 'failed';
    amount: number;
  };
}

const orderService = {
  // Customer endpoints
  placeOrder: async (order: Omit<Order, 'order_id' | 'user_id' | 'order_date' | 'status'>): Promise<Order> => {
    const response = await api.post('/orders', order);
    return response.data;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  // Vendor endpoints
  getAllOrders: async (filters?: { status?: string; date?: string; startDate?: string; endDate?: string }): Promise<Order[]> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    const response = await api.get(`/vendor/orders?${params.toString()}`);
    return response.data;
  },

  getActiveOrders: async (): Promise<Order[]> => {
    const response = await api.get('/vendor/orders/active');
    return response.data;
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    const response = await api.patch(`/vendor/orders/${id}/status`, { status });
    return response.data;
  },

  getOrderStats: async (): Promise<any> => {
    const response = await api.get('/vendor/orders/stats/dashboard');
    return response.data;
  }
};

export default orderService;
