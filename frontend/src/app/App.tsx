import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  CalendarDays,
  CreditCard,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';

type Revenue = {
  id: number;
  entry_date: string;
  amount: number;
  note: string | null;
  created_at?: string;
};

type Expense = {
  id: number;
  expense_date: string;
  amount: number;
  label: string;
  note: string | null;
  created_at?: string;
};

type Credit = {
  id: number;
  customer_name: string;
  amount: number;
  credit_date: string;
  status: 'pending' | 'paid';
  note: string | null;
  created_at?: string;
};

type Summary = {
  weekStart: string;
  weekEnd: string;
  weeklyRevenue: number;
  weeklyExpenses: number;
  weeklyProfit: number;
  pendingCredits: number;
  dailyCount: number;
};

const today = format(new Date(), 'yyyy-MM-dd');

const emptyRevenueForm = {
  entry_date: today,
  amount: '',
  note: '',
};

const emptyExpenseForm = {
  expense_date: today,
  amount: '',
  label: '',
  note: '',
};

const emptyCreditForm = {
  customer_name: '',
  amount: '',
  credit_date: today,
  status: 'pending',
  note: '',
};

const productionApiBaseUrl = 'https://caramel-eight.vercel.app';
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const apiBaseUrl = (
  configuredApiBaseUrl ||
  (window.location.hostname === 'localhost' ? '' : productionApiBaseUrl)
).replace(/\/$/, '');

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const requestUrl = `${apiBaseUrl}${path}`;
  const response = await fetch(requestUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Erreur serveur.' }));
    throw new Error(payload.error || 'Erreur serveur.');
  }

  return response.json();
}

function money(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

function normalizeText(value: string) {
  return value.trim();
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: typeof Wallet;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-amber-200 bg-white/90 p-5 shadow-[0_20px_60px_rgba(120,53,15,0.08)] backdrop-blur sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-stone-600">{subtitle}</p> : null}
        </div>
        <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
    </section>
  );
}

function App() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const [revenueForm, setRevenueForm] = useState(emptyRevenueForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [creditForm, setCreditForm] = useState(emptyCreditForm);
  const [editingRevenueId, setEditingRevenueId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [editingCreditId, setEditingCreditId] = useState<number | null>(null);

  const loadData = async () => {
    setError('');
    setSyncing(true);
    try {
      const [revenuesData, expensesData, creditsData, summaryData] = await Promise.all([
        apiRequest<Revenue[]>('/api/revenues'),
        apiRequest<Expense[]>('/api/expenses'),
        apiRequest<Credit[]>('/api/credits'),
        apiRequest<Summary>('/api/summary'),
      ]);

      setRevenues(revenuesData);
      setExpenses(expensesData);
      setCredits(creditsData);
      setSummary(summaryData);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Synchronisation impossible.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const weekRange = useMemo(() => {
    if (!summary) return '';
    return `Semaine du ${format(parseISO(summary.weekStart), 'd MMM', {
      locale: fr,
    })} au ${format(parseISO(summary.weekEnd), 'd MMM yyyy', { locale: fr })}`;
  }, [summary]);

  const dailyRows = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    return revenues.filter((item) =>
      isWithinInterval(parseISO(item.entry_date), {
        start,
        end,
      })
    );
  }, [revenues]);

  const handleRevenueSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        entry_date: revenueForm.entry_date,
        amount: Number(revenueForm.amount),
        note: normalizeText(revenueForm.note),
      };

      await apiRequest(
        editingRevenueId ? `/api/revenues/${editingRevenueId}` : '/api/revenues',
        {
          method: editingRevenueId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setRevenueForm(emptyRevenueForm);
      setEditingRevenueId(null);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d enregistrer le revenu.');
    }
  };

  const handleExpenseSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        expense_date: expenseForm.expense_date,
        amount: Number(expenseForm.amount),
        label: normalizeText(expenseForm.label),
        note: normalizeText(expenseForm.note),
      };

      await apiRequest(
        editingExpenseId ? `/api/expenses/${editingExpenseId}` : '/api/expenses',
        {
          method: editingExpenseId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setExpenseForm(emptyExpenseForm);
      setEditingExpenseId(null);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d enregistrer la depense.');
    }
  };

  const handleCreditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError('');
      const payload = {
        customer_name: normalizeText(creditForm.customer_name),
        amount: Number(creditForm.amount),
        credit_date: creditForm.credit_date,
        status: creditForm.status,
        note: normalizeText(creditForm.note),
      };

      await apiRequest(
        editingCreditId ? `/api/credits/${editingCreditId}` : '/api/credits',
        {
          method: editingCreditId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setCreditForm(emptyCreditForm);
      setEditingCreditId(null);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Impossible d enregistrer le credit.');
    }
  };

  const handleDelete = async (path: string) => {
    if (!window.confirm('Confirmer la suppression ?')) return;

    try {
      setError('');
      await apiRequest(path, { method: 'DELETE' });
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Suppression impossible.');
    }
  };

  const statCards = [
    {
      title: 'Revenus semaine',
      value: money(summary?.weeklyRevenue ?? 0),
      icon: Wallet,
      tone: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Dépenses semaine',
      value: money(summary?.weeklyExpenses ?? 0),
      icon: Receipt,
      tone: 'from-rose-500 to-orange-500',
    },
    {
      title: 'Bénéfice semaine',
      value: money(summary?.weeklyProfit ?? 0),
      icon: TrendingUp,
      tone: 'from-amber-500 to-orange-500',
    },
    {
      title: 'Crédits en attente',
      value: money(summary?.pendingCredits ?? 0),
      icon: CreditCard,
      tone: 'from-sky-500 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.35),_transparent_32%),linear-gradient(180deg,_#fffaf0_0%,_#fff4df_45%,_#fde8c8_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[32px] border border-amber-200 bg-[linear-gradient(135deg,_rgba(120,53,15,0.96),_rgba(217,119,6,0.92))] px-5 py-6 text-white shadow-[0_30px_80px_rgba(120,53,15,0.25)] sm:px-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-2 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-amber-100">
                Business caramel
              </p>
              <h1 className="font-['Georgia'] text-3xl font-semibold tracking-tight sm:text-4xl">
                Suivi simple des revenus, dépenses et crédits
              </h1>
              <p className="mt-3 max-w-xl text-sm text-amber-50/90 sm:text-base">
                Une application claire pour noter vos montants chaque jour,
                suivre la semaine de lundi à dimanche et calculer automatiquement le bénéfice.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(({ title, value, icon: Icon, tone }) => (
            <article
              key={title}
              className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(120,53,15,0.08)]"
            >
              <div className={`h-2 bg-gradient-to-r ${tone}`} />
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm text-stone-500">{title}</span>
                  <div className="rounded-2xl bg-stone-100 p-3 text-stone-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-semibold text-stone-900">{value}</p>
                {title === 'Revenus semaine' ? (
                  <p className="mt-2 text-xs text-stone-500">{weekRange}</p>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <SectionCard
            title="Revenus journaliers"
            subtitle="Ajoutez le revenu de chaque journée. Le total hebdomadaire est calculé automatiquement."
            icon={CalendarDays}
          >
            <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" onSubmit={handleRevenueSubmit}>
              <input
                type="date"
                value={revenueForm.entry_date}
                onChange={(event) =>
                  setRevenueForm((current) => ({ ...current, entry_date: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-amber-400"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={revenueForm.amount}
                onChange={(event) =>
                  setRevenueForm((current) => ({ ...current, amount: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Montant"
                required
              />
              <input
                type="text"
                value={revenueForm.note}
                onChange={(event) =>
                  setRevenueForm((current) => ({ ...current, note: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 xl:col-span-2"
                placeholder="Note facultative"
              />
              <div className="sm:col-span-2 xl:col-span-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-amber-700"
                >
                  <Plus className="h-4 w-4" />
                  {editingRevenueId ? 'Mettre a jour' : 'Ajouter le revenu'}
                </button>
                {editingRevenueId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRevenueId(null);
                      setRevenueForm(emptyRevenueForm);
                    }}
                    className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-5 grid gap-3">
              {loading ? (
                <p className="text-sm text-stone-500">Chargement...</p>
              ) : dailyRows.length === 0 ? (
                <p className="rounded-2xl bg-amber-50 px-4 py-6 text-center text-sm text-stone-600">
                  Aucun revenu enregistré cette semaine.
                </p>
              ) : (
                dailyRows
                  .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-3xl border border-amber-100 bg-gradient-to-r from-white to-amber-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-base font-semibold text-stone-900">
                          {money(item.amount)}
                        </p>
                        <p className="text-sm text-stone-500">
                          {format(parseISO(item.entry_date), 'EEEE d MMMM yyyy', { locale: fr })}
                        </p>
                        {item.note ? <p className="mt-1 text-sm text-stone-600">{item.note}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRevenueId(item.id);
                            setRevenueForm({
                              entry_date: item.entry_date,
                              amount: String(item.amount),
                              note: item.note ?? '',
                            });
                          }}
                          className="rounded-2xl border border-stone-200 p-3 text-stone-700 transition hover:bg-stone-50"
                          aria-label="Modifier le revenu"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(`/api/revenues/${item.id}`)}
                          className="rounded-2xl border border-red-200 p-3 text-red-600 transition hover:bg-red-50"
                          aria-label="Supprimer le revenu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Bilan rapide"
            subtitle="Vue synthese pour la semaine en cours."
            icon={PiggyBank}
          >
            <div className="grid gap-3">
              <div className="rounded-3xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">Jours renseignés</p>
                <p className="mt-1 text-3xl font-semibold text-emerald-900">{summary?.dailyCount ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-orange-50 p-4">
                <p className="text-sm text-orange-700">Total dépenses semaine</p>
                <p className="mt-1 text-3xl font-semibold text-orange-900">
                  {money(summary?.weeklyExpenses ?? 0)}
                </p>
              </div>
              <div className="rounded-3xl bg-sky-50 p-4">
                <p className="text-sm text-sky-700">Total crédits en attente</p>
                <p className="mt-1 text-3xl font-semibold text-sky-900">
                  {money(summary?.pendingCredits ?? 0)}
                </p>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Depenses"
            subtitle="Les dépenses servent au calcul du bénéfice: bénéfice = revenus - dépenses."
            icon={Receipt}
          >
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleExpenseSubmit}>
              <input
                type="date"
                value={expenseForm.expense_date}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, expense_date: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, amount: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Montant"
                required
              />
              <input
                type="text"
                value={expenseForm.label}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, label: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Libelle"
                required
              />
              <input
                type="text"
                value={expenseForm.note}
                onChange={(event) =>
                  setExpenseForm((current) => ({ ...current, note: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Note facultative"
              />
              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  {editingExpenseId ? 'Mettre a jour' : 'Ajouter la depense'}
                </button>
                {editingExpenseId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpenseId(null);
                      setExpenseForm(emptyExpenseForm);
                    }}
                    className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-5 grid gap-3">
              {expenses.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-600">
                  Aucune depense enregistree pour le moment.
                </p>
              ) : (
                expenses.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-stone-200 bg-stone-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-stone-900">{item.label}</p>
                      <p className="text-sm text-stone-500">
                        {format(parseISO(item.expense_date), 'd MMM yyyy', { locale: fr })} • {money(item.amount)}
                      </p>
                      {item.note ? <p className="mt-1 text-sm text-stone-600">{item.note}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingExpenseId(item.id);
                          setExpenseForm({
                            expense_date: item.expense_date,
                            amount: String(item.amount),
                            label: item.label,
                            note: item.note ?? '',
                          });
                        }}
                        className="rounded-2xl border border-stone-200 p-3 text-stone-700 transition hover:bg-white"
                        aria-label="Modifier la depense"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(`/api/expenses/${item.id}`)}
                        className="rounded-2xl border border-red-200 p-3 text-red-600 transition hover:bg-red-50"
                        aria-label="Supprimer la depense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Credits"
            subtitle="Chaque credit peut etre modifie ou supprime a tout moment."
            icon={CreditCard}
          >
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleCreditSubmit}>
              <input
                type="text"
                value={creditForm.customer_name}
                onChange={(event) =>
                  setCreditForm((current) => ({ ...current, customer_name: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Nom du client"
                required
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={creditForm.amount}
                onChange={(event) =>
                  setCreditForm((current) => ({ ...current, amount: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                placeholder="Montant"
                required
              />
              <input
                type="date"
                value={creditForm.credit_date}
                onChange={(event) =>
                  setCreditForm((current) => ({ ...current, credit_date: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
                required
              />
              <select
                value={creditForm.status}
                onChange={(event) =>
                  setCreditForm((current) => ({
                    ...current,
                    status: event.target.value as 'pending' | 'paid',
                  }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400"
              >
                <option value="pending">En attente</option>
                <option value="paid">Paye</option>
              </select>
              <input
                type="text"
                value={creditForm.note}
                onChange={(event) =>
                  setCreditForm((current) => ({ ...current, note: event.target.value }))
                }
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm outline-none transition focus:border-amber-400 sm:col-span-2"
                placeholder="Note facultative"
              />
              <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
                >
                  {editingCreditId ? 'Mettre a jour' : 'Ajouter le credit'}
                </button>
                {editingCreditId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCreditId(null);
                      setCreditForm(emptyCreditForm);
                    }}
                    className="rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-5 grid gap-3">
              {credits.length === 0 ? (
                <p className="rounded-2xl bg-sky-50 px-4 py-6 text-center text-sm text-stone-600">
                  Aucun credit enregistre pour le moment.
                </p>
              ) : (
                credits.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-sky-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-stone-900">{item.customer_name}</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.status === 'paid' ? 'Paye' : 'En attente'}
                        </span>
                      </div>
                      <p className="text-sm text-stone-500">
                        {format(parseISO(item.credit_date), 'd MMM yyyy', { locale: fr })} • {money(item.amount)}
                      </p>
                      {item.note ? <p className="mt-1 text-sm text-stone-600">{item.note}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCreditId(item.id);
                          setCreditForm({
                            customer_name: item.customer_name,
                            amount: String(item.amount),
                            credit_date: item.credit_date,
                            status: item.status,
                            note: item.note ?? '',
                          });
                        }}
                        className="rounded-2xl border border-stone-200 p-3 text-stone-700 transition hover:bg-white"
                        aria-label="Modifier le credit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(`/api/credits/${item.id}`)}
                        className="rounded-2xl border border-red-200 p-3 text-red-600 transition hover:bg-red-50"
                        aria-label="Supprimer le credit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </section>
      </div>
    </div>
  );
}

export default App;
