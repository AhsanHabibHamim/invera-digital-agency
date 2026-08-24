'use client';

import { useState, useEffect, useCallback } from 'react';
import DataTable, { type Column } from '@/components/ui/DataTable';
import DashboardStats from '@/components/dashboard/DashboardStats';
import * as financeService from '@/services/finance';
import { useClients } from '@/hooks/useEntityOptions';
import { getErrorMessage, isValidObjectId } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Expense, Income } from '@/types';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, X, Loader2, Trash2, AlertCircle,
} from 'lucide-react';

type Tab = 'expenses' | 'income';

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
}

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>('expenses');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Finance</h1>
        <p className="mt-1 text-sm text-neutral-500">Track expenses, income, and financial performance</p>
      </div>
      <FinanceStatsCards />
      <MonthlySummaryChart />
      <div className="flex gap-1 border-b border-border">
        {(['expenses', 'income'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'expenses' && <ExpensesTab />}
      {tab === 'income' && <IncomeTab />}
    </div>
  );
}

function FinanceStatsCards() {
  const [summary, setSummary] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  useEffect(() => {
    financeService.getFinancialSummary().then((res) => {
      if (res.success) setSummary(res.data);
    }).catch(() => {});
  }, []);

  if (!summary) return null;

  return (
    <DashboardStats
      stats={[
        { label: 'Total Income', value: `$${summary.totalIncome?.toLocaleString() ?? 0}`, icon: <TrendingUp size={18} />, trend: { value: 12, isUp: true } },
        { label: 'Total Expenses', value: `$${summary.totalExpenses?.toLocaleString() ?? 0}`, icon: <TrendingDown size={18} />, trend: { value: 8, isUp: false } },
        { label: 'Net Profit', value: `$${summary.netProfit?.toLocaleString() ?? 0}`, icon: <DollarSign size={18} />, trend: { value: 15, isUp: (summary.netProfit ?? 0) >= 0 } },
      ]}
    />
  );
}

function MonthlySummaryChart() {
  const [data, setData] = useState<MonthlySummary[]>([]);

  useEffect(() => {
    financeService.getMonthlyData().then((res) => {
      if (res.success) {
        setData(res.data ?? []);
      }
    }).catch(() => {});
  }, []);

  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((m) => Math.max(m.income, m.expenses)), 1);

  return (
    <div className="card-dashboard">
      <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Breakdown</h3>
      <div className="flex items-end gap-2 h-32">
        {data.map((m) => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col items-center gap-0.5 relative" style={{ height: `${(Math.max(m.income, m.expenses) / maxVal) * 100}%` }}>
              <div className="w-full bg-primary/20 rounded-t" style={{ height: `${(m.income / Math.max(m.income, m.expenses)) * 100}%`, minHeight: 2 }} title={`Income: $${m.income}`} />
              <div className="w-full bg-destructive/20 rounded-t" style={{ height: `${(m.expenses / Math.max(m.income, m.expenses)) * 100}%`, minHeight: 2 }} title={`Expenses: $${m.expenses}`} />
            </div>
            <span className="text-[10px] text-foreground/40 mt-1">{m.month}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2 text-xs text-foreground/50">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-primary/40" /> Income</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive/40" /> Expenses</span>
      </div>
    </div>
  );
}

function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<any>({ title: '', amount: 0, category: '', paidBy: '', expenseDate: '', description: '', notes: '', isRecurring: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [submitting, setSubmitting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const [eRes, cRes] = await Promise.all([
        financeService.getExpenses(params),
        financeService.getFinanceCategories(),
      ]);
      if (eRes.success) {
        setExpenses(eRes.data.expenses ?? []);
        setTotal(eRes.data.total ?? 0);
        setTotalPages(eRes.data.totalPages ?? 1);
      }
      if (cRes.success) {
        setCategories(cRes.data.expenseCategories ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page, search, categoryFilter]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const openEdit = (e: Expense) => {
    setEditing(e);
    setForm({
      title: e.title, amount: e.amount, category: e.category, paidBy: e.paidBy,
      expenseDate: e.expenseDate?.split('T')[0] || '', description: e.description || '',
      notes: e.notes || '', isRecurring: e.isRecurring,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', amount: 0, category: '', paidBy: '', expenseDate: '', description: '', notes: '', isRecurring: false });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (editing) {
        await financeService.updateExpense(editing._id, form);
      } else {
        await financeService.createExpense(form);
      }
      setShowModal(false);
      fetch();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    await financeService.deleteExpense(id);
    fetch();
  };

  const columns: Column<Expense>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (e) => <span className="font-medium text-foreground">{e.title}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (e) => <span className="font-mono font-semibold text-destructive">-${e.amount?.toLocaleString()}</span> },
    { key: 'category', label: 'Category', render: (e) => <span className="badge">{e.category}</span> },
    { key: 'expenseDate', label: 'Date', sortable: true, render: (e) => new Date(e.expenseDate).toLocaleDateString() },
    { key: 'paidBy', label: 'Paid By', render: (e) => (typeof e.paidBy === 'string' ? e.paidBy : e.paidBy?.name) || <span className="text-foreground/40">—</span> },
    {
      key: 'actions', label: 'Actions', render: (e) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-icon" onClick={(ev) => { ev.stopPropagation(); openEdit(e); }}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button className="btn btn-ghost btn-icon text-destructive" onClick={(ev) => { ev.stopPropagation(); handleDelete(e._id); }}><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input className="input pl-3" placeholder="Search expenses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary btn-md" onClick={openCreate}><Plus className="w-4 h-4" /> Add Expense</button>
      </div>
      <DataTable
        columns={columns}
        data={expenses}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No expenses found"
        keyExtractor={(e) => e._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Amount *</label>
                <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select...</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="input" type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Paid By</label>
                <input className="input" value={form.paidBy} onChange={(e) => setForm({ ...form, paidBy: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.title || !form.amount} onClick={handleSave}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IncomeTab() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [form, setForm] = useState<any>({ title: '', amount: 0, source: '', clientId: '', incomeDate: '', description: '', notes: '', isRecurring: false }); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const { clients } = useClients();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (search) params.search = search;
      if (sourceFilter) params.source = sourceFilter;
      const [iRes, cRes] = await Promise.all([
        financeService.getIncomes(params),
        financeService.getFinanceCategories(),
      ]);
      if (iRes.success) {
        setIncomes(iRes.data.incomes ?? []);
        setTotal(iRes.data.total ?? 0);
        setTotalPages(iRes.data.totalPages ?? 1);
      }
      if (cRes.success) {
        setSources(cRes.data.incomeSources ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [page, search, sourceFilter]);

  useEffect(() => { fetch(); }, [fetch]); // eslint-disable-line react-hooks/set-state-in-effect

  const openEdit = (i: Income) => {
    setEditing(i);
    setForm({
      title: i.title, amount: i.amount, source: i.source, clientId: i.clientId || '',
      incomeDate: i.incomeDate?.split('T')[0] || '', description: i.description || '',
      notes: i.notes || '', isRecurring: i.isRecurring,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', amount: 0, source: '', clientId: '', incomeDate: '', description: '', notes: '', isRecurring: false });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (form.clientId && !isValidObjectId(form.clientId)) {
      setFormError('Please select a valid client.');
      return;
    }
    setSubmitting(true);
    try {
      const res = editing
        ? await financeService.updateIncome(editing._id, form)
        : await financeService.createIncome(form);
      if (!res.success) {
        setFormError(getErrorMessage(res, 'Failed to save income'));
        return;
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save income'));
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    await financeService.deleteIncome(id);
    fetch();
  };

  const columns: Column<Income>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (i) => <span className="font-medium text-foreground">{i.title}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: (i) => <span className="font-mono font-semibold text-success">+${i.amount?.toLocaleString()}</span> },
    { key: 'source', label: 'Source', render: (i) => <span className="badge badge-info">{i.source}</span> },
    { key: 'incomeDate', label: 'Date', sortable: true, render: (i) => new Date(i.incomeDate).toLocaleDateString() },
    { key: 'clientId', label: 'Client', render: (i) => (typeof i.clientId === 'string' ? i.clientId : i.clientId?.name) || <span className="text-foreground/40">—</span> },
    {
      key: 'actions', label: 'Actions', render: (i) => (
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-icon" onClick={(ev) => { ev.stopPropagation(); openEdit(i); }}><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button className="btn btn-ghost btn-icon text-destructive" onClick={(ev) => { ev.stopPropagation(); handleDelete(i._id); }}><Trash2 className="w-4 h-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input className="input pl-3" placeholder="Search income..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
          <option value="">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-primary btn-md" onClick={openCreate}><Plus className="w-4 h-4" /> Add Income</button>
      </div>
      <DataTable
        columns={columns}
        data={incomes}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={loading}
        emptyMessage="No income records found"
        keyExtractor={(i) => i._id}
      />
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">{editing ? 'Edit Income' : 'Add Income'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
            </div>
            {formError && (
              <div className="form-alert form-alert-error mb-4" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="col-span-2">
                <label className="form-label">Title *</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Amount *</label>
                <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </div>
              <div>
                <label className="form-label">Source</label>
                <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Select...</option>
                  {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input className="input" type="date" value={form.incomeDate} onChange={(e) => setForm({ ...form, incomeDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Client</label>
                <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">No client...</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn btn-outline btn-md" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-md" disabled={submitting || !form.title || !form.amount} onClick={handleSave}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
