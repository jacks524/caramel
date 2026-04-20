import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Credits({ credits, setCredits }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCredit = {
      id: Date.now(),
      customerName: formData.customerName,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      paid: false,
    };
    setCredits([...credits, newCredit]);
    setFormData({ customerName: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const handleTogglePaid = (id) => {
    setCredits(
      credits.map((credit) =>
        credit.id === id ? { ...credit, paid: !credit.paid } : credit
      )
    );
  };

  const handleDelete = (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce crédit ?')) {
      setCredits(credits.filter((credit) => credit.id !== id));
    }
  };

  const unpaidCredits = credits.filter((c) => !c.paid);
  const paidCredits = credits.filter((c) => c.paid);
  const totalUnpaid = unpaidCredits.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-amber-900">Crédits Clients</h2>
          <p className="text-sm text-amber-600 mt-1">
            Total impayé: <span className="font-bold">{totalUnpaid.toLocaleString()} FCFA</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouveau Crédit
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-4">
            Ajouter un crédit
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Montant (FCFA) *
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

      {/* Crédits impayés */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200">
        <div className="p-4 border-b border-amber-200 bg-orange-50">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Crédits Impayés ({unpaidCredits.length})
          </h3>
        </div>
        <div className="divide-y divide-amber-100">
          {unpaidCredits.length === 0 ? (
            <p className="text-center py-8 text-amber-600">
              Aucun crédit impayé
            </p>
          ) : (
            unpaidCredits
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((credit) => (
                <div key={credit.id} className="p-4 hover:bg-amber-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-900">
                          {credit.customerName}
                        </span>
                      </div>
                      <p className="text-sm text-amber-600 mb-3">
                        {format(new Date(credit.date), "d MMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-lg font-bold text-orange-700">
                        {credit.amount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePaid(credit.id)}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg transition-colors"
                        title="Marquer comme payé"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(credit.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Crédits payés */}
      {paidCredits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200">
          <div className="p-4 border-b border-amber-200 bg-green-50">
            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Crédits Payés ({paidCredits.length})
            </h3>
          </div>
          <div className="divide-y divide-amber-100">
            {paidCredits
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((credit) => (
                <div key={credit.id} className="p-4 hover:bg-amber-50 transition-colors opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-900">
                          {credit.customerName}
                        </span>
                      </div>
                      <p className="text-sm text-amber-600 mb-3">
                        {format(new Date(credit.date), "d MMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-lg font-bold text-green-700 line-through">
                        {credit.amount.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePaid(credit.id)}
                        className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-colors"
                        title="Marquer comme impayé"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(credit.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
