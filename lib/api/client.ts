import axios from "axios";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL:
    typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    const message =
      error.response?.data?.error || error.message || "An error occurred";
    console.error("[API Error]:", message);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
