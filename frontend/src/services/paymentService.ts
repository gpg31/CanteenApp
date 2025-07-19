import supabase from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface Payment {
  payment_id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
}

const paymentService = {
  createPayment: async (orderId: string, amount: number, paymentMethod: string): Promise<Payment> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([{
          order_id: orderId,
          amount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          payment_date: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to create payment');
    }
  },

  getPayment: async (paymentId: string): Promise<Payment> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders (
            order_id,
            order_date,
            status,
            total_amount
          )
        `)
        .eq('payment_id', paymentId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Payment not found');
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch payment');
    }
  },

  getUserPayments: async (): Promise<Payment[]> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          order:orders (
            order_id,
            order_date,
            status,
            total_amount
          )
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch payments');
    }
  },

  updatePaymentStatus: async (paymentId: string, status: string): Promise<Payment> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({ payment_status: status })
        .eq('payment_id', paymentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to update payment status');
    }
  },

  // Get payment for an order
  getOrderPayment: async (orderId: string): Promise<Payment> => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select()
        .eq('order_id', orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Payment not found for this order');
      return data;
    } catch (error) {
      if (error instanceof PostgrestError) {
        throw new Error(error.message);
      }
      throw new Error('Failed to fetch order payment');
    }
  },

  // Subscribe to payment status updates
  subscribeToPayment: (paymentId: string, callback: (payment: Payment) => void) => {
    const subscription = supabase
      .channel(`payment-${paymentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `payment_id=eq.${paymentId}`
        },
        (payload) => {
          callback(payload.new as Payment);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};

export default paymentService;
