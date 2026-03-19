"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Upload, ArrowRight } from "lucide-react";

export function IntegrationCard({
  platform,
  title,
  description,
  icon,
  isConnected,
  lastSynced,
  onSync,
  onUpload,
  onNavigate,
}: {
  platform: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isConnected: boolean;
  lastSynced?: string | null;
  onSync?: () => Promise<void>;
  onUpload?: (file: File) => Promise<void>;
  onNavigate?: () => void;
}) {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSync) return;
    setSyncing(true);
    try {
      await onSync();
    } finally {
      setSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    setSyncing(true);
    try {
      await onUpload(file);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-5 rounded-xl border border-gray-900/10 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-gray-100">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{title}</h3>
              {isConnected && (
                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            {lastSynced && (
              <p className="text-xs text-gray-400 mt-1">
                Last synced: {new Date(lastSynced).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div>
          {onNavigate ? (
            <Button variant="outline" size="sm" onClick={onNavigate}>
              Import
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : onUpload ? (
            <label>
              <input
                type="file"
                accept=".csv,.zip"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" size="sm" asChild disabled={syncing}>
                <span className="cursor-pointer">
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </>
                  )}
                </span>
              </Button>
            </label>
          ) : isConnected && onSync ? (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sync Now"
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
