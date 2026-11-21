'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Package, Wrench, History, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { AdminHeader } from '@/components/shared/admin-header';
import { Button } from '@/components/ui/button';
import { StockProgressBar, MaterialLevelBar } from '@/components/shared/stock-progress-bar';
import { apiFetch, errorMessage } from '@/lib/fetcher';
import { BLOCK_TYPES } from '@/lib/validation';
import { Modal } from '@/components/ui/modal';
import { Alert, Field, TextInput } from '@/components/ui/field';
import { formatDate, formatNumber } from '@/lib/format';

interface BlockStock {
  id: string;
  type: string;
  label: string;
  description?: string;
  available: number;
  reserved: number;
  total: number;
}

interface MaterialStock {
  id: string;
  name: string;
  unit: string;
  current: number;
  minimum: number;
  lastRestock?: string;
  supplier?: string;
}

interface ProductionRow {
  id: string;
  date: string;
  blockType: string;
  quantity: number;
  damaged: number;
  cementBags: number;
  sandM3: number;
  worker: { name: string };
}

interface Worker {
  id: string;
  name: string;
}

const BLOCK_LABELS: Record<string, string> = {
  '9cm': 'Bloco 9cm',
  '12cm': 'Bloco 12cm',
  '15cm': 'Bloco 15cm',
  'pave': 'Pavê Hexagonal',
};

