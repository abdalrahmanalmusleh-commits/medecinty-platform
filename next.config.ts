import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.113",
    "192.168.1.113:3000",
    "192.168.1.113:3001",
    "localhost:3000",
    "0.0.0.0",
    "fe8259cc7f29caec-94-249-90-118.serveousercontent.com",
    "*.serveousercontent.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.pinggy.link"
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" }
        ]
      }
    ];
  }
};

export default nextConfig;
