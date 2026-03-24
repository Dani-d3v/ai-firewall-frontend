export default function Loading({ label = "Synchronizing BRADSafe telemetry..." }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-950 px-5 py-3 shadow-sm shadow-slate-950/30">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
    </div>
  );
}
