import { Inbox } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="rounded-full bg-surface-container-low p-4 mb-4">
        <Icon className="h-6 w-6 text-on-surface-variant" />
      </div>
      <p className="text-title-md font-medium text-on-surface">{title}</p>
      {description && (
        <p className="text-body-sm text-on-surface-variant mt-1 max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}