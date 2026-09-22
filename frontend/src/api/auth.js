import { api } from './client.js';

export async function login(employeeNumber, password) {
  const { data } = await api.post('/auth/login', { employeeNumber, password });
  localStorage.setItem('lgu-leave-auth', JSON.stringify(data));
  return data;
}

export function logout() {
  localStorage.removeItem('lgu-leave-auth');
}
