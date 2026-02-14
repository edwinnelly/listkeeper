// "use client";
// import { useParams } from "next/navigation";
// import React, { useEffect, useState } from "react";
// import api from "@/lib/axios";

// const EditBusinessPage = () => {
//   const { id } = useParams(); // gets id from the URL
//   // const [business, setBusiness] = useState(null);

//   // useEffect(() => {
//   //   if (!id) return;
//   //   const fetchBusiness = async () => {
//   //     const res = await api.get(`/businesses/${id}`);
//   //     setBusiness(res.data);
//   //   };
//   //   fetchBusiness();
//   // }, [id]);

//   return (
//     <div className="p-6">
//       <h1 className="text-xl font-bold mb-4">Edit Business</h1>
//       {/* {business ? (
//         <div>{business.business_name}</div>
//       ) : (
//         <p>Loading...</p>
//       )} */}
//     </div>
//   );
// };

// export default EditBusinessPage;


"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

const EditBusinessPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await api.get(`/business/${id}`);
        setForm(res.data);
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put(`/business/${id}`, form);
    router.push("/business");
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Business #{id}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Business Name"
          className="border p-2 rounded w-full"
        />
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 rounded w-full"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
          className="border p-2 rounded w-full"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update
        </button>
      </form>
    </div>
  );
};

export default EditBusinessPage;
