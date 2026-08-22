import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // crucial: sends cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to handle unauthorized responses (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optionally clear user state (handled in AuthContext)
      console.warn('Unauthorized, redirecting to login');
    }
    return Promise.reject(error);
  }
);

export default apiClient;