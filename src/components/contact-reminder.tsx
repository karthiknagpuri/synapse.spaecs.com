"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, ChevronDown } from "lucide-react";

const FREQUENCIES = [
  { value: "none", label: "None" },
  { value: "1 week", label: "Weekly" },
  { value: "2 weeks", label: "Biweekly" },
  { value: "1 month", label: "Monthly" },
  { value: "3 months", label: "Quarterly" },
];

interface ContactReminderProps {
  contactId: string;
  currentFrequency: string | null;
}

export function ContactReminder({ contactId, currentFrequency }: ContactReminderProps) {
  const [open, setOpen] = useState(false);
  const [frequency, setFrequency] = useState(currentFrequency || "none");
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSelect(value: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/reminder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frequency: value }),
      });

      if (res.ok) {
        setFrequency(value);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  const current = FREQUENCIES.find((f) => f.value === frequency);
  const isActive = frequency !== "none";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isActive
            ? "bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Bell className="h-3 w-3" />
        {saving ? "..." : current?.label || "Remind"}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-900/10 bg-white shadow-lg z-50 py-1">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              onClick={() => handleSelect(f.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {f.label}
              {frequency === f.value && (
                <Check className="h-3.5 w-3.5 text-[#7C3AED]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
