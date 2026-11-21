"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins, Loader2, Pencil, Plus } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, Field, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { apiFetch, errorMessage } from "@/lib/fetcher";
import { formatDate, formatMT } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Worker {
  id: string;
  name: string;
  role: string;
  level: string | null;
  salary: number;
  debt: number;
  attendance: { day: number; present: boolean; month: number; year: number }[];
  loans: { id: string; date: string; amount: number; description: string | null }[];
}

/** Dias de trabalho por mês usados para estimar o desconto de uma falta. */
const WORK_DAYS_PER_MONTH = 26;

const roleColors: Record<string, string> = {
  Moldador: "bg-primary-container/40 text-on-primary-container",
  Moldadora: "bg-primary-container/40 text-on-primary-container",
  Ajudante: "bg-secondary-container/60 text-on-secondary-container",
  Motorista: "bg-tertiary-container/50 text-on-tertiary-container",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

export default function TrabalhadoresPage() {
  const [workers, setWorkers] = useState<Worker[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workerModal, setWorkerModal] = useState<Worker | "new" | null>(null);
  const [loanModal, setLoanModal] = useState(false);

  const load = useCallback(() => {
    return apiFetch<Worker[]>("/api/workers")
      .then((data) => {
        setWorkers(data);
        setSelectedId((cur) => cur ?? data[0]?.id ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = workers?.find((w) => w.id === selectedId);

  return (
    <div className="flex-1">
      <AdminHeader
        title="Equipa"
        subtitle="Trabalhadores, presenças, salários e adiantamentos"
        actions={
          <Button onClick={() => setWorkerModal("new")} className="h-10 bg-primary text-on-primary hover:bg-primary/90">
            <Plus className="mr-1.5 h-4 w-4" /> Novo trabalhador
          </Button>
        }
      />

      <div className="p-4 md:p-8">
        {error && <Alert className="mb-4" onClose={() => setError(null)}>{error}</Alert>}

        {!workers ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : workers.length === 0 ? (
          <EmptyState title="Sem trabalhadores ainda" description="Adicione o primeiro trabalhador para começar." />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {workers.map((w) => {
                const present = w.attendance.filter((d) => d.present).length;
                const rate = w.attendance.length ? Math.round((present / w.attendance.length) * 100) : null;
                return (
                  <li key={w.id}>
                    <button
                      onClick={() => setSelectedId(w.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border bg-surface-container-lowest p-4 text-left transition-colors",
                        w.id === selectedId ? "border-primary ring-1 ring-primary" : "border-outline-variant hover:border-outline",
                      )}
                    >
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-surface-container-high text-on-surface-variant">{initials(w.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-on-surface">{w.name}</p>
                        <p className="text-[12px] text-on-surface-variant">
                          {formatMT(w.salary)}
                          {rate !== null && ` · ${rate}% presença`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={cn("rounded-sm border-transparent", roleColors[w.role] ?? "bg-surface-container-high")}>
                          {w.role}
                        </Badge>
                        {w.debt > 0 && <span className="text-[11px] font-medium text-on-secondary-container">Deve {formatMT(w.debt)}</span>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="lg:col-span-2">
              {selected ? (
                <WorkerDetail
                  key={selected.id}
                  worker={selected}
                  onEdit={() => setWorkerModal(selected)}
                  onLoan={() => setLoanModal(true)}
                  onChanged={load}
                  onError={setError}
                />
              ) : (
                <EmptyState title="Seleccione um trabalhador" description="Clique num nome para ver os detalhes." />
              )}
            </div>
          </div>
        )}
      </div>

      {workerModal && (
        <WorkerModal
          worker={workerModal === "new" ? null : workerModal}
          onClose={() => setWorkerModal(null)}
          onSaved={(id) => {
            setWorkerModal(null);
            setSelectedId(id);
            load();
          }}
        />
      )}
      {loanModal && selected && (
        <LoanModal
          worker={selected}
          onClose={() => setLoanModal(false)}
          onSaved={() => {
            setLoanModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function WorkerDetail({
  worker,
  onEdit,
  onLoan,
  onChanged,
  onError,
}: {
  worker: Worker;
  onEdit: () => void;
  onLoan: () => void;
  onChanged: () => void;
  onError: (msg: string) => void;
}) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const byDay = new Map(worker.attendance.map((a) => [a.day, a.present]));
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const absences = worker.attendance.filter((a) => !a.present).length;
  const presents = worker.attendance.filter((a) => a.present).length;
  const absenceDeduction = Math.round((worker.salary / WORK_DAYS_PER_MONTH) * absences);
  const net = worker.salary - absenceDeduction;

  async function toggle(day: number) {
    const current = byDay.get(day);
    // sem registo → presente → falta → presente…
    const present = current === undefined ? true : !current;
    setSavingDay(day);
    try {
      await apiFetch(`/api/workers/${worker.id}/attendance`, { method: "PUT", body: { day, month, year, present } });
      onChanged();
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSavingDay(null);
    }
  }

  return (
    <div className="space-y-6 rounded-md border border-outline-variant bg-surface-container-lowest p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-surface-container-high text-title-md text-on-surface-variant">{initials(worker.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-headline-mobile font-semibold text-on-surface">{worker.name}</p>
            <p className="text-body-sm text-on-surface-variant">
              {worker.role}
              {worker.level && ` · ${worker.level}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-1.5 h-4 w-4" /> Editar
          </Button>
          <Button onClick={onLoan} className="bg-primary text-on-primary hover:bg-primary/90">
            <HandCoins className="mr-1.5 h-4 w-4" /> Empréstimo
          </Button>
        </div>
      </div>

      {/* Presenças */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-label-caps uppercase text-on-surface-variant">
            Presenças · {now.toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}
          </h3>
          <p className="text-body-sm text-on-surface">
            <b>{presents}</b> presenças · <b className="text-error">{absences}</b> faltas
          </p>
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const state = byDay.get(day);
            const future = day > today;
            return (
              <button
                key={day}
                disabled={future || savingDay !== null}
                onClick={() => toggle(day)}
                title={future ? "" : state === undefined ? "Marcar presença" : state ? "Presente — clique para marcar falta" : "Falta — clique para marcar presença"}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-body-sm font-medium transition-colors",
                  future && "cursor-default text-outline-variant",
                  !future && state === undefined && "border border-dashed border-outline-variant text-on-surface-variant hover:border-primary",
                  state === true && "bg-primary-container/40 text-on-primary-container",
                  state === false && "bg-error-container text-on-error-container",
                  day === today && "ring-2 ring-primary ring-offset-1",
                )}
              >
                {savingDay === day ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : day}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-on-surface-variant">Clique num dia para marcar presença; clique de novo para marcar falta.</p>
      </section>

      {/* Salário */}
      <section>
        <h3 className="mb-3 text-label-caps uppercase text-on-surface-variant">Resumo salarial (mês corrente)</h3>
        <div className="divide-y divide-outline-variant overflow-hidden rounded-md border border-outline-variant text-body-sm">
          <div className="flex justify-between px-4 py-3">
            <span>Salário base</span>
            <span className="font-medium tabular-nums">{formatMT(worker.salary)}</span>
          </div>
          {absences > 0 && (
            <div className="flex justify-between px-4 py-3">
              <span>
                Desconto de faltas ({absences} {absences === 1 ? "dia" : "dias"})
                <span className="block text-[12px] text-on-surface-variant">Estimativa: salário ÷ {WORK_DAYS_PER_MONTH} dias × faltas</span>
              </span>
              <span className="font-medium text-error tabular-nums">− {formatMT(absenceDeduction)}</span>
            </div>
          )}
          <div className="flex justify-between bg-surface-container-low px-4 py-3">
            <span className="font-medium">A pagar (antes de dívidas)</span>
            <span className="text-title-md font-semibold tabular-nums">{formatMT(net)}</span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span>Dívida em aberto</span>
            <span className={cn("font-semibold tabular-nums", worker.debt > 0 ? "text-on-secondary-container" : "")}>{formatMT(worker.debt)}</span>
          </div>
        </div>
      </section>

      {/* Empréstimos */}
      {worker.loans.length > 0 && (
        <section>
          <h3 className="mb-3 text-label-caps uppercase text-on-surface-variant">Empréstimos e reembolsos</h3>
          <ul className="divide-y divide-outline-variant rounded-md border border-outline-variant text-body-sm">
            {worker.loans.map((l) => (
              <li key={l.id} className="flex justify-between px-4 py-2.5">
                <span>
                  {l.description || (l.amount > 0 ? "Empréstimo" : "Reembolso")}
                  <span className="block text-[12px] text-on-surface-variant">{formatDate(l.date)}</span>
                </span>
                <span className={cn("font-medium tabular-nums", l.amount > 0 ? "text-on-secondary-container" : "text-primary")}>
                  {l.amount > 0 ? "+" : "−"} {formatMT(Math.abs(l.amount))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function WorkerModal({ worker, onClose, onSaved }: { worker: Worker | null; onClose: () => void; onSaved: (id: string) => void }) {
  const [form, setForm] = useState({
    name: worker?.name ?? "",
    role: worker?.role ?? "Ajudante",
    level: worker?.level ?? "",
    salary: worker ? String(worker.salary) : "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ id: string }>(worker ? `/api/workers/${worker.id}` : "/api/workers", {
        method: worker ? "PATCH" : "POST",
        body: { ...form, salary: Number(form.salary), level: form.level || null },
      });
      onSaved(res.id);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={worker ? `Editar ${worker.name}` : "Novo trabalhador"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Nome completo" htmlFor="w-name" required>
          <TextInput id="w-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Função" htmlFor="w-role" required hint="Ex.: Moldador, Ajudante, Motorista">
            <TextInput id="w-role" list="roles" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <datalist id="roles">
              <option value="Moldador" />
              <option value="Moldadora" />
              <option value="Ajudante" />
              <option value="Motorista" />
            </datalist>
          </Field>
          <Field label="Nível" htmlFor="w-level">
            <TextInput id="w-level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} />
          </Field>
        </div>
        <Field label="Salário mensal (MT)" htmlFor="w-salary" required>
          <TextInput id="w-salary" type="number" min={0} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

function LoanModal({ worker, onClose, onSaved }: { worker: Worker; onClose: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"emprestimo" | "reembolso">("emprestimo");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/workers/${worker.id}/loans`, {
        method: "POST",
        body: { kind, amount: Number(amount), description: description || null },
      });
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Empréstimo — ${worker.name}`}
      description={`Dívida actual: ${formatMT(worker.debt)}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !(Number(amount) > 0)} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Registar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <div className="grid grid-cols-2 gap-2">
          {([["emprestimo", "Novo empréstimo"], ["reembolso", "Reembolso"]] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              disabled={k === "reembolso" && worker.debt <= 0}
              className={cn(
                "h-10 rounded-md border text-body-sm font-medium disabled:opacity-40",
                kind === k ? "border-primary bg-primary/10 text-primary" : "border-outline-variant",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <Field label="Valor (MT)" htmlFor="l-amount" required>
          <TextInput id="l-amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Descrição" htmlFor="l-desc">
          <TextInput id="l-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={kind === "reembolso" ? "Ex.: descontado no salário" : "Ex.: adiantamento"} />
        </Field>
      </div>
    </Modal>
  );
}
