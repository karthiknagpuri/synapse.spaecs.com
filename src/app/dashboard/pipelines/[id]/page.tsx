"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Search,
  X,
  Check,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  User,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface Card {
  id: string;
  stage_id: string;
  contact_id: string;
  position: number;
  notes: string | null;
  contact: Contact | null;
}

interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  pipeline_cards: Card[];
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  type: string;
  pipeline_stages: Stage[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function PipelineKanbanPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");

  // Drag state
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Contact search per stage
  const [addingToStage, setAddingToStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  /* ---------- Fetch pipeline ---------- */

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/pipelines/${id}`);
      if (!res.ok) {
        setError("Pipeline not found");
        return;
      }
      const data = await res.json();
      setPipeline(data.pipeline);
      setNameValue(data.pipeline.name);
    } catch {
      setError("Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  /* ---------- Name editing ---------- */

  async function saveName() {
    if (!nameValue.trim() || nameValue.trim() === pipeline?.name) {
      setEditingName(false);
      return;
    }
    await fetch(`/api/pipelines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameValue.trim() }),
    });
    setPipeline((prev) =>
      prev ? { ...prev, name: nameValue.trim() } : prev
    );
    setEditingName(false);
  }

  /* ---------- Drag and Drop ---------- */

  function handleDragStart(e: React.DragEvent, card: Card) {
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      requestAnimationFrame(() => {
        (e.currentTarget as HTMLElement).style.opacity = "0.4";
      });
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedCard(null);
    setDragOverStage(null);
  }

  function handleDragOver(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStage(stageId);
  }

  function handleDragLeave() {
    setDragOverStage(null);
  }

  async function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedCard || !pipeline) return;

    const sourceStageId = draggedCard.stage_id;
    const targetStage = pipeline.pipeline_stages.find(
      (s) => s.id === targetStageId
    );
    const newPosition = targetStage
      ? targetStage.pipeline_cards.length
      : 0;

    // Optimistic update
    setPipeline((prev) => {
      if (!prev) return prev;
      const stages = prev.pipeline_stages.map((stage) => {
        if (stage.id === sourceStageId) {
          return {
            ...stage,
            pipeline_cards: stage.pipeline_cards.filter(
              (c) => c.id !== draggedCard.id
            ),
          };
        }
        if (stage.id === targetStageId) {
          return {
            ...stage,
            pipeline_cards: [
              ...stage.pipeline_cards,
              { ...draggedCard, stage_id: targetStageId, position: newPosition },
            ],
          };
        }
        return stage;
      });
      return { ...prev, pipeline_stages: stages };
    });

    await fetch(`/api/pipelines/${id}/cards`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        card_id: draggedCard.id,
        stage_id: targetStageId,
        position: newPosition,
      }),
    });

    setDraggedCard(null);
  }

  /* ---------- Contact search & add ---------- */

  function handleSearchChange(query: string) {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/contacts/search?q=${encodeURIComponent(query.trim())}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.contacts ?? []);
        }
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);
  }

  async function addContactToStage(stageId: string, contactId: string) {
    const res = await fetch(`/api/pipelines/${id}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: stageId, contact_id: contactId }),
    });

    if (res.ok) {
      const data = await res.json();
      setPipeline((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          pipeline_stages: prev.pipeline_stages.map((stage) => {
            if (stage.id === stageId) {
              return {
                ...stage,
                pipeline_cards: [...stage.pipeline_cards, data.card],
              };
            }
            return stage;
          }),
        };
      });
    }

    setAddingToStage(null);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function removeCard(cardId: string, stageId: string) {
    setPipeline((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pipeline_stages: prev.pipeline_stages.map((stage) => {
          if (stage.id === stageId) {
            return {
              ...stage,
              pipeline_cards: stage.pipeline_cards.filter(
                (c) => c.id !== cardId
              ),
            };
          }
          return stage;
        }),
      };
    });

    await fetch(`/api/pipelines/${id}/cards?card_id=${cardId}`, {
      method: "DELETE",
    });
  }

  /* ---------- Loading / Error states ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !pipeline) {
    return (
      <div className="max-w-4xl mx-auto text-center py-24">
        <p className="text-sm text-gray-500">{error || "Pipeline not found"}</p>
        <Link
          href="/dashboard/pipelines"
          className="inline-flex items-center gap-2 mt-4 text-sm text-gray-900 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to pipelines
        </Link>
      </div>
    );
  }

  const totalCards = pipeline.pipeline_stages.reduce(
    (sum, s) => sum + s.pipeline_cards.length,
    0
  );

  /* ---------- Render ---------- */

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-900/5 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/pipelines"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameValue(pipeline.name);
                    }
                  }}
                  className="text-lg font-semibold text-gray-900 border-b-2 border-gray-900 focus:outline-none bg-transparent"
                  autoFocus
                />
                <button
                  onClick={saveName}
                  className="p-1 rounded text-gray-900 hover:bg-gray-100"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="group flex items-center gap-2"
              >
                <h1 className="font-[family-name:var(--font-serif)] text-lg text-gray-900">
                  {pipeline.name}
                </h1>
                <Pencil className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 tabular-nums">
            {totalCards} contact{totalCards !== 1 ? "s" : ""} · {pipeline.pipeline_stages.length} stages
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-6 h-full min-w-max">
          {pipeline.pipeline_stages.map((stage) => (
            <div
              key={stage.id}
              className={`flex flex-col w-68 rounded-xl shrink-0 transition-all ${
                dragOverStage === stage.id
                  ? "ring-2 ring-gray-900/10 bg-gray-100/80"
                  : "bg-gray-50/60"
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between px-3 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <h3 className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    {stage.name}
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium tabular-nums">
                    {stage.pipeline_cards.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAddingToStage(
                      addingToStage === stage.id ? null : stage.id
                    );
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-white transition-colors"
                  title="Add contact"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Contact Search Dropdown */}
              {addingToStage === stage.id && (
                <div className="mx-3 mb-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Search contacts..."
                      className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border border-gray-900/10 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setAddingToStage(null);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {searching && (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-3.5 w-3.5 text-gray-400 animate-spin" />
                    </div>
                  )}

                  {!searching && searchResults.length > 0 && (
                    <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-900/10 bg-white divide-y divide-gray-900/5">
                      {searchResults.map((contact) => {
                        const alreadyAdded = pipeline.pipeline_stages.some(
                          (s) =>
                            s.pipeline_cards.some(
                              (c) => c.contact_id === contact.id
                            )
                        );

                        return (
                          <button
                            key={contact.id}
                            onClick={() => {
                              if (!alreadyAdded) {
                                addContactToStage(stage.id, contact.id);
                              }
                            }}
                            disabled={alreadyAdded}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {contact.full_name}
                            </p>
                            {contact.company && (
                              <p className="text-[10px] text-gray-400 truncate">
                                {contact.title
                                  ? `${contact.title} at ${contact.company}`
                                  : contact.company}
                              </p>
                            )}
                            {alreadyAdded && (
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                Already in pipeline
                              </p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!searching &&
                    searchQuery.trim() &&
                    searchResults.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-3">
                        No contacts found
                      </p>
                    )}
                </div>
              )}

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                {stage.pipeline_cards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, card)}
                    onDragEnd={handleDragEnd}
                    className="group relative p-3 rounded-lg bg-white border border-gray-900/5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:border-gray-900/10 cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-gray-200 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {card.contact?.avatar_url ? (
                          <img
                            src={card.contact.avatar_url}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-medium text-gray-500 shrink-0">
                            {card.contact?.full_name
                              ? initials(card.contact.full_name)
                              : "?"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 truncate">
                            {card.contact?.full_name ?? "Unknown"}
                          </p>
                          {card.contact?.company && (
                            <p className="text-[11px] text-gray-400 truncate">
                              {card.contact.title
                                ? `${card.contact.title} · ${card.contact.company}`
                                : card.contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCard(card.id, stage.id)}
                        className="p-1 rounded text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        title="Remove from pipeline"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {stage.pipeline_cards.length === 0 && !addingToStage && (
                  <div className="text-center py-8">
                    <p className="text-[10px] text-gray-300 uppercase tracking-wider">
                      Drop here
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
