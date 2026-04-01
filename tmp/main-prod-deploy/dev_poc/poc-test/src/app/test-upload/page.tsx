"use client";

import { useState, useRef } from "react";
import {
  uploadFileAction,
  deleteFileAction,
  getUploadConstraints,
} from "@/actions/upload";

type UploadedFile = {
  path: string;
  publicUrl: string;
  name: string;
};

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      setError("Please select a file");
      return;
    }

    const constraints = await getUploadConstraints();
    
    if (file.size > constraints.maxFileSize) {
      setError(`File size exceeds ${constraints.maxFileSizeMB}MB limit`);
      return;
    }

    if (!constraints.allowedMimeTypes.includes(file.type)) {
      setError(
        `File type not allowed. Allowed: ${constraints.allowedExtensions.join(", ")}`
      );
      return;
    }

    setUploading(true);

    try {
      const result = await uploadFileAction(formData, "uploads", "test");

      if (!result.success) {
        setError(result.error);
        return;
      }

      setUploadedFiles((prev) => [
        ...prev,
        {
          path: result.path,
          publicUrl: result.publicUrl,
          name: file.name,
        },
      ]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (path: string) => {
    setDeleting(path);
    setError(null);

    try {
      const result = await deleteFileAction(path);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setUploadedFiles((prev) => prev.filter((f) => f.path !== path));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Supabase Storage Test
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload File</h2>
          
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select file (max 10MB, images or PDF)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                name="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md
                hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed
                transition-colors font-medium"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {uploadedFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
            
            <ul className="space-y-3">
              {uploadedFiles.map((file) => (
                <li
                  key={file.path}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate block"
                    >
                      {file.publicUrl}
                    </a>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(file.path)}
                    disabled={deleting === file.path}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded
                      hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    {deleting === file.path ? "Deleting..." : "Delete"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800 mb-2">Setup Required</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Create a bucket named &quot;uploads&quot; in Supabase Storage</li>
            <li>Set the bucket to public (or configure RLS policies)</li>
            <li>Add NEXT_PUBLIC_SUPABASE_URL to .env.local</li>
            <li>Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
