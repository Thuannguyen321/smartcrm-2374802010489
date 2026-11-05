import { api } from './client';

export const lookupCustomer = (phone) => api.get('/customers/lookup', { phone }).then((r) => r.data);
export const listCustomers = (params) => api.get('/customers', params);
export const createCustomer = (payload) => api.post('/customers', payload).then((r) => r.data);
export const updateCustomer = (id, payload) => api.put(`/customers/${id}`, payload).then((r) => r.data);
export const deleteCustomer = (id) => api.del(`/customers/${id}`);
export const listCustomerDevices = (id) => api.get(`/customers/${id}/devices`).then((r) => r.data);
