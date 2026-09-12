"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { useLanguage } from "@/providers/app-providers";

export default function ReportsPage() {
  const { t, dir } = useLanguage();

  return (
    <div dir={dir}>
      <PlaceholderPage
        title={t.common.reports}
        description={t.common.reports}
      />
    </div>
  );
}
