import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listToText, parseList } from "@/lib/list-input";

/**
 * A text field for multi-value data. Typing keeps working exactly as before —
 * commas, semicolons and newlines separate values — and the parsed values are
 * shown as chips so it is obvious what will be saved.
 */
export function TagField({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  const [text, setText] = useState(() => listToText(values));

  // Keep the text in sync when the values change from outside (AI draft, load).
  useEffect(() => {
    setText((current) => (parseList(current).join("|") === values.join("|") ? current : listToText(values)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.join("|")]);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={text}
        placeholder={placeholder}
        onChange={(event) => {
          setText(event.target.value);
          onChange(parseList(event.target.value));
        }}
        className="mt-2 h-12 rounded-2xl"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {hint ?? "Separate each one with a comma."}
      </p>
      {values.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <li
              key={value}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground"
            >
              <span>{value}</span>
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="grid h-5 w-5 place-items-center rounded-full hover:bg-background/60"
                onClick={() => onChange(values.filter((v) => v !== value))}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
