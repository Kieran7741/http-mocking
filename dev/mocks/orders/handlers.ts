import { http, HttpResponse, type RequestHandler } from 'msw';
import { orderFixtures } from './fixtures';
import type { Order } from '../types';

export const ordersHandlers: RequestHandler[] = [
  http.get('/', () => {
    return HttpResponse.json({ data: orderFixtures });
  }),
  http.post('/', async ({ request }) => {
    const body = (await request.json()) as Partial<Order>;
    const id = `o-${Math.floor(Math.random() * 900 + 100)}`;
    const now = new Date().toISOString();
    const created: Order = {
      id,
      userId: body.userId ?? 'u-100',
      total: body.total ?? 0,
      status: body.status ?? 'pending',
      updatedAt: now,
    };
    orderFixtures.unshift(created);
    return new HttpResponse(null, { status: 201, headers: { Location: `/orders/${id}` } });
  }),
];
