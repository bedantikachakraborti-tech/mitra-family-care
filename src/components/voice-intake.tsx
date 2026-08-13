import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, speechLocale, useLanguage } from "@/lib/i18n";
import { useSpeechInput } from "@/lib/use-speech-input";

/**
 * Shared spoken-or-typed intake box.
 *
 * The spoken language is chosen here and is deliberately independent of the
 * application language: someone can use Mitra in English and speak Bengali.
 */
export function VoiceIntake({
  value,
  onChange,
  placeholder,
  rows = 5,
  onSpeechLangChange,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onSpeechLangChange?: (locale: string) => void;
}) {
  const { lang: uiLang } = useLanguage();
  const [speechLang, setSpeechLang] = useState(() => speechLocale(uiLang));
  const speech = useSpeechInput(speechLang);

  useEffect(() => {
    onSpeechLangChange?.(speechLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechLang]);

  useEffect(() => {
    if (!speech.transcript) return;
    onChange(value ? `${value} ${speech.transcript}` : speech.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-card px-3 text-sm">
          <span className="text-muted-foreground">Speaking</span>
          <select
            aria-label="Spoken language"
            value={speechLang}
            onChange={(event) => setSpeechLang(event.target.value)}
            className="bg-transparent font-medium outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.speech}>
                {l.native}
              </option>
            ))}
          </select>
        </label>

        {speech.supported ? (
          <Button
            type="button"
            size="lg"
            variant={speech.listening ? "default" : "outline"}
            className="h-11 rounded-full"
            onClick={speech.listening ? speech.stop : speech.start}
          >
            {speech.listening ? (
              <MicOff className="mr-2 h-4 w-4" aria-hidden />
            ) : (
              <Mic className="mr-2 h-4 w-4" aria-hidden />
            )}
            {speech.listening ? "Stop recording" : "Speak"}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Voice input isn't available in this browser — you can type instead.
          </p>
        )}
      </div>

      <Textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 rounded-2xl bg-card text-foreground"
      />
      {speech.listening && (
        <p className="mt-2 text-xs text-muted-foreground">Listening… speak naturally.</p>
      )}
    </div>
  );
}
