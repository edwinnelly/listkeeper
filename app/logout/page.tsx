// lib/auth.ts
import api from "@/lib/axios";

export const logout = async () => {
  try {
    await api.post("/logout"); // Laravel logout route
    return true;
  } catch (err) {
    console.error("Logout failed:", err);
    return false;
  }
};
