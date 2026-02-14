'use client';

import { useEffect } from "react";
import Cookies from "js-cookie";
import api from "@/lib/axios";

export default function TestCsrf() {
  useEffect(() => {
    const fetchCsrf = async () => {
      await api.get("/sanctum/csrf-cookie"); // Fetch CSRF cookie

      // Read the cookie
      const csrfToken = Cookies.get("XSRF-TOKEN");
      //  console.log("CSRF Token:", csrfToken);
    };

    fetchCsrf();
  }, []);

  return <div>Check console for CSRF token</div>;
}
