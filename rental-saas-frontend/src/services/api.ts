import axios, { AxiosHeaders } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");

    if (token) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else {
        const headers = new AxiosHeaders(config.headers);
        headers.set("Authorization", `Bearer ${token}`);
        config.headers = headers;
      }
    }
  }

  return config;
});