import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatMT } from "@/lib/utils";
import type { Worker } from "@/types";

const roleColors: Record<string, string> = {
  Moldador: "bg-primary-container text-on-primary-container",
  Moldadora: "bg-primary-container text-on-primary-container",
  Ajudante: "bg-secondary-container text-on-secondary-container",
  Motorista: "bg-tertiary-container text-on-tertiary-container",
};

interface WorkerCardProps {
  worker: Worker;
  isActive?: boolean;
  onClick?: () => void;
}

export function WorkerCard({ worker, isActive, onClick }: WorkerCardProps) {
  const initials = worker.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border bg-surface-container-lowest p-5 space-y-3 transition-colors",
        isActive ? "border-primary ring-1 ring-primary" : "border-outline-variant hover:border-outline"
      )}
    >
      <div className="flex items-start justify-between">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-surface-container-high text-on-surface-variant text-title-md">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Badge variant="outline" className={cn("rounded-sm font-medium border-transparent", roleColors[worker.role])}>
          {worker.role}
        </Badge>
      </div>

      <div>
        <p className="text-title-md font-medium text-on-surface">{worker.name}</p>
      </div>

      <div className="space-y-1 text-body-sm">
        <p className="text-on-surface-variant">
          Salário: <span className="font-medium text-on-surface">{formatMT(worker.salary)}</span>
        </p>
        <p className="text-on-surface-variant">
          Dívida:{" "}
          <span className={cn("font-medium", worker.debt > 0 ? "text-secondary" : "text-on-surface")}>
            {formatMT(worker.debt)}
          </span>
        </p>
      </div>

      {worker.attendanceRate !== undefined && (
        <div className="pt-2 border-t border-outline-variant">
          <p className="text-body-sm text-on-surface-variant">
            Presença mensal:{" "}
            <span className="font-medium text-primary">{worker.attendanceRate}%</span>
          </p>
        </div>
      )}
    </button>
  );
}