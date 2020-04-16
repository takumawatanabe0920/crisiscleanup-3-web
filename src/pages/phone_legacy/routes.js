import Index from '@/pages/phone_legacy/Index';

const routes = [
  {
    path: '/caller',
    component: Index,
    name: 'nav.phone',
    meta: {
      id: 'caller',
      layout: 'authenticated',
      can: 'phone_agent',
      fail: '$from',
    },
  },
];

export default routes;