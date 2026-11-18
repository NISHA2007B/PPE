// Loading spinner in the brand orange
export default function Spinner() {
  return (
    <div className="flex justify-center py-12" role="status" aria-label="Loading">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
    </div>
  );
}