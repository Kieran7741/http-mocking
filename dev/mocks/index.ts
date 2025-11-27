import type { RequestHandler } from 'msw';
import { usersHandlers } from './users/handlers';
import { ordersHandlers } from './orders/handlers';

export const handlersByService: Record<string, RequestHandler[]> = {
  users: usersHandlers,
  orders: ordersHandlers,
};

export const handlers: RequestHandler[] = [...usersHandlers, ...ordersHandlers];
