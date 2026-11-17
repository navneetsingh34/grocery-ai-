import api from './client';

export async function getSpending() {
  const { data } = await api.get('/dashboard/spending');
  return data;
}

export async function getRecommendations() {
  const { data } = await api.get('/dashboard/recommendations');
  return data;
}

export async function dismissRecommendation(id) {
  const { data } = await api.post(`/recommendations/${id}/dismiss`);
  return data;
}

export async function getShoppingList() {
  const { data } = await api.get('/shopping-list');
  return data;
}
