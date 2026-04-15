"use client";

import { useState } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { access_token, user } = res.data;

      console.log("LOGIN RESPONSE:", res.data);
      console.log("ACCESS TOKEN:", access_token);
      console.log("USER:", user);

      // this saves BOTH token and user
      setAuth(access_token, user);

      alert("Login successful ✅");
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-10 rounded-2xl shadow-md w-[350px]">
        <h2 className="text-xl font-bold mb-6 text-center text-[#06152B]">
          Zyrent Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#A7C7E7]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#A7C7E7]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-[#06152B] hover:bg-[#0D244D] text-white py-2 rounded-lg transition"
        >
          Login
        </button>
      </div>
    </div>
  );
}