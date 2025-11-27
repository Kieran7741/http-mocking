import { http, HttpResponse, type RequestHandler } from 'msw';
import { userFixtures } from './fixtures';

export const usersHandlers: RequestHandler[] = [
  http.get('/', () => {
    return HttpResponse.json({ data: userFixtures });
  }),
  http.get('/:id', ({ params }) => {
    const userId = params?.id?.toString();
    if (!userId) return new HttpResponse(null, { status: 404 });
    const user = userFixtures.find((u) => u.id === userId);
    if (!user) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(user);
  }),
];
