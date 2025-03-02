"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { networkInterfaces } from "os";

// No metadata export here since it's a client component
const getLocalIP = (): string => {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // e.g., "192.168.1.x"
      }
    }
  }
  return "localhost"; // Fallback
  console.log(getLocalIP)
};

export default function Home() {
  const [roomCode, setRoomCode] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8); // e.g., "abc123"
    setRoomCode(code);
    const localIP = getLocalIP();
    const url = `http://${localIP}:3000/room/${code}`;
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