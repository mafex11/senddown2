import { MongoClient } from "mongodb";
import RoomClient from "./RoomClient"; // New client component

interface FileInfo {
  fileName: string;
  cloudinaryUrl: string;
}

interface RoomPageProps {
  params: Promise<{ roomCode: string }>; // Server component expects Promise
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomCode } = await params; // Await params in server component

  // Fetch initial files from MongoDB
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  const db = client.db("Cluster0");
  const room = await db.collection("rooms").findOne({ roomCode });
  const initialFiles = room?.files || [];
  await client.close();

  return <RoomClient roomCode={roomCode} initialFiles={initialFiles} />;
}