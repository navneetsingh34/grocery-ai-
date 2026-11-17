import api from './client';

export async function uploadReceipt(file) {
  const form = new FormData();
  form.append('receipt', file);
  const { data } = await api.post('/receipts/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function listReceipts() {
  const { data } = await api.get('/receipts');
  return data;
}

export async function getReceipt(id) {
  const { data } = await api.get(`/receipts/${id}`);
  return data;
}

export async function reprocessReceipt(id) {
  const { data } = await api.post(`/receipts/${id}/reprocess`);
  return data;
}
