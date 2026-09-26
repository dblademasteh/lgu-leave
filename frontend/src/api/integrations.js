import { api } from './client.js';

export const integrationsApi = {
  testHrms: () => api.post('/api/v1/settings/integrations/test-hrms').then(r => r.data),
  testAttendance: () => api.post('/api/v1/settings/integrations/test-attendance').then(r => r.data),
  syncLogs: (limit = 20) => api.get('/api/v1/settings/integrations/sync-logs', { params: { limit } }).then(r => r.data),
  syncAllToAttendance: () => api.post('/api/v1/leaves/sync-attendance').then(r => r.data),
  syncAllToHrms: () => api.post('/api/v1/leaves/sync-hrms').then(r => r.data),
};
