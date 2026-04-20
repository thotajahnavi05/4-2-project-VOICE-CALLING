import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'default',
  },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// Calls
export const createCall = (data) => api.post('/calls', data);
export const getCalls = (refresh = false) => api.get(`/calls${refresh ? '?refresh=true' : ''}`);
export const getCall = (id) => api.get(`/calls/${id}`);
export const stopCall = (id) => api.delete(`/calls/${id}`);

// Assistants
export const createAssistant = (data) => api.post('/assistants', data);
export const getAssistants = () => api.get('/assistants');
export const getAssistant = (id) => api.get(`/assistants/${id}`);
export const updateAssistant = (id, data) => api.put(`/assistants/${id}`, data);
export const deleteAssistant = (id) => api.delete(`/assistants/${id}`);

// Campaigns
export const createCampaign = (data) => api.post('/campaigns', data);
export const getCampaigns = () => api.get('/campaigns');
export const startCampaign = (id) => api.post(`/campaigns/${id}/start`);
export const pauseCampaign = (id) => api.post(`/campaigns/${id}/pause`);
export const deleteCampaign = (id) => api.delete(`/campaigns/${id}`);

// Bookings
export const processTranscript = (data) => api.post('/booking/process-transcript', data);
export const getBookings = (params) => api.get('/booking', { params });
export const getBookingStats = () => api.get('/booking/stats');
export const createBookingManual = (data) => api.post('/booking/create', data);
export const checkAvailability = (data) => api.post('/booking/availability', data);

// Transcripts
export const getTranscripts = () => api.get('/bolna/transcripts');
export const getTranscript = (id) => api.get(`/bolna/transcripts/${id}`);

// Executions
export const getExecution = (id) => api.get(`/bolna/executions/${id}`);

// Bolna
export const getBolnaVoices = () => api.get('/bolna/voices');
export const getBolnaModels = () => api.get('/bolna/models');
export const getBolnaPhoneNumbers = () => api.get('/bolna/phone-numbers');

// Health
export const getHealth = () => api.get('/health');

export default api;
