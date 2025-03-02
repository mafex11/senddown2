"use client";

import { useState, useEffect } from "react";

interface FileInfo {
  fileName: string;
  cloudinaryUrl: string;
}

interface RoomClientProps {
  roomCode: string;
  initialFiles: FileInfo[];
}

export default function RoomClient({ roomCode, initialFiles }: RoomClientProps) {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [files, setFiles] = useState<FileInfo[]>(initialFiles);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  const log = (message: string) => {
    console.log(message);
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  useEffect(() => {
    setIsDesktop(window.innerWidth > 768);
    log(`Device joined room: ${roomCode} (${isDesktop ? "Desktop" : "Phone"})`);

    const fetchFiles = async () => {
      const res = await fetch(`/api/files?roomCode=${roomCode}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > files.length) {
        setFiles(data);
        log(`Fetched ${data.length} files`);
      }
    };

    fetchFiles(); // Initial fetch after client mount
    const interval = setInterval(fetchFiles, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [roomCode, files.length, isDesktop]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    log(`Starting upload: ${file.name}`);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomCode", roomCode);

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.file) {
        setUploadStatus("Upload Successful");
        log(`Upload completed: ${file.name}`);
        setFiles((prev) => [...prev, data.file]);
      } else {
        throw new Error("No file data in response");
      }
    } catch (error) {
      setUploadStatus("Error: Upload Failed");
      log(`Upload failed: ${file.name} - ${(error as Error).message}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Room: {roomCode}</h1>
      <h2 className="text-xl mb-2">{isDesktop ? "Desktop" : "Phone"} View</h2>

      {/* Upload Section */}
      <div className="mb-4">
        <input type="file" onChange={handleUpload} className="mb-2" />
        {uploadStatus && (
          <p className={uploadStatus.includes("Error") ? "text-red-500" : "text-green-500"}>
            {uploadStatus}
          </p>
        )}
      </div>

      {/* Files Section */}
      <h3 className="text-lg mb-2">Shared Files</h3>
      <ul className="space-y-2 mb-4">
        {files.map((file) => (
          <li key={file.fileName}>
            <a
              href={file.cloudinaryUrl}
              download={file.fileName}
              className="text-blue-500 hover:underline"
            >
              {file.fileName}
            </a>
          </li>
        ))}
      </ul>

      {/* Logs Section */}
      <h3 className="text-lg mb-2">Logs</h3>
      <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto w-full">
        {logs.map((log, index) => (
          <p key={index} className="text-sm">{log}</p>
        ))}
      </div>
    </main>
  );
}