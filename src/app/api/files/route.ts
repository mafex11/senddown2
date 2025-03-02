import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

// Define the FileInfo interface
interface FileInfo {
  fileName: string;
  cloudinaryUrl: string;
}

// Define the Room document structure
interface RoomDocument {
  roomCode: string;
  files: FileInfo[];
  createdAt: Date;
}

const client = new MongoClient(process.env.MONGODB_URI!);
const dbName = "senddown";
const collectionName = "rooms";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get("roomCode");

  if (!roomCode) {
    return NextResponse.json({ error: "Room code required" }, { status: 400 });
  }

  await client.connect();
  const db = client.db(dbName);
  const room = await db.collection<RoomDocument>(collectionName).findOne({ roomCode });

  await client.close();
  return NextResponse.json(room?.files || []);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const roomCode = formData.get("roomCode") as string;

  if (!file || !roomCode) {
    return NextResponse.json({ error: "File and room code required" }, { status: 400 });
  }

  // Upload to Cloudinary
  const cloudinaryFormData = new FormData();
  cloudinaryFormData.append("file", file);
  cloudinaryFormData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);

  const cloudinaryRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
    { method: "POST", body: cloudinaryFormData }
  );
  const cloudinaryData = await cloudinaryRes.json();

  if (!cloudinaryData.secure_url) {
    return NextResponse.json({ error: "Upload to Cloudinary failed" }, { status: 500 });
  }

  const fileInfo: FileInfo = { fileName: file.name, cloudinaryUrl: cloudinaryData.secure_url };

  // Save to MongoDB with typed collection
  await client.connect();
  const db = client.db(dbName);
  await db.collection<RoomDocument>(collectionName).updateOne(
    { roomCode },
    {
      $push: { files: fileInfo },
      $setOnInsert: { createdAt: new Date() }, // No need to initialize files here
    },
    { upsert: true }
  );

  await client.close();
  return NextResponse.json({ message: "Upload successful", file: fileInfo });
}