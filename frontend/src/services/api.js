import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // DISABLE sending cookies
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const user = localStorage.getItem('school_user');
  console.log('Request interceptor - stored user:', user);
  if (user) {
    const { token } = JSON.parse(user);
    console.log('Adding token to request:', token);
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.log('No user token found in localStorage');
  }
  return config;
});

// Add response interceptor untuk catch errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response OK:', response.config.url, response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = (username, password) =>
  apiClient.post('/api/auth/login', { username, password });

export const logout = () =>
  apiClient.post('/api/auth/logout');

export const getMe = () =>
  apiClient.get('/api/auth/me');

export const changePassword = (data) =>
  apiClient.post('/api/auth/change-password', data);

// User Management APIs (Admin)
export const getUsers = () => apiClient.get('/api/users');
export const createUser = (data) => apiClient.post('/api/users', data);
export const updateUser = (id, data) => apiClient.put(`/api/users/${id}`, data);
export const deleteUser = (id) => apiClient.delete(`/api/users/${id}`);

// Students APIs
export const getStudents = (params) =>
  apiClient.get('/api/students', { params });

export const createStudent = (data) =>
  apiClient.post('/api/students', data);

export const importStudents = (students) =>
  apiClient.post('/api/students/import', { students });

export const promoteClass = (data) =>
  apiClient.post('/api/students/promote-class', data);

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

// Teacher Assignments APIs
export const getTeacherAssignments = () => apiClient.get('/api/teacher-assignments');
export const createTeacherAssignment = (data) => apiClient.post('/api/teacher-assignments', data);
export const deleteTeacherAssignment = (id) => apiClient.delete(`/api/teacher-assignments/${id}`);
export const getMyTeacherScope = () => apiClient.get('/api/teacher-assignments/my-scope');

// Grades APIs
export const getGrades = (params) => apiClient.get('/api/grades', { params });
export const getGroupedGrades = (params) => apiClient.get('/api/grades/grouped', { params });
export const postBatchGrades = (data) => apiClient.post('/api/grades/batch', data);
export const getStudentGrades = (studentId) => apiClient.get(`/api/grades/student/${studentId}`);
export const postGrade = (data) => apiClient.post('/api/grades', data);

export default apiClient;
