// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   //  reactStrictMode: false,
// };

// export default nextConfig;
// module.exports = {
//   images: {
//     domains: ["cdn3.iconfinder.com"],
//   },
// };

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // optional: disable temporarily for dev speed testing

  images: {
    domains: ["cdn3.iconfinder.com"],
    unoptimized: true, // improves dev speed
  },
};

export default nextConfig;
