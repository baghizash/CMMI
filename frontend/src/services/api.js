import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const user = localStorage.getItem('school_user');
  if (user) {
    const { token } = JSON.parse(user);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = (username, password) =>
  apiClient.post('/api/auth/login', { username, password });

export const logout = () =>
  apiClient.post('/api/auth/logout');

export const getMe = () =>
  apiClient.get('/api/auth/me');

// Students APIs
export const getStudents = (params) =>
  apiClient.get('/api/students', { params });

export const createStudent = (data) =>
  apiClient.post('/api/students', data);

export const updateStudent = (id, data) =>
  apiClient.put(`/api/students/${id}`, data);

export const deleteStudent = (id) =>
  apiClient.delete(`/api/students/${id}`);

export const seedDemo = () =>
  apiClient.post('/api/students/seed-demo');

// Attendance APIs
export const scanAttendance = (data) =>
  apiClient.post('/api/attendance/scan', data);

export const getAttendance = (params) =>
  apiClient.get('/api/attendance', { params });

export const manualAttendance = (data) =>
  apiClient.post('/api/attendance/manual', data);

export const deleteAttendance = (id) =>
  apiClient.delete(`/api/attendance/${id}`);

// Subject Attendance APIs
export const scanSubjectAttendance = (data) =>
  apiClient.post('/api/subject-attendance/scan', data);

export const getSubjectAttendance = (params) =>
  apiClient.get('/api/subject-attendance', { params });

// Schedule APIs
export const getSchedules = (params) =>
  apiClient.get('/api/schedules', { params });

export const createSchedule = (data) =>
  apiClient.post('/api/schedules', data);

export const deleteSchedule = (id) =>
  apiClient.delete(`/api/schedules/${id}`);

// Guru Piket APIs
export const getGuruPiket = (params) =>
  apiClient.get('/api/guru-piket', { params });

export const createGuruPiket = (data) =>
  apiClient.post('/api/guru-piket', data);

export const deleteGuruPiket = (id) =>
  apiClient.delete(`/api/guru-piket/${id}`);

// Dashboard APIs
export const getDashboardStats = (params) =>
  apiClient.get('/api/dashboard/stats', { params });

// Export APIs
export const getExcelExport = (params) => {
  const queryString = new URLSearchParams(params).toString();
  return `${BACKEND_URL}/api/export/excel?${queryString}`;
};

export default apiClient;
