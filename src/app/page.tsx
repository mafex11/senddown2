"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { networkInterfaces } from "os";

// Determine the base URL based on environment
const getBaseUrl = (): string => {
  // Use Vercel URL in production, fallback to local IP or localhost in development
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // For local development, use local IP if available
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:3000`;
      }
    }
  }
  return "http://localhost:3000"; // Fallback for local dev without network
};

export default function Home() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8); // e.g., "abc123"
    setRoomCode(code);
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/room/${code}`;
    const qr = await QRCode.toDataURL(url);
    setQrCodeUrl(qr);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">SendDown</h1>
      <button
        onClick={createRoom}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create Room
      </button>
      {qrCodeUrl && (
        <div className="mt-4 text-center">
          <img src={qrCodeUrl} alt="Scan to join room" className="mx-auto" />
          <p className="mt-2">Room Code: <strong>{roomCode}</strong></p>
          <p>Scan the QR code with your phone</p>
        </div>
      )}
    </main>
  );
}