export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xl text-slate-600 dark:text-slate-400">{description}</p>
      <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        KentGözü v3 — bu modül bir sonraki iterasyonda tamamlanacak.
      </div>
    </div>
  );
}
