/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Otomatis menonaktifkan fitur server ops jika di-deploy statis, tapi kita mau fullstack API route
  output: 'standalone', // Mempermudah self-host menggunakan systemd atau docker di Arch Linux
};

module.exports = nextConfig;
