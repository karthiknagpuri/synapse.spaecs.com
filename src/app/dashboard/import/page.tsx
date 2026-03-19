"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

const CONTACT_FIELDS = [
  { value: "", label: "Skip" },
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Company" },
  { value: "title", label: "Job Title" },
  { value: "location", label: "Location" },
  { value: "tags", label: "Tags" },
];

// Auto-detect mapping from column header
function guessField(header: string): string {
  const h = header.toLowerCase().replace(/[_\-\s]+/g, "");
  if (h.includes("name") || h === "fullname" || h === "firstname")
    return "full_name";
  if (h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("phone") || h.includes("mobile") || h.includes("tel"))
    return "phone";
  if (
    h.includes("company") ||
    h.includes("organization") ||
    h.includes("org")
  )
    return "company";
  if (
    h.includes("title") ||
    h.includes("position") ||
    h.includes("role") ||
    h.includes("jobtitle")
  )
    return "title";
  if (
    h.includes("location") ||
    h.includes("city") ||
    h.includes("address") ||
    h.includes("country")
  )
    return "location";
  if (h.includes("tag") || h.includes("label") || h.includes("category"))
    return "tags";
  return "";
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}

type Step = "upload" | "map" | "preview" | "importing" | "done";

export default function ImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCSV(text);

      if (h.length === 0) {
        setError("Could not parse CSV file.");
        return;
      }

      setHeaders(h);
      setRows(r);
      setError(null);

      // Auto-detect mappings
      const autoMap: Record<number, string> = {};
      h.forEach((header, i) => {
        const guess = guessField(header);
        if (guess) autoMap[i] = guess;
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
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

  const hasNameMapping = Object.values(mapping).includes("full_name");

  const buildContacts = () => {
    return rows
      .map((row) => {
        const contact: Record<string, string | string[]> = {};
        Object.entries(mapping).forEach(([colIdx, field]) => {
          if (!field) return;
          const value = row[Number(colIdx)] || "";
          if (!value) return;
          if (field === "tags") {
            contact[field] = value.split(/[,;|]/).map((t) => t.trim());
          } else {
            contact[field] = value;
          }
        });
        return contact;
      })
      .filter((c) => c.full_name);
  };

  const previewContacts = buildContacts().slice(0, 5);

  const handleImport = async () => {
    setStep("importing");
    setError(null);

    const contacts = buildContacts();
    try {
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json();

      if (data.success) {
        setResult({
          created: data.contacts_created,
          skipped: data.contacts_skipped,
          total: data.total,
        });
        setStep("done");
        // Generate embeddings
        await fetch("/api/embeddings", { method: "POST" });
      } else {
        setError(data.error || "Import failed.");
        setStep("preview");
      }
    } catch {
      setError("Import failed. Please try again.");
      setStep("preview");
    }
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
          <h1 className="font-[family-name:var(--font-serif)] text-3xl text-gray-900">Import CSV</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload a spreadsheet to import contacts.
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
          <FileSpreadsheet className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm font-medium text-gray-900 mb-1">
            Drop your CSV file here
          </p>
          <p className="text-xs text-gray-500 mb-4">or click to browse</p>
          <label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] cursor-pointer transition-colors">
              <Upload className="h-4 w-4" />
              Choose File
            </span>
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === "map" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">
              Map Columns
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {rows.length} rows detected. Map your CSV columns to contact
              fields.
            </p>
            <div className="space-y-2.5">
              {headers.map((header, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-40 text-sm text-gray-600 truncate shrink-0">
                    {header}
                  </span>
                  <span className="text-gray-300">→</span>
                  <div className="relative flex-1">
                    <select
                      value={mapping[idx] || ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [idx]: e.target.value,
                        }))
                      }
                      className="w-full h-9 pl-3 pr-8 rounded-lg border border-gray-900/15 bg-white text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                    >
                      {CONTACT_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("upload")}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              disabled={!hasNameMapping}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Preview
            </button>
          </div>

          {!hasNameMapping && (
            <p className="text-xs text-amber-600 text-center">
              Map at least one column to "Full Name" to continue.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-900/10 bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-900/5">
              <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Preview ({buildContacts().length} contacts)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-900/5">
                    {Object.entries(mapping)
                      .filter(([, field]) => field)
                      .map(([, field]) => (
                        <th
                          key={field}
                          className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {
                            CONTACT_FIELDS.find((f) => f.value === field)
                              ?.label
                          }
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/5">
                  {previewContacts.map((contact, i) => (
                    <tr key={i}>
                      {Object.entries(mapping)
                        .filter(([, field]) => field)
                        .map(([, field]) => (
                          <td
                            key={field}
                            className="px-5 py-2.5 text-sm text-gray-700 truncate max-w-48"
                          >
                            {Array.isArray(contact[field])
                              ? (contact[field] as string[]).join(", ")
                              : (contact[field] as string) || "\u2014"}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {buildContacts().length > 5 && (
              <div className="px-5 py-2.5 border-t border-gray-900/5 text-xs text-gray-400 text-center">
                and {buildContacts().length - 5} more...
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep("map")}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
            >
              Import {buildContacts().length} Contacts
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {step === "importing" && (
        <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">
            Importing contacts...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This may take a moment.
          </p>
        </div>
      )}

      {/* Step 5: Done */}
      {step === "done" && result && (
        <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mx-auto mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-base font-medium text-gray-900">Import Complete</p>
          <p className="text-sm text-gray-500 mt-1">
            {result.created} contacts imported
            {result.skipped > 0 && `, ${result.skipped} skipped`}.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => router.push("/dashboard/contacts")}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
            >
              View Contacts
            </button>
            <button
              onClick={() => {
                setStep("upload");
                setHeaders([]);
                setRows([]);
                setMapping({});
                setResult(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-900/15 text-sm font-medium text-gray-700 hover:border-gray-900/25 transition-colors"
            >
              Import More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
