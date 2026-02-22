import { orderClient, handleApiError } from './api';

export interface CreateOrderInput {
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    image?: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  payment: {
    method: 'cod' | 'card' | 'upi' | 'wallet';
    status?: 'pending' | 'completed' | 'failed';
  };
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    image?: string;
    size?: string;
    quantity: number;
    price: number;
  }>;
  deliveryAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  payment: {
    method: string;
    status: string;
    transactionId?: string;
    paidAt?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDelivery?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

class OrderService {
  async createOrder(data: CreateOrderInput): Promise<Order> {
    try {
      const response = await orderClient.post('/', data);
      return response.data.order;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    try {
      const response = await orderClient.get('/', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async getOrderById(orderId: string, userId: string): Promise<Order> {
    try {
      const response = await orderClient.get(`/${orderId}`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    userId?: string
  ): Promise<Order> {
    try {
      const response = await orderClient.patch(
        `/${orderId}/status`,
        { status },
        { params: userId ? { userId } : {} }
      );
      return response.data.order;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'cancelled', userId);
  }
}

export const orderService = new OrderService();
