export function VoteSummaryStats({
  voteCount,
  namedCount,
  anonymousCount,
  allowlistedCount,
}: {
  voteCount: number;
  namedCount: number;
  anonymousCount: number;
  allowlistedCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 print:grid-cols-3">
      <Stat label="Votes" value={String(voteCount)} />
      <Stat
        label="Named / anonymous"
        value={`${namedCount} / ${anonymousCount}`}
      />
      <Stat
        label="Participation"
        value={
          allowlistedCount === 0
            ? "—"
            : `${voteCount} / ${allowlistedCount}`
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  );
}
