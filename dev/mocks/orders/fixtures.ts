import type { Order } from '../types';

export const orderFixtures: Order[] = [
  { id: 'o-200', userId: 'u-100', total: 125.5, status: 'fulfilled', updatedAt: '2023-10-30T12:30:00Z' },
  { id: 'o-201', userId: 'u-101', total: 79.99, status: 'pending', updatedAt: '2023-10-30T13:12:00Z' },
];
