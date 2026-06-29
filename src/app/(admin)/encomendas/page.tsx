"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { AdminHeader } from "@/components/shared/admin-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyValue } from "@/components/shared/currency-value";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderStatus } from "@/types";

interface Order {
  id: string;
  cliente: string;
  valor: number;
  status: string;
  date: string;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "pendente",
  "confirmado",
  "entregue",
  "cancelado",
];

export default function EncomendasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cliente, setCliente] = useState("");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleCreate() {
    if (!cliente || !valor) return;
    setSaving(true);
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, valor: Number(valor) }),
    });
    setCliente("");
    setValor("");
    setShowForm(false);
    setSaving(false);
    loadOrders();
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  async function handleDelete(id: string) {
    if (!confirm("Eliminar esta encomenda?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    loadOrders();
  }

  const total = orders.reduce((s, o) => s + o.valor, 0);
  const pendentes = orders.filter((o) => o.status === "pendente").length;
  const entregues = orders.filter((o) => o.status === "entregue").length;

  return (
    <div className="flex-1">
      <AdminHeader
        title="Encomendas"
        userName="João Silva"
        userRole="Administrador"
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Métricas rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-label-caps text-on-surface-variant uppercase">
              Total
            </p>
            <p className="text-2xl font-semibold text-on-surface mt-1">
              {orders.length}
            </p>
          </div>
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-label-caps text-on-surface-variant uppercase">
              Pendentes
            </p>
            <p className="text-2xl font-semibold text-secondary mt-1">
              {pendentes}
            </p>
          </div>
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
            <p className="text-label-caps text-on-surface-variant uppercase">
              Entregues
            </p>
            <p className="text-2xl font-semibold text-primary mt-1">
              {entregues}
            </p>
          </div>
        </div>

        {/* Header + botão */}
        <div className="flex items-center justify-between">
          <h2 className="text-title-md font-medium text-on-surface">
            Todas as Encomendas
            <span className="ml-2 text-on-surface-variant text-body-sm font-normal">
              — Total: <CurrencyValue value={total} />
            </span>
          </h2>
          <Button
            onClick={() => setShowForm(true)}
            className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Encomenda
          </Button>
        </div>

        {/* Formulário inline */}
        {showForm && (
          <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-title-sm font-medium text-on-surface">
                Nova Encomenda
              </h3>
              <button onClick={() => setShowForm(false)}>
                <X className="h-4 w-4 text-on-surface-variant hover:text-on-surface" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Cliente
                </label>
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Valor (MT)
                </label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0"
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="h-11 border-outline-variant rounded-md"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !cliente || !valor}
                className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md"
              >
                {saving ? "A guardar..." : "Criar Encomenda"}
              </Button>
            </div>
          </div>
        )}

        {/* Tabela */}
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest">
          {loading ? (
            <div className="text-center py-12 text-on-surface-variant">
              A carregar...
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="Sem encomendas"
              description="Crie a primeira encomenda."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container-low">
                  <TableHead className="text-label-caps uppercase text-on-surface-variant">
                    ID
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-variant">
                    Cliente
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-variant">
                    Data
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-variant text-right">
                    Valor
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-variant">
                    Estado
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-variant">
                    Acções
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-outline-variant">
                    <TableCell className="font-medium text-on-surface">
                      #{order.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {order.cliente}
                    </TableCell>
                    <TableCell className="text-on-surface-variant">
                      {new Date(order.date).toLocaleDateString("pt-MZ")}
                    </TableCell>
                    <TableCell className="text-right text-on-surface">
                      <CurrencyValue value={order.valor} />
                    </TableCell>
                    <TableCell>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus,
                          )
                        }
                        className="text-body-sm border border-outline-variant rounded-md px-2 py-1 bg-white text-on-surface focus:border-primary outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-label-caps text-on-surface-variant hover:text-error transition-colors"
                      >
                        Eliminar
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
