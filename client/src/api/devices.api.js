import { api } from './client';

export const lookupDevice = (serial) => api.get('/devices/lookup', { serial }).then((r) => r.data);
export const createDevice = (payload) => api.post('/devices', payload).then((r) => r.data);
