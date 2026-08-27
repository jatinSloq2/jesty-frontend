"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceRecorderState {
  status: "idle" | "recording" | "stopped";
  seconds: number;
  error: string | null;
}

// Meta's Cloud API accepts audio/ogg (Opus) for voice notes; Chrome's
// MediaRecorder only offers audio/webm;codecs=opus, Firefox offers
// audio/ogg;codecs=opus directly. We record in whatever the browser
// supports and forward the true mimetype — Meta will reject webm voice
// notes on some accounts, so if that happens in your deployment the fix is
// a server-side transcode step (ffmpeg) in sendMediaUpload, not this hook.
const CANDIDATE_MIME_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t));
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceRecorderState>({ status: "idle", seconds: 0, error: null });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resolveRef = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => cleanupStream(), []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState({ status: "idle", seconds: 0, error: "This browser can't record audio." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanupStream();
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setState({ status: "recording", seconds: 0, error: null });
      timerRef.current = setInterval(() => {
        setState((s) => (s.status === "recording" ? { ...s, seconds: s.seconds + 1 } : s));
      }, 1000);
    } catch {
      setState({ status: "idle", seconds: 0, error: "Microphone permission was denied." });
    }
  }, []);

  // Resolves with the recorded Blob, or null if cancelled.
  const stop = useCallback((discard = false): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }
      resolveRef.current = discard ? () => resolve(null) : resolve;
      recorder.stop();
      recorderRef.current = null;
      setState({ status: "idle", seconds: 0, error: null });
    });
  }, []);

  const cancel = useCallback(() => stop(true), [stop]);

  return { state, start, stop, cancel };
}