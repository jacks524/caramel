import { useState } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, Plus, Edit2, Check, X, Package } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Dashboard({ productions, credits, dailyRevenues, setDailyRevenues }) {
  const [showRevenueForm, setShowRevenueForm] = useState(false);
  const [revenueAmount, setRevenueAmount] = useState('');
  const [editingRevenue, setEditingRevenue] = useState(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayDateStr = format(today, 'yyyy-MM-dd');
  const todayRevenueEntry = dailyRevenues.find((r) => r.date === todayDateStr);

  // Revenus du jour (toutes les ventes de toutes les productions)
  const todaySales = productions.flatMap((prod) =>
    prod.sales.filter((sale) =>
      isWithinInterval(new Date(sale.date), {
        start: startOfDay(today),
        end: endOfDay(today),
      })
    )
  );
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.amount, 0);

  // Revenus de la semaine
  const weekSales = productions.flatMap((prod) =>
    prod.sales.filter((sale) =>
      isWithinInterval(new Date(sale.date), { start: weekStart, end: weekEnd })
    )
  );
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.amount, 0);

  // Bénéfices de la semaine (seulement des productions terminées)
  const completedProductions = productions.filter((p) => p.completed);
  const weekCompletedProductions = completedProductions.filter((prod) =>
    isWithinInterval(new Date(prod.startDate), { start: weekStart, end: weekEnd })
  );
  const weekProfit = weekCompletedProductions.reduce((sum, prod) => {
    const totalSales = prod.sales.reduce((s, sale) => s + sale.amount, 0);
    return sum + (totalSales - prod.productionCost);
  }, 0);

  // Productions en cours
  const activeProductions = productions.filter((p) => !p.completed).length;

  // Crédits en cours
  const totalCredits = credits
    .filter((credit) => !credit.paid)
    .reduce((sum, credit) => sum + credit.amount, 0);

  const handleSaveRevenue = () => {
    if (!revenueAmount || parseFloat(revenueAmount) <= 0) return;

    const existingIndex = dailyRevenues.findIndex((r) => r.date === todayDateStr);
    if (existingIndex >= 0) {
      const updated = [...dailyRevenues];
      updated[existingIndex] = {
        date: todayDateStr,
        amount: parseFloat(revenueAmount),
      };
      setDailyRevenues(updated);
    } else {
      setDailyRevenues([
        ...dailyRevenues,
        { date: todayDateStr, amount: parseFloat(revenueAmount) },
      ]);
    }
    setRevenueAmount('');
    setShowRevenueForm(false);
    setEditingRevenue(null);
  };

  const handleEditRevenue = () => {
    if (todayRevenueEntry) {
      setRevenueAmount(todayRevenueEntry.amount.toString());
      setEditingRevenue(todayDateStr);
      setShowRevenueForm(true);
    }
  };

  const stats = [
    {
      title: "Revenus Aujourd'hui",
      value: `${todayRevenue.toLocaleString()} FCFA`,
      icon: DollarSign,
      color: 'bg-green-100 text-green-700',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Revenus Semaine',
      value: `${weekRevenue.toLocaleString()} FCFA`,
      icon: Calendar,
      color: 'bg-blue-100 text-blue-700',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Bénéfices Semaine',
      value: `${weekProfit.toLocaleString()} FCFA`,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-700',
      iconBg: 'bg-purple-500',
      subtitle: `(${weekCompletedProductions.length} prod. terminée(s))`,
    },
    {
      title: 'Crédits en Cours',
      value: `${totalCredits.toLocaleString()} FCFA`,
      icon: Users,
      color: 'bg-orange-100 text-orange-700',
      iconBg: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-amber-900 mb-2">
          Bienvenue ! 👋
        </h2>
        <p className="text-amber-700">
          Semaine du {format(weekStart, 'd MMM', { locale: fr })} au{' '}
          {format(weekEnd, 'd MMM yyyy', { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className={`${stat.color} rounded-lg p-6 shadow-sm border border-amber-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.iconBg} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium mb-1 opacity-80">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs mt-1 opacity-70">{stat.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Productions en cours */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Productions en cours
          </h3>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
            {activeProductions}
          </span>
        </div>
        {activeProductions === 0 ? (
          <p className="text-amber-600 text-center py-6">
            Aucune production en cours
          </p>
        ) : (
          <div className="space-y-3">
            {productions
              .filter((p) => !p.completed)
              .slice(0, 3)
              .map((prod) => {
                const totalSales = prod.sales.reduce((sum, s) => sum + s.amount, 0);
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-amber-900">{prod.name}</p>
                      <p className="text-sm text-amber-600">
                        {prod.sales.length} vente(s) • {totalSales.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600">Coût</p>
                      <p className="font-semibold text-red-700">
                        {prod.productionCost.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Revenus journaliers */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-900">
            📝 Revenus Journaliers
          </h3>
          {!showRevenueForm && !todayRevenueEntry && (
            <button
              onClick={() => setShowRevenueForm(true)}
              className="flex items-center gap-2 bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Noter
            </button>
          )}
          {!showRevenueForm && todayRevenueEntry && (
            <button
              onClick={handleEditRevenue}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Modifier
            </button>
          )}
        </div>

        {showRevenueForm ? (
          <div className="bg-amber-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-amber-900 mb-2">
              Revenus du {format(today, "d MMMM yyyy", { locale: fr })}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                className="flex-1 px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Montant en FCFA"
                autoFocus
              />
              <button
                onClick={handleSaveRevenue}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setShowRevenueForm(false);
                  setRevenueAmount('');
                  setEditingRevenue(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : todayRevenueEntry ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">
              Revenus notés pour aujourd'hui
            </p>
            <p className="text-3xl font-bold text-green-800">
              {todayRevenueEntry.amount.toLocaleString()} FCFA
            </p>
          </div>
        ) : (
          <p className="text-amber-600 text-center py-6">
            Aucun revenu noté pour aujourd'hui
          </p>
        )}

        {dailyRevenues.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-amber-900 mb-3">
              Historique (7 derniers jours)
            </h4>
            <div className="space-y-2">
              {dailyRevenues
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 7)
                .map((revenue, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-amber-50 rounded-lg"
                  >
                    <span className="text-sm text-amber-700">
                      {format(new Date(revenue.date), "EEEE d MMM", { locale: fr })}
                    </span>
                    <span className="font-semibold text-amber-900">
                      {revenue.amount.toLocaleString()} FCFA
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">
          Activité Récente
        </h3>
        {todaySales.length === 0 ? (
          <p className="text-amber-600 text-center py-8">
            Aucune vente aujourd'hui
          </p>
        ) : (
          <div className="space-y-3">
            {todaySales.slice(-5).reverse().map((sale, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-amber-900">
                    {sale.description || 'Vente'}
                  </p>
                  <p className="text-sm text-amber-600">
                    {format(new Date(sale.date), "HH:mm", { locale: fr })}
                  </p>
                </div>
                <p className="font-bold text-green-700">
                  +{sale.amount.toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
