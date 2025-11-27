export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
};

export type OrderStatus = 'pending' | 'fulfilled' | 'cancelled';

export type Order = {
  id: string;
  userId: string;
  total: number;
  status: OrderStatus;
  updatedAt: string;
};

export type Fixtures = {
  users: User[];
  orders: Order[];
};
