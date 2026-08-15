import Link from "next/link";

import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";

type PlaceholderPageProps = {
  title: string;
  description: string;
  compact?: boolean;
};

export function PlaceholderPage({
  title,
  description,
  compact = false,
}: PlaceholderPageProps) {
  return (
    <section className={cn(compact ? "space-y-3" : "space-y-4")}>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      {!compact ? (
        <Link
          href={routes.public.home}
          className="inline-flex text-sm font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
        >
          Back to home
        </Link>
      ) : null}
    </section>
  );
}
