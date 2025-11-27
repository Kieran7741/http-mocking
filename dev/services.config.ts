export type ServiceConfig = {
  id: string;
  label: string;
  route: string;
  targetEnv: string;
  stripPrefix?: boolean;
  pathRewriteTo?: string;
};

export const services: ServiceConfig[] = [
  {
    id: 'users',
    label: 'Users API',
    route: '/api/users',
    targetEnv: 'USERS_SERVICE_URL',
    stripPrefix: true,
  },
  {
    id: 'orders',
    label: 'Orders API',
    route: '/api/orders',
    targetEnv: 'ORDERS_SERVICE_URL',
    stripPrefix: true,
  },
];

export const defaultPort = 5175;