export default function ProducaoPage() {
  const [blockStocks, setBlockStocks] = useState<BlockStock[]>([]);
  const [materialStocks, setMaterialStocks] = useState<MaterialStock[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    data: '',
    workerId: '',
    tipoBloco: '9cm',
    quantidade: '',
    sacosCimento: '',
    m3Areia: '',
    danificados: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restocking, setRestocking] = useState<MaterialStock | null>(null);
  const [history, setHistory] = useState<ProductionRow[] | null>(null);

  const loadData = useCallback(() => {
    Promise.all([
      apiFetch<{ blockStocks: BlockStock[]; materialStocks: MaterialStock[] }>('/api/stock'),
      apiFetch<Worker[]>('/api/workers'),
    ])
      .then(([stockData, workersData]) => {
        setBlockStocks(stockData.blockStocks);
        setMaterialStocks(stockData.materialStocks);
        setWorkers(workersData);
        if (workersData.length > 0) {
          setForm(f => (f.workerId ? f : { ...f, workerId: workersData[0].id }));
        }
      })
      .catch(err => setError(errorMessage(err)))
      .finally(() => setLoading(false));
    apiFetch<ProductionRow[]>('/api/production').then(setHistory).catch(() => setHistory([]));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.data) { setError('Por favor, seleccione uma data.'); return; }
    if (!form.quantidade || Number(form.quantidade) <= 0) {
      setError('Quantidade produzida deve ser maior que zero.');
      return;
    }
    if (!form.workerId) { setError('Seleccione o responsável pela produção.'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/production', {
        method: 'POST',
        body: {
          date: form.data,
          workerId: form.workerId,
          blockType: form.tipoBloco,
          quantity: Number(form.quantidade),
          cementBags: Number(form.sacosCimento) || 0,
          sandM3: Number(form.m3Areia) || 0,
          damaged: Number(form.danificados) || 0,
        },
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm(f => ({ ...f, quantidade: '', sacosCimento: '', m3Areia: '', danificados: '' }));
      loadData();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1">
      <AdminHeader title="Produção e stock" subtitle="Registo diário de produção e materiais" />

      <div className="p-4 md:p-8 space-y-6">

        {/* Registo de Produção */}
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-title-md font-medium text-on-surface">Registo de Produção</h2>
            </div>
            <span className="text-body-sm text-on-surface-variant italic">Entrada de dados diária</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Data</label>
                <input
                  type="date"
                  name="data"
                  value={form.data}
                  onChange={handleChange}
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Responsável</label>
                <select
                  name="workerId"
                  value={form.workerId}
                  onChange={handleChange}
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Tipo de Bloco</label>
                <select
                  name="tipoBloco"
                  value={form.tipoBloco}
                  onChange={handleChange}
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                >
                  {BLOCK_TYPES.map(t => (
                    <option key={t} value={t}>{BLOCK_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Quantidade Produzida</label>
                <input
                  type="number"
                  name="quantidade"
                  min="0"
                  value={form.quantidade}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Sacos de Cimento</label>
                <div className="relative">
                  <input
                    type="number"
                    name="sacosCimento"
                    min="0"
                    step="0.5"
                    value={form.sacosCimento}
                    onChange={handleChange}
                    placeholder="0.0"
                    className="h-11 w-full bg-white border border-outline-variant rounded-md pl-3 pr-10 text-on-surface text-body-sm focus:border-primary outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-label-caps text-on-surface-variant">UN</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">M³ Areia</label>
                <div className="relative">
                  <input
                    type="number"
                    name="m3Areia"
                    min="0"
                    step="0.1"
                    value={form.m3Areia}
                    onChange={handleChange}
                    placeholder="0.0"
                    className="h-11 w-full bg-white border border-outline-variant rounded-md pl-3 pr-10 text-on-surface text-body-sm focus:border-primary outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-label-caps text-on-surface-variant">m³</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-label-caps text-on-surface-variant uppercase tracking-widest">Blocos Danificados</label>
                <input
                  type="number"
                  name="danificados"
                  min="0"
                  value={form.danificados}
                  onChange={handleChange}
                  placeholder="0"
                  className="h-11 bg-white border border-outline-variant rounded-md px-3 text-on-surface text-body-sm focus:border-primary outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="h-11 bg-primary text-on-primary hover:bg-primary/90 rounded-md font-semibold tracking-wide"
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? 'A guardar...' : 'Registar Produção'}
              </Button>
            </div>

            {error && (
              <p className="text-body-sm text-error font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4" /> {error}
              </p>
            )}
            {submitted && (
              <p className="text-body-sm text-primary font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Registo guardado com sucesso!
              </p>
            )}
          </form>
        </div>

        {/* Stock panels */}
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">A carregar stock...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

            {/* Stock de Blocos */}
            <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-title-md font-medium text-on-surface">Stock de Blocos</h2>
                </div>
                <div className="flex items-center gap-4 text-label-caps text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    Disponível
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary inline-block" />
                    Reservado
                  </span>
                </div>
              </div>

              <div className="border-t border-outline-variant">
                <div className="grid grid-cols-3 py-2 px-2 bg-surface-container-low text-label-caps text-on-surface-variant uppercase tracking-widest">
                  <span>Referência</span>
                  <span className="text-center">Equilíbrio de Stock</span>
                  <span className="text-right">Total</span>
                </div>

                {blockStocks.map(stock => (
                  <div
                    key={stock.type}
                    className="grid grid-cols-3 items-center py-4 px-2 border-t border-outline-variant/50"
                  >
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">{stock.label}</p>
                      <p className="text-label-caps text-on-surface-variant">{stock.description}</p>
                    </div>
                    <div className="px-4">
                      <StockProgressBar
                        available={stock.available}
                        reserved={stock.reserved}
                        total={stock.total}
                      />
                      <div className="flex justify-between text-label-caps text-on-surface-variant mt-1">
                        <span>{stock.available.toLocaleString('pt-MZ')} disp.</span>
                        <span>{stock.reserved.toLocaleString('pt-MZ')} resv.</span>
                      </div>
                    </div>
                    <p className="text-right text-body-sm font-semibold text-on-surface">
                      {stock.total.toLocaleString('pt-MZ')} UN
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock de Materiais */}
            <div id="materiais" className="scroll-mt-4 rounded-md border border-outline-variant bg-surface-container-lowest p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                <h2 className="text-title-md font-medium text-on-surface">Stock de Materiais</h2>
              </div>

              {materialStocks.map(mat => (
                <div key={mat.name} className="rounded-md border border-outline-variant p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-body-sm font-medium text-on-surface">{mat.name}</p>
                      <p className="text-label-caps text-on-surface-variant uppercase tracking-widest">{mat.unit}</p>
                    </div>
                    <span className="text-title-md font-bold text-primary">
                      {mat.current} <span className="text-label-caps font-normal text-on-surface-variant">{mat.unit}</span>
                    </span>
                  </div>

                  <MaterialLevelBar current={mat.current} minimum={mat.minimum} />

                  <div className="flex justify-between text-label-caps text-on-surface-variant uppercase tracking-widest">
                    <span>Nível de Stock</span>
                    <span>Mínimo: {mat.minimum} {mat.unit}</span>
                  </div>

                  {mat.current < mat.minimum && (
                    <div className="bg-secondary-container/30 border border-secondary-container rounded-sm px-3 py-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-on-secondary-container flex-shrink-0" />
                      <span className="text-label-caps font-semibold uppercase tracking-widest text-on-secondary-container">
                        Reabastecimento necessário
                      </span>
                    </div>
                  )}

                  {mat.lastRestock && (
                    <div className="flex flex-col gap-1 text-body-sm text-on-surface-variant pt-2 border-t border-outline-variant/50">
                      <div className="flex justify-between">
                        <span>Último Restock:</span>
                        <span className="text-on-surface font-medium">
                          {new Date(mat.lastRestock).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {mat.supplier && (
                        <div className="flex justify-between">
                          <span>Fornecedor:</span>
                          <span className="text-on-surface font-medium">{mat.supplier}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button variant="outline" size="sm" onClick={() => setRestocking(mat)} className="self-start">
                    <Plus className="h-4 w-4 mr-1" /> Registar entrada
                  </Button>
                </div>
              ))}

              <p className="text-[12px] text-on-surface-variant">
                O cimento e a areia indicados em cada registo de produção são descontados automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* Histórico de produção */}
        <section className="rounded-md border border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-2 border-b border-outline-variant px-6 py-4">
            <History className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-medium text-on-surface">Últimos registos de produção</h2>
          </div>
          {!history ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : history.length === 0 ? (
            <p className="px-6 py-6 text-body-sm text-on-surface-variant">Ainda não há registos de produção.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead className="bg-surface-container-low text-left text-label-caps uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-2">Data</th>
                    <th className="px-6 py-2">Responsável</th>
                    <th className="px-6 py-2">Bloco</th>
                    <th className="px-6 py-2 text-right">Produzidos</th>
                    <th className="px-6 py-2 text-right">Danificados</th>
                    <th className="px-6 py-2 text-right">Cimento</th>
                    <th className="px-6 py-2 text-right">Areia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="px-6 py-2.5 whitespace-nowrap">{formatDate(h.date)}</td>
                      <td className="px-6 py-2.5">{h.worker.name}</td>
                      <td className="px-6 py-2.5">{BLOCK_LABELS[h.blockType] ?? h.blockType}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums">{formatNumber(h.quantity)}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums">{h.damaged ? formatNumber(h.damaged) : '—'}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums">{h.cementBags || '—'}</td>
                      <td className="px-6 py-2.5 text-right tabular-nums">{h.sandM3 ? `${h.sandM3} m³` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {restocking && (
        <RestockModal
          material={restocking}
          onClose={() => setRestocking(null)}
          onSaved={() => { setRestocking(null); loadData(); }}
        />
      )}
    </div>
  );
}

function RestockModal({ material, onClose, onSaved }: { material: MaterialStock; onClose: () => void; onSaved: () => void }) {
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState(material.supplier ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/materials/${material.id}/restock`, {
        method: 'POST',
        body: { quantity: Number(quantity), supplier: supplier || null },
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
      title={`Entrada de ${material.name}`}
      description={`Stock actual: ${material.current} ${material.unit}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !(Number(quantity) > 0)} className="bg-primary text-on-primary hover:bg-primary/90">
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Registar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label={`Quantidade recebida (${material.unit})`} htmlFor="rs-q" required>
          <TextInput id="rs-q" type="number" min={0} step="0.5" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Fornecedor" htmlFor="rs-s">
          <TextInput id="rs-s" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
