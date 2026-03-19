"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
  Camera,
  CreditCard,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  MapPin,
  Globe,
} from "lucide-react";

type Step = "upload" | "processing" | "preview" | "done";

interface CardData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  location: string | null;
  website: string | null;
}

export default function BusinessCardImportPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [editData, setEditData] = useState<CardData | null>(null);
  const [saving, setSaving] = useState(false);

  const processImage = useCallback(async (file: File) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setError("Please upload an image file (.jpg, .png, .webp, or .heic).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }

    setStep("processing");
    setError(null);

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/ingest/business-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await res.json();

      if (data.success) {
        setCardData(data.data);
        setEditData({ ...data.data });
        setStep("preview");
      } else {
        setError(data.error || "Failed to extract contact information.");
        setStep("upload");
      }
    } catch {
      setError("Failed to process image. Please try again.");
      setStep("upload");
    }
  }, []);

  const handleSave = async () => {
    if (!editData?.full_name?.trim()) {
      setError("Name is required to save the contact.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const contact = {
        full_name: editData.full_name.trim(),
        email: editData.email?.trim() || undefined,
        phone: editData.phone?.trim() || undefined,
        company: editData.company?.trim() || undefined,
        title: editData.title?.trim() || undefined,
        location: editData.location?.trim() || undefined,
        tags: ["business-card"],
      };

      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: [contact] }),
      });

      const data = await res.json();

      if (data.success) {
        setStep("done");
        // Generate embeddings in background
        fetch("/api/embeddings", { method: "POST" });
      } else {
        setError(data.error || "Failed to save contact.");
      }
    } catch {
      setError("Failed to save contact. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const updateField = (field: keyof CardData, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value || null } : prev));
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
            Scan Business Card
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Take a photo or upload an image of a business card to extract contact info.
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
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
              How it works
            </h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  1
                </span>
                <span>Upload a photo of a business card or use your camera</span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  2
                </span>
                <span>AI extracts the name, email, phone, company, and other details</span>
              </li>
              <li className="flex gap-2">
                <span className="flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-xs font-medium text-gray-500 shrink-0">
                  3
                </span>
                <span>Review and edit the extracted info before saving</span>
              </li>
            </ol>
          </div>

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
            <CreditCard className="h-10 w-10 text-gray-300 mb-4" />
            <p className="text-sm font-medium text-gray-900 mb-1">
              Drop a business card image here
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Accepts .jpg, .png, .webp, .heic — up to 10MB
            </p>
            <div className="flex items-center gap-3">
              <label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  Choose File
                </span>
              </label>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-900/15 text-sm font-medium text-gray-700 hover:border-gray-900/25 cursor-pointer transition-colors">
                  <Camera className="h-4 w-4" />
                  Use Camera
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Processing */}
      {step === "processing" && (
        <div className="text-center py-16 rounded-xl border border-gray-900/10 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">
            Scanning business card...
          </p>
          <p className="text-xs text-gray-500 mt-1">
            AI is extracting contact information.
          </p>
        </div>
      )}

      {/* Step 3: Preview / Edit */}
      {step === "preview" && editData && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
            <h2 className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-4">
              Extracted Contact Info
            </h2>
            <div className="space-y-3">
              <FieldRow
                icon={<User className="h-4 w-4 text-gray-400" />}
                label="Full Name"
                value={editData.full_name || ""}
                onChange={(v) => updateField("full_name", v)}
                required
              />
              <FieldRow
                icon={<Mail className="h-4 w-4 text-gray-400" />}
                label="Email"
                value={editData.email || ""}
                onChange={(v) => updateField("email", v)}
                type="email"
              />
              <FieldRow
                icon={<Phone className="h-4 w-4 text-gray-400" />}
                label="Phone"
                value={editData.phone || ""}
                onChange={(v) => updateField("phone", v)}
                type="tel"
              />
              <FieldRow
                icon={<Building className="h-4 w-4 text-gray-400" />}
                label="Company"
                value={editData.company || ""}
                onChange={(v) => updateField("company", v)}
              />
              <FieldRow
                icon={<Briefcase className="h-4 w-4 text-gray-400" />}
                label="Title"
                value={editData.title || ""}
                onChange={(v) => updateField("title", v)}
              />
              <FieldRow
                icon={<MapPin className="h-4 w-4 text-gray-400" />}
                label="Location"
                value={editData.location || ""}
                onChange={(v) => updateField("location", v)}
              />
              <FieldRow
                icon={<Globe className="h-4 w-4 text-gray-400" />}
                label="Website"
                value={editData.website || ""}
                onChange={(v) => updateField("website", v)}
                type="url"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setStep("upload");
                setCardData(null);
                setEditData(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-900/15 text-sm font-medium text-gray-700 hover:border-gray-900/25 transition-colors"
            >
              Rescan
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editData.full_name?.trim()}
              className="px-4 py-2 rounded-lg bg-[#0A0A0A] text-white text-sm font-medium hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Contact"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <div className="space-y-4">
          <div className="text-center py-12 rounded-xl border border-gray-900/10 bg-white">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-base font-medium text-gray-900">
              Contact Saved
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {editData?.full_name} has been added to your contacts.
            </p>
          </div>

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
                setCardData(null);
                setEditData(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-gray-900/15 text-sm font-medium text-gray-700 hover:border-gray-900/25 transition-colors"
            >
              Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  icon,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <label className="w-20 text-xs text-gray-500 shrink-0">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex-1 px-3 py-1.5 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get raw base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
