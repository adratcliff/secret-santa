import { createRouter, createWebHashHistory } from 'vue-router';

// Route names match the host app so views can navigate the same way in both
const routes = [
  {
    path: '/',
    name: 'secret-santa',
    component: () => import('../views/SantaList.vue')
  },
  {
    path: '/create',
    name: 'secret-santa-create',
    component: () => import('../views/SantaCreate.vue'),
  },
  {
    path: '/:id',
    name: 'secret-santa-draw',
    component: () => import('../views/SantaDraw.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
