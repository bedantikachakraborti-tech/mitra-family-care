import { useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};

/** Browser speech-to-text, used only when the caregiver chooses to speak. */
export function useSpeechInput(lang: string) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const ref = useRef<Recognition | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setSupported(Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  function start() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += `${event.results[i]?.[0]?.transcript ?? ""} `;
      }
      setTranscript(text.trim());
    };
    recognition.onend = () => setListening(false);
    ref.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stop() {
    ref.current?.stop();
    setListening(false);
  }

  return { listening, transcript, supported, start, stop };
}
