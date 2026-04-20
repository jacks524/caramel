import { useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export function Reports({ productions, credits }) {
  const [period, setPeriod] = useState('week');
  const today = new Date();

  const getDateRange = () => {
    if (period === 'week') {
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(today),
        end: endOfMonth(today),
      };
    }
  };

  const { start, end } = getDateRange();

  // Toutes les ventes de toutes les productions dans la période
  const allSales = productions.flatMap((prod) => prod.sales);
  const filteredSales = allSales.filter((sale) =>
    isWithinInterval(new Date(sale.date), { start, end })
  );

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);

  // Bénéfices seulement des productions terminées dans la période
  const completedProductions = productions.filter(
    (p) => p.completed && isWithinInterval(new Date(p.startDate), { start, end })
  );
  const totalCosts = completedProductions.reduce((sum, prod) => sum + prod.productionCost, 0);
  const totalProfitFromCompleted = completedProductions.reduce((sum, prod) => {
    const prodSales = prod.sales.reduce((s, sale) => s + sale.amount, 0);
    return sum + (prodSales - prod.productionCost);
  }, 0);

  // Données pour le graphique journalier
  const getDailyData = () => {
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const daySales = allSales.filter((sale) =>
        isWithinInterval(new Date(sale.date), {
          start: day,
          end: day,
        })
      );
      const revenue = daySales.reduce((sum, sale) => sum + sale.amount, 0);
      return {
        date: format(day, 'dd/MM', { locale: fr }),
        revenus: revenue,
      };
    });
  };

  // Données pour le graphique hebdomadaire
  const getWeeklyData = () => {
    const weeks = eachWeekOfInterval(
      { start: startOfMonth(today), end: endOfMonth(today) },
      { weekStartsOn: 1 }
    );
    return weeks.map((weekStart, idx) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekSales = allSales.filter((sale) =>
        isWithinInterval(new Date(sale.date), {
          start: weekStart,
          end: weekEnd,
        })
      );
      const revenue = weekSales.reduce((sum, sale) => sum + sale.amount, 0);
      return {
        date: `S${idx + 1}`,
        revenus: revenue,
      };
    });
  };

  const chartData = period === 'week' ? getDailyData() : getWeeklyData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-amber-900">Rapports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'week'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            Cette Semaine
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'month'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            Ce Mois
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-900">
            {format(start, "d MMM", { locale: fr })} - {format(end, "d MMM yyyy", { locale: fr })}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">Revenus Totaux</p>
            <p className="text-2xl font-bold text-green-800">
              {totalRevenue.toLocaleString()} FCFA
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Productions Terminées</p>
            <p className="text-2xl font-bold text-blue-800">
              {completedProductions.length}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">Bénéfices Totaux</p>
            <p className="text-2xl font-bold text-purple-800">
              {totalProfitFromCompleted.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-purple-600 mt-1">
              (prod. terminées uniquement)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-amber-900">
            Évolution des Revenus {period === 'week' ? 'Journalière' : 'Hebdomadaire'}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()} FCFA`}
            />
            <Legend />
            <Bar dataKey="revenus" fill="#10b981" name="Revenus" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-4">
          Tendance des Revenus
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()} FCFA`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenus"
              stroke="#10b981"
              strokeWidth={3}
              name="Revenus"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
