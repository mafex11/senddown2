import { MongoClient } from "mongodb";
import RoomClient from "./RoomClient";

interface FileInfo {
  fileName: string;
  cloudinaryUrl: string;
}

interface RoomPageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomCode } = await params;

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("senddown");
  const room = await db.collection("rooms").findOne({ roomCode });
  const initialFiles = (room?.files as FileInfo[]) || [];
  await client.close();

  return <RoomClient roomCode={roomCode} initialFiles={initialFiles} />;
}