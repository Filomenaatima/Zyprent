import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:5000",
});

// ✅ Attach token automatically (VERY IMPORTANT for your system)
instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default instance;