export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
    </div>
  );
}
