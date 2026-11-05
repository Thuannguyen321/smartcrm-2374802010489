import { api } from './client';

export const listCategories = () => api.get('/catalog/categories').then((r) => r.data);
export const listProducts = () => api.get('/catalog/products').then((r) => r.data);
