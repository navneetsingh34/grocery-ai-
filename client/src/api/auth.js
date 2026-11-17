import api from './client';

export async function register(data) {
  const { data: res } = await api.post('/auth/register', data);
  return res;
}

export async function login(data) {
  const { data: res } = await api.post('/auth/login', data);
  return res;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}
