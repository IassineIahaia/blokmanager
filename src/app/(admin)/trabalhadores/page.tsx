"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { WorkerCard } from "@/components/shared/worker-card";
import { AttendanceCalendar } from "@/components/shared/attendance-calendar";
import { SalarySummary } from "@/components/shared/salary-summary";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { Worker } from "@/types";

type DbWorker = Worker & {
  attendance: { day: number; present: boolean; month: number; year: number }[];
  loans: { id: string; date: string; amount: number; description?: string }[];
};

export default function TrabalhadoresPage() {
  const [workers, setWorkers] = useState<DbWorker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/workers")
      .then((r) => r.json())
      .then((data) => {
        setWorkers(data);
        if (data.length > 0) setSelectedId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selected = workers.find((w) => w.id === selectedId);

  const initials = selected?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="flex-1">
      <AdminHeader title="Trabalhadores" userName="João Silva" userRole="Administrador" />

      <div className="p-4 md:p-8">
        <div className="flex items-center justify-end mb-4">
          <Button className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md">
            <Plus className="h-4 w-4 mr-2" />
            Novo Registo
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">A carregar trabalhadores...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Worker cards */}
            <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {workers.length === 0 ? (
                <EmptyState
                  title="Sem trabalhadores ainda"
                  description="Adicione o primeiro trabalhador para começar."
                />
              ) : (
                workers.map((worker) => (
                  <WorkerCard
                    key={worker.id}
                    worker={worker}
                    isActive={worker.id === selectedId}
                    onClick={() => setSelectedId(worker.id)}
                  />
                ))
              )}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {selected ? (
                <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <ChevronLeft className="h-4 w-4" />
                      <h2 className="text-title-md font-medium text-on-surface">
                        Perfil do Trabalhador
                      </h2>
                    </div>
                    <Button className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md">
                      Registar Empréstimo
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="bg-surface-container-high text-on-surface-variant text-headline-mobile">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-headline-mobile font-semibold text-on-surface">
                        {selected.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="rounded-sm bg-primary-container text-on-primary-container border-transparent">
                          {selected.role}{selected.level ? ` ${selected.level}` : ""}
                        </Badge>
                        <Badge variant="outline" className="rounded-sm border-outline-variant text-on-surface-variant">
                          ID: {selected.id.slice(-8).toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {selected.attendance && selected.attendance.length > 0 && (
                    <AttendanceCalendar
                      attendance={selected.attendance}
                      presentCount={selected.attendance.filter((d) => d.present).length}
                      totalDays={selected.attendance.length}
                    />
                  )}

                  <SalarySummary worker={selected} />
                </div>
              ) : (
                <EmptyState
                  title="Selecione um trabalhador"
                  description="Clique num card para ver os detalhes."
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}