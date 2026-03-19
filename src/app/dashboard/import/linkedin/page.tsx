"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  FileArchive,
  Users,
  MessageSquare,
  Mail,
  ExternalLink,
} from "lucide-react";

type Step = "upload" | "processing" | "done";

interface ImportResult {
  contacts_imported: number;
  contacts_skipped: number;
  total_connections: number;
  messages_parsed: number;
  invitations_parsed: number;
  interactions_created: number;
  profile_name: string | null;
}

export default function LinkedInImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState("");

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".zip") && !file.name.endsWith(".csv")) {
      setError("Please upload a LinkedIn data export (.zip) or Connections.csv file.");
      return;
    }

    setStep("processing");
    setError(null);
    setProgress("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setProgress(
        file.name.endsWith(".zip")
          ? "Extracting ZIP and parsing LinkedIn data..."
          : "Parsing CSV..."
      );

      const res = await fetch("/api/ingest/linkedin-zip", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setResult(data);
        setStep("done");

        // Generate embeddings
        setProgress("Generating search embeddings...");
        await fetch("/api/embeddings", { method: "POST" });
      } else {
        setError(data.error || "Import failed.");
        setStep("upload");
      }
    } catch {
      setError("Import failed. Please try again.");
      setStep("upload");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/integrations")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">
            Import LinkedIn Data
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload your full LinkedIn data export to import connections, messages, and more.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-100 bg-red-50 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          {/* How to get your data */}
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
              How to get your LinkedIn data export
            </h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  1
                </span>
                <span>
                  Go to{" "}
                  <a
                    href="https://www.linkedin.com/mypreferences/d/download-my-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 font-medium underline underline-offset-2 inline-flex items-center gap-0.5"
                  >
                    LinkedIn Settings → Get a copy of your data
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  2
                </span>
                <span>
                  Select &quot;Want something in particular?&quot; and check all boxes, or choose &quot;Download larger data archive&quot;
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  3
                </span>
                <span>
                  LinkedIn will email you when the export is ready (usually 10-30 minutes)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  4
                </span>
                <span>Download the ZIP file and upload it below</span>
              </li>
            </ol>
          </div>

          {/* What we extract */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-900">Connections</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Names, titles, companies
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <MessageSquare className="h-5 w-5 text-gray-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-900">Messages</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                DM history & frequency
              </p>
            </div>
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <Mail className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-gray-900">Invitations</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Who you reached out to
              </p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed transition-colors ${
              dragOver
                ? "border-gray-900/30 bg-gray-50"
                : "border-gray-900/15 bg-white"
            }`}
          >
            <FileArchive className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Drop your LinkedIn export here
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Accepts .zip or .csv files
            </p>
            <label>
              <input
                type="file"
                accept=".zip,.csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] cursor-pointer transition-colors">
                <Upload className="h-4 w-4" />
                Choose File
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === "processing" && (
        <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">{progress}</p>
          <p className="text-xs text-gray-500 mt-1">
            This may take a moment for large exports.
          </p>
        </div>
      )}

      {/* Step 3: Done */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="text-center py-12 rounded-xl border border-gray-900/10 bg-white">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-base font-medium text-gray-900">
              Import Complete
            </p>
            {result.profile_name && (
              <p className="text-sm text-gray-500 mt-1">
                Data imported for {result.profile_name}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {result.contacts_imported}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Contacts imported</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {result.total_connections}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Total in export</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {result.messages_parsed.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Messages parsed</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-900/10 bg-white text-center">
              <p className="text-lg font-semibold text-gray-900 tabular-nums">
                {result.interactions_created}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Interactions logged</p>
            </div>
          </div>

          {result.contacts_skipped > 0 && (
            <p className="text-xs text-gray-400 text-center">
              {result.contacts_skipped} contacts skipped (no name)
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/dashboard/contacts")}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
            >
              View Contacts
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setResult(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-900/15 text-sm font-medium text-gray-700 hover:border-gray-900/25 transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
