import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

console.log("API Base URL:", API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      "API Request:",
      config.method?.toUpperCase(),
      config.url,
      config.data
    );
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => {
    console.log("Login attempt with:", credentials);
    return api.post("/auth/login", credentials);
  },
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  getDeliveryPartners: () => api.get("/auth/delivery-partners"),
  createDeliveryPartner: (partnerData) =>
    api.post("/auth/delivery-partners", partnerData),
  updateDeliveryPartner: (partnerId, partnerData) =>
    api.put(`/auth/delivery-partners/${partnerId}`, partnerData),
  deleteDeliveryPartner: (partnerId) =>
    api.delete(`/auth/delivery-partners/${partnerId}`),
  logout: () => api.post("/auth/logout"),
};

// Orders API
export const ordersAPI = {
  getAllOrders: (params) => api.get("/orders", { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post("/orders", orderData),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  updateOrderStatus: (id, status) =>
    api.put(`/orders/${id}/status`, { status }),
  assignDeliveryPartner: (id, partnerId) =>
    api.post(`/orders/${id}/assign`, { deliveryPartnerId: partnerId }),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  // Delivery partner specific endpoints
  getCurrentOrder: () => api.get("/delivery/current-order"),
  getOrderHistory: () => api.get("/delivery/order-history"),
};

// Delivery API
export const deliveryAPI = {
  getAvailablePartners: () => api.get("/delivery/available"),
  getWorkloadSummary: () => api.get("/delivery/workload"),
  updateAvailability: (isAvailable) =>
    api.put("/delivery/availability", { isAvailable }),
  getStats: () => api.get("/delivery/stats"),
};

export default api;
