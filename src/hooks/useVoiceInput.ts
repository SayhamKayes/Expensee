import { useCallback, useEffect, useRef, useState } from "react";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import { Capacitor } from "@capacitor/core";

type Options = {
  onInterim?: (text: string) => void;
  continuous?: boolean;
};

export function useVoiceInput(onResult: (text: string) => void, options: Options = {}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  
  const recRef = useRef<any>(null); // For Web Fallback
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(options.onInterim);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onInterimRef.current = options.onInterim; }, [options.onInterim]);

  useEffect(() => {
    // 1. IF NATIVE ANDROID (Capacitor)
    if (Capacitor.isNativePlatform()) {
      SpeechRecognition.available()
        .then((res) => setSupported(res.available))
        .catch(() => setSupported(false));
      return;
    }

    // 2. IF WEB BROWSER (Your original code)
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
    rec.onerror = (e: any) => { 
      console.error("Web Speech Error:", e.error);
      setListening(false); 
      setInterim(""); 
    };

    recRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [options.continuous]);

  const start = useCallback(async () => {
    // --- NATIVE ANDROID START LOGIC ---
    if (Capacitor.isNativePlatform()) {
      try {
        const perm = await SpeechRecognition.checkPermissions();
        if (perm.speechRecognition !== 'granted') {
          const req = await SpeechRecognition.requestPermissions();
          if (req.speechRecognition !== 'granted') {
            console.error("Microphone permission denied by user");
            return;
          }
        }

        setListening(true);
        
        // 1. Remove old listeners so they don't multiply every time you tap the mic
        SpeechRecognition.removeAllListeners();
        
        // 2. Listen for partial words as they speak
        SpeechRecognition.addListener('partialResults', (data: any) => {
          if (data.matches && data.matches.length > 0) {
            setInterim(data.matches[0]);
            onInterimRef.current?.(data.matches[0]);
          }
        });

        // 3. Start listening and WAIT for Android to auto-stop when the user pauses
        const result = await SpeechRecognition.start({
          language: navigator.language || "en-US",
          maxResults: 1,
          prompt: "Say an expense...", 
          partialResults: true,
          popup: false, 
        });

        // 4. Android has finished listening. Pass the final text to the app.
        if (result && result.matches && result.matches.length > 0) {
          const finalText = result.matches[0];
          onResultRef.current(finalText.trim());
        }

        // Clean up UI state
        setListening(false);
        setInterim("");

      } catch (e) {
        console.error("Native Speech Error:", e);
        setListening(false);
        setInterim("");
      }
      return;
    }

    // --- WEB START LOGIC ---
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch {}
  }, []);

  const stop = useCallback(async () => {
    setListening(false);
    
    if (Capacitor.isNativePlatform()) {
      try { 
        // Stop native listening and get final result
        SpeechRecognition.removeAllListeners();
        await SpeechRecognition.stop(); 
        
        // Pass the final interim text as the result before clearing
        if (interim) {
          onResultRef.current(interim.trim());
        }
        setInterim("");
      } catch (e) { console.error(e); }
      return;
    }

    if (!recRef.current) return;
    try { recRef.current.stop(); } catch {}
  }, [interim]);

  return { listening, supported, interim, start, stop };
}