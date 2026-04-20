import { useState } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Sales({ sales, setSales }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    cost: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newSale = {
      id: Date.now(),
      amount: parseFloat(formData.amount),
      cost: parseFloat(formData.cost) || 0,
      description: formData.description,
      date: new Date(formData.date).toISOString(),
    };
    setSales([...sales, newSale]);
    setFormData({ amount: '', cost: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirm('Voulez-vous vraiment supprimer cette vente ?')) {
      setSales(sales.filter((sale) => sale.id !== id));
    }
  };

  const sortedSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-amber-900">Ventes</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Vente
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-4">
            Ajouter une vente
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Montant de vente (FCFA) *
              </label>
              <input
                type="number"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Coût de production (FCFA)
              </label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="2000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Vente de caramel..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-amber-200">
        <div className="p-4 border-b border-amber-200">
          <h3 className="font-semibold text-amber-900">
            Historique des ventes ({sales.length})
          </h3>
        </div>
        <div className="divide-y divide-amber-100">
          {sortedSales.length === 0 ? (
            <p className="text-center py-8 text-amber-600">
              Aucune vente enregistrée
            </p>
          ) : (
            sortedSales.map((sale) => {
              const profit = sale.amount - (sale.cost || 0);
              return (
                <div key={sale.id} className="p-4 hover:bg-amber-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span className="text-sm text-amber-600">
                          {format(new Date(sale.date), "d MMM yyyy 'à' HH:mm", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-amber-900">
                        {sale.description || 'Vente'}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-green-700">
                          Vente: {sale.amount.toLocaleString()} FCFA
                        </span>
                        {sale.cost > 0 && (
                          <>
                            <span className="text-red-700">
                              Coût: {sale.cost.toLocaleString()} FCFA
                            </span>
                            <span className="font-semibold text-purple-700">
                              Bénéfice: {profit.toLocaleString()} FCFA
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(sale.id)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
