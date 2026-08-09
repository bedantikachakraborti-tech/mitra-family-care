export function MitraMark({ className }: { className?: string }) {
  return (
    <span
      className={
        "grid shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground " +
        (className ?? "h-10 w-10")
      }
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2">
        <path
          d="M12 20.5C12 20.5 3.5 15.6 3.5 9.9A4.4 4.4 0 0 1 12 8.2a4.4 4.4 0 0 1 8.5 1.7c0 5.7-8.5 10.6-8.5 10.6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
