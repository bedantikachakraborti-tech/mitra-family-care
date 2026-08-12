import { Languages } from "lucide-react";

import { LANGUAGES, useLanguage, type LangCode } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Compact language picker used on public pages and inside the app shell. */
export function LanguageSelect({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <label
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm",
        className,
      )}
    >
      <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="sr-only">{t("lang.label")}</span>
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value as LangCode)}
        className="bg-transparent pr-1 font-medium outline-none"
      >
        {LANGUAGES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.native}
          </option>
        ))}
      </select>
    </label>
  );
}
