"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardEvent } from "@/lib/mira/tools";
import { runTool } from "@/lib/mira/tools";

export type MiraStatus =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "live"
  | "ending"
  | "mic-denied"
  | "rate-limited"
  | "error";

export type TranscriptLine = {
  id: string;
  speaker: "user" | "mira";
  text: string;
  final: boolean;
};

type SessionResponse = {
  client_secret?: { value: string; expires_at: number };
  model?: string;
  error?: string;
};

const REALTIME_URL = "https://api.openai.com/v1/realtime";
const MAX_SESSION_MS = 5 * 60 * 1000;

export function useMiraSession() {
  const [status, setStatus] = useState<MiraStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [cards, setCards] = useState<CardEvent[]>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const modelAnalyserRef = useRef<AnalyserNode | null>(null);
  const userAmpRef = useRef(0);
  const modelAmpRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const endTimerRef = useRef<number | null>(null);
  const miraPartialRef = useRef<string>("");

  const readAmplitude = useCallback((analyser: AnalyserNode) => {
    const buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.min(1, Math.sqrt(sum / buf.length) * 3);
  }, []);

  const startRafLoop = useCallback(() => {
    const loop = () => {
      if (userAnalyserRef.current) {
        userAmpRef.current = readAmplitude(userAnalyserRef.current);
      }
      if (modelAnalyserRef.current) {
        modelAmpRef.current = readAmplitude(modelAnalyserRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [readAmplitude]);

  const appendLine = useCallback((line: TranscriptLine) => {
    setTranscript((prev) => {
      const next = [...prev, line];
      return next.slice(-6);
    });
  }, []);

  const updateMiraPartial = useCallback((delta: string) => {
    miraPartialRef.current += delta;
    setTranscript((prev) => {
      const clone = [...prev];
      const lastIdx = clone.length - 1;
      if (
        lastIdx >= 0 &&
        clone[lastIdx].speaker === "mira" &&
        !clone[lastIdx].final
      ) {
        clone[lastIdx] = {
          ...clone[lastIdx],
          text: miraPartialRef.current,
        };
        return clone;
      }
      clone.push({
        id: `mira-${Date.now()}`,
        speaker: "mira",
        text: miraPartialRef.current,
        final: false,
      });
      return clone.slice(-6);
    });
  }, []);

  const finalizeMira = useCallback(() => {
    setTranscript((prev) => {
      if (prev.length === 0) return prev;
      const clone = [...prev];
      const lastIdx = clone.length - 1;
      if (clone[lastIdx].speaker === "mira") {
        clone[lastIdx] = { ...clone[lastIdx], final: true };
      }
      return clone;
    });
    miraPartialRef.current = "";
  }, []);

  const appendCard = useCallback((card: CardEvent) => {
    setCards((prev) => {
      const next = [...prev, card];
      return next.slice(-12);
    });
  }, []);

  const clearCards = useCallback(() => {
    setCards([]);
  }, []);

  const handleEvent = useCallback(
    (raw: string) => {
      let ev: {
        type?: string;
        transcript?: string;
        delta?: string;
        name?: string;
        arguments?: string;
        call_id?: string;
      };
      try {
        ev = JSON.parse(raw);
      } catch {
        return;
      }
      if (!ev.type) return;

      if (
        ev.type === "conversation.item.input_audio_transcription.completed" &&
        typeof ev.transcript === "string"
      ) {
        appendLine({
          id: `user-${Date.now()}`,
          speaker: "user",
          text: ev.transcript,
          final: true,
        });
        return;
      }

      if (ev.type === "response.audio_transcript.delta" && typeof ev.delta === "string") {
        updateMiraPartial(ev.delta);
        return;
      }

      if (ev.type === "response.audio_transcript.done") {
        finalizeMira();
        return;
      }

      if (
        ev.type === "response.function_call_arguments.done" &&
        typeof ev.name === "string" &&
        typeof ev.arguments === "string"
      ) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(ev.arguments) as Record<string, unknown>;
        } catch {
          return;
        }
        const card = runTool(ev.name, parsed);
        if (card) appendCard(card);
        return;
      }
    },
    [appendLine, updateMiraPartial, finalizeMira, appendCard]
  );

  const teardown = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (endTimerRef.current !== null) {
      window.clearTimeout(endTimerRef.current);
      endTimerRef.current = null;
    }
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {}
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    userAnalyserRef.current = null;
    modelAnalyserRef.current = null;
    userAmpRef.current = 0;
    modelAmpRef.current = 0;
    miraPartialRef.current = "";
  }, []);

  const start = useCallback(async () => {
    if (status !== "idle" && status !== "mic-denied" && status !== "error" && status !== "rate-limited") {
      return;
    }
    setTranscript([]);
    setMuted(false);
    setStatus("requesting-mic");

    let micStream: MediaStream;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("mic-denied");
      return;
    }
    micStreamRef.current = micStream;
    setStatus("connecting");

    let sessionData: SessionResponse;
    try {
      const res = await fetch("/api/realtime/session", { method: "POST" });
      sessionData = (await res.json()) as SessionResponse;
      if (res.status === 429 || sessionData.error === "rate_limited") {
        setStatus("rate-limited");
        teardown();
        return;
      }
      if (!res.ok || !sessionData.client_secret) {
        setStatus("error");
        teardown();
        return;
      }
    } catch {
      setStatus("error");
      teardown();
      return;
    }

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    remoteAudioRef.current = audioEl;

    pc.ontrack = (e) => {
      const [remoteStream] = e.streams;
      audioEl.srcObject = remoteStream;
      const source = ctx.createMediaStreamSource(remoteStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      modelAnalyserRef.current = analyser;
    };

    micStream.getTracks().forEach((track) => pc.addTrack(track, micStream));

    const userSource = ctx.createMediaStreamSource(micStream);
    const userAnalyser = ctx.createAnalyser();
    userAnalyser.fftSize = 512;
    userSource.connect(userAnalyser);
    userAnalyserRef.current = userAnalyser;

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;
    dc.onmessage = (e) => handleEvent(typeof e.data === "string" ? e.data : "");

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = sessionData.model ?? "gpt-realtime";
    let sdpAnswer: string;
    try {
      const sdpRes = await fetch(`${REALTIME_URL}?model=${encodeURIComponent(model)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionData.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp ?? "",
      });
      if (!sdpRes.ok) {
        setStatus("error");
        teardown();
        return;
      }
      sdpAnswer = await sdpRes.text();
    } catch {
      setStatus("error");
      teardown();
      return;
    }

    await pc.setRemoteDescription({ type: "answer", sdp: sdpAnswer });
    setStatus("live");

    startRafLoop();
    endTimerRef.current = window.setTimeout(() => {
      setStatus("ending");
      teardown();
      clearCards();
      setStatus("idle");
    }, MAX_SESSION_MS);
  }, [handleEvent, startRafLoop, status, teardown, clearCards]);

  const end = useCallback(() => {
    setStatus("ending");
    teardown();
    clearCards();
    setStatus("idle");
  }, [teardown, clearCards]);

  const toggleMute = useCallback(() => {
    const stream = micStreamRef.current;
    if (!stream) return;
    setMuted((prev) => {
      const next = !prev;
      stream.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return {
    status,
    muted,
    transcript,
    cards,
    userAmpRef,
    modelAmpRef,
    start,
    end,
    toggleMute,
    clearCards,
  };
}
