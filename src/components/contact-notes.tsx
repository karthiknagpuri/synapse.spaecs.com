"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ContactNote } from "@/types";
import { Trash2, Zap } from "lucide-react";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export default function ContactNotes({ contactId }: { contactId: string }) {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [lastInteractionNote, setLastInteractionNote] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes);
      }
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editingId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewContent("");
        if (data.interaction) {
          setLastInteractionNote(data.note.id);
          setTimeout(() => setLastInteractionNote(null), 4000);
        }
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch(
        `/api/contacts/${contactId}/notes/${noteId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const startEditing = (note: ContactNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (noteId: string) => {
    if (!editContent.trim() || savingEdit) return;

    setSavingEdit(true);
    try {
      const res = await fetch(
        `/api/contacts/${contactId}/notes/${noteId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? data.note : n))
        );
        setEditingId(null);
        setEditContent("");
      }
    } catch (err) {
      console.error("Failed to update note:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    noteId: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit(noteId);
    }
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  return (
    <div>
      {/* Add note input */}
      <form onSubmit={handleAdd} className="mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40 transition-colors"
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={submitting || !newContent.trim()}
            className="h-9 px-3.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* Notes list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-lg bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          No notes yet. Add one above.
        </p>
      ) : (
        <div className="space-y-1.5">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-white hover:border-gray-200 transition-colors"
            >
              <div className="flex-1 min-w-0">
                {editingId === note.id ? (
                  <div>
                    <textarea
                      ref={editRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, note.id)}
                      onBlur={() => {
                        if (editContent.trim() === note.content) {
                          cancelEditing();
                        }
                      }}
                      rows={2}
                      className="w-full rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED]/40 resize-none transition-colors"
                      disabled={savingEdit}
                    />
                    <div className="flex items-center gap-2 mt-1.5">
                      <button
                        onClick={() => saveEdit(note.id)}
                        disabled={savingEdit || !editContent.trim()}
                        className="text-[11px] font-medium text-[#7C3AED] hover:text-[#6D28D9] disabled:opacity-40 transition-colors"
                      >
                        {savingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <span className="text-[10px] text-gray-300 ml-auto">
                        Enter to save, Esc to cancel
                      </span>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => startEditing(note)}
                    className="text-sm text-gray-700 cursor-text whitespace-pre-wrap break-words leading-relaxed"
                  >
                    {note.content}
                  </p>
                )}
                {editingId !== note.id && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-gray-300">
                      {relativeTime(note.created_at)}
                      {note.updated_at !== note.created_at && " (edited)"}
                    </span>
                    {lastInteractionNote === note.id && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full animate-in fade-in">
                        <Zap className="h-2.5 w-2.5" />
                        Added to timeline
                      </span>
                    )}
                  </div>
                )}
              </div>
              {editingId !== note.id && (
                <button
                  onClick={() => handleDelete(note.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  aria-label="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
