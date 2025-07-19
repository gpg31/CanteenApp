import api from '@/lib/api';

export interface AnalyticsDashboard {
  stats: {
    totalSales: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    soldOutItems: number;
  };
  popularItems: Array<{
    id: string;
    name: string;
    category: string;
    totalSold: number;
    revenue: number;
  }>;
  salesByHour: Array<{
    hour: number;
    orderCount: number;
    sales: number;
  }>;
  salesByDay: Array<{
    date: string;
    orderCount: number;
    sales: number;
  }>;
}

export interface SalesAnalytics {
  salesData: Array<{
    timeUnit: string;
    orderCount: number;
    totalSales: number;
  }>;
  summary: {
    totalSales: number;
    totalOrders: number;
    averageSalePerOrder: number;
  };
}

export interface PopularItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface PeakTimes {
  byHour: Array<{
    hour: number;
    orderCount: number;
  }>;
  byDayOfWeek: Array<{
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
    orderCount: number;
  }>;
}

const analyticsService = {
  getDashboard: async (): Promise<AnalyticsDashboard> => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  getSalesAnalytics: async (
    startDate?: string,
    endDate?: string,
    groupBy: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<SalesAnalytics> => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('groupBy', groupBy);
    
    const response = await api.get(`/analytics/sales?${params.toString()}`);
    return response.data;
  },

  getPopularItems: async (
    startDate?: string,
    endDate?: string,
    limit: number = 10,
    category?: string
  ): Promise<PopularItem[]> => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('limit', limit.toString());
    if (category) params.append('category', category);
    
    const response = await api.get(`/analytics/popular-items?${params.toString()}`);
    return response.data;
  },

  getPeakTimes: async (startDate?: string, endDate?: string): Promise<PeakTimes> => {
    const params = new URLSearchParams();
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/analytics/peak-times?${params.toString()}`);
    return response.data;
  }
};

export default analyticsService;
