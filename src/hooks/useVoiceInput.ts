import { useCallback, useEffect, useRef, useState } from "react";

type SR = any;

type Options = {
  onInterim?: (text: string) => void;
  continuous?: boolean;
};

export function useVoiceInput(onResult: (text: string) => void, options: Options = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SR | null>(null);
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(options.onInterim);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onInterimRef.current = options.onInterim; }, [options.onInterim]);

  useEffect(() => {
    const SRClass: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SRClass) return;
    setSupported(true);
    const rec = new SRClass();
    rec.continuous = options.continuous ?? true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setInterim(interimText);
      if (interimText) onInterimRef.current?.(interimText);
      if (finalText) {
        onResultRef.current(finalText.trim());
        setInterim("");
      }
    };
    rec.onend = () => { setListening(false); setInterim(""); };
    rec.onerror = () => { setListening(false); setInterim(""); };

    recRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [options.continuous]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch {}
  }, []);
  const stop = useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
    setListening(false);
  }, []);

  return { listening, supported, interim, start, stop };
}
