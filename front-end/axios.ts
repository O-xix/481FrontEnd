import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  transformResponse: [
    (data) => {
      // Axios's default transform already tries to parse JSON.
      // This custom transform acts as a fallback for cases where the
      // server sends a JSON string without the correct 'Content-Type' header.
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          // If parsing fails, return the original string.
        }
      }
      return data;
    },
  ],
});

export default apiClient;