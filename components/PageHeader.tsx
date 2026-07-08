import Link from "next/link";

export function PageHeader({ title, description, actionHref, actionLabel }: { title: string; description?: string; actionHref?: string; actionLabel?: string }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold text-domicha-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="inline-flex items-center justify-center rounded-md bg-domicha-tea px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-domicha-tea/90">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
