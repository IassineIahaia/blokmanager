import { CurrencyValue } from "@/components/shared/currency-value";
import type { Worker } from "@/types";

interface SalarySummaryProps {
  worker: Worker;
}

export function SalarySummary({ worker }: SalarySummaryProps) {
  const loanDeduction = worker.debt > 0 ? worker.loans?.[0]?.amount ?? 0 : 0;
  const absenceDeduction = worker.absenceDeduction ?? 0;
  const total = worker.salary - loanDeduction - absenceDeduction;

  return (
    <div>
      <h3 className="text-label-caps uppercase text-on-surface-variant mb-3">
        Resumo Salarial (Mês Corrente)
      </h3>
      <div className="rounded-md border border-outline-variant overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <span className="text-body-md text-on-surface">Salário Base</span>
          <CurrencyValue value={worker.salary} className="font-medium text-on-surface" />
        </div>

        {loanDeduction > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <span className="text-body-md text-on-surface">Desconto Empréstimo</span>
            <span className="font-medium text-error">- {formatNegative(loanDeduction)}</span>
          </div>
        )}

        {absenceDeduction > 0 && worker.absences && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <span className="text-body-md text-on-surface">
              Faltas ({worker.absences} dias)
            </span>
            <span className="font-medium text-error">- {formatNegative(absenceDeduction)}</span>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low">
          <span className="text-body-md font-medium text-on-surface">Total Líquido</span>
          <CurrencyValue value={total} className="text-title-md font-semibold text-on-surface" />
        </div>
      </div>
    </div>
  );
}

function formatNegative(value: number) {
  return `MT ${new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2 }).format(value)}`;
}