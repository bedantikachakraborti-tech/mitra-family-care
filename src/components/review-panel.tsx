import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pill, SoftCard, SectionTitle } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { counterpartQuery } from "@/lib/care-data";
import { reviewsForRequestQuery, saveReview } from "@/lib/care-social";

const CATEGORIES = ["Communication", "Punctuality", "Care of routines", "Warmth", "Teamwork"];

/**
 * Mutual 1–5 review of the working relationship. Reviews describe how the
 * collaboration went — never trustworthiness or safety claims.
 */
export function ReviewPanel({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const counterpart = useQuery(counterpartQuery(requestId));
  const { data: reviews = [] } = useQuery(reviewsForRequestQuery(requestId));

  const mine = reviews.find((r) => r.reviewer_user_id === user?.id);
  const theirs = reviews.find((r) => r.reviewer_user_id !== user?.id);

  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [comment, setComment] = useState(mine?.comment ?? "");
  const [categories, setCategories] = useState<string[]>(mine?.categories ?? []);

  useEffect(() => {
    if (!mine) return;
    setRating(mine.rating);
    setComment(mine.comment);
    setCategories(mine.categories);
  }, [mine?.id, mine?.rating, mine?.comment, mine]);

  const save = useMutation({
    mutationFn: async () => {
      if (!counterpart.data) throw new Error("There's no one to review yet.");
      if (rating < 1) throw new Error("Choose a rating from 1 to 5.");
      await saveReview({
        requestId,
        revieweeUserId: counterpart.data,
        rating,
        comment,
        categories,
        existingId: mine?.id,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success(mine ? "Review updated" : "Thank you for the review");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <SoftCard>
      <SectionTitle hint="About how you worked together">Reviews</SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating >= n}
            onClick={() => setRating(n)}
            className="grid h-11 w-11 place-items-center rounded-full border border-border"
          >
            <Star
              className={`h-5 w-5 ${rating >= n ? "fill-primary text-primary" : "text-muted-foreground"}`}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = categories.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() =>
                setCategories((current) =>
                  active ? current.filter((x) => x !== c) : [...current, c],
                )
              }
              className={`min-h-10 rounded-full px-4 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <Textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="What went well? What could be smoother?"
        className="mt-3 rounded-2xl"
      />

      <div className="mt-3 flex justify-end">
        <Button
          size="lg"
          className="h-12 rounded-full px-6"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          {mine ? "Update my review" : "Share my review"}
        </Button>
      </div>

      {theirs && (
        <div className="mt-5 rounded-2xl border border-border p-4">
          <p className="flex items-center gap-1 text-sm font-medium">
            {Array.from({ length: theirs.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-primary text-primary" aria-hidden />
            ))}
            <span className="ml-2 text-muted-foreground">their review of you</span>
          </p>
          {theirs.comment && <p className="mt-2 text-sm">{theirs.comment}</p>}
          {theirs.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {theirs.categories.map((c) => (
                <Pill key={c} tone="sage">
                  {c}
                </Pill>
              ))}
            </div>
          )}
        </div>
      )}
    </SoftCard>
  );
}
