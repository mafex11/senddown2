import { MongoClient } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

interface FileInfo {
  fileName: string;
  cloudinaryUrl: string;
}

interface RoomDocument {
  roomCode: string;
  files: FileInfo[];
  createdAt: Date;
}

export const dynamic = "force-dynamic";

const MONGODB_URI = process.env.MONGODB_URI;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

if (!MONGODB_URI || !CLOUDINARY_CLOUD_NAME || !UPLOAD_PRESET) {
  throw new Error(
    "Missing required environment variables: MONGODB_URI, NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
  );
}

const client = new MongoClient(MONGODB_URI);
const dbName = "senddown";
const collectionName = "rooms";

export async function GET(req: NextRequest) {
  try {
    const url = req.url ? new URL(req.url) : new URL("http://localhost:3000/api/files");
    const { searchParams } = url;
    const roomCode = searchParams.get("roomCode");

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required" }, { status: 400 });
    }

    await client.connect();
    const db = client.db(dbName);
    const room = await db.collection<RoomDocument>(collectionName).findOne({ roomCode });

    await client.close();
    return NextResponse.json(room?.files || []);
  } catch (error) {
    console.error("GET /api/files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const roomCode = formData.get("roomCode") as string;

    if (!file || !roomCode) {
      return NextResponse.json({ error: "File and room code required" }, { status: 400 });
    }

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append("file", file);
    cloudinaryFormData.append("upload_preset", UPLOAD_PRESET);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      { method: "POST", body: cloudinaryFormData }
    );
    const cloudinaryData = await cloudinaryRes.json();

    if (!cloudinaryData.secure_url) {
      return NextResponse.json({ error: "Upload to Cloudinary failed" }, { status: 500 });
    }

    const fileInfo: FileInfo = { fileName: file.name, cloudinaryUrl: cloudinaryData.secure_url };

    await client.connect();
    const db = client.db(dbName);
    await db.collection<RoomDocument>(collectionName).updateOne(
      { roomCode },
      {
        $push: { files: fileInfo },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    await client.close();
    return NextResponse.json({ message: "Upload successful", file: fileInfo });
  } catch (error) {
    console.error("POST /api/files error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}