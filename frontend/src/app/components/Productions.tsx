import { useState } from 'react';
import { Plus, Trash2, Calendar, DollarSign, TrendingUp, Package, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Productions({ productions, setProductions }) {
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [productionForm, setProductionForm] = useState({
    name: '',
    productionCost: '',
    startDate: new Date().toISOString().split('T')[0],
  });
  const [saleForm, setSaleForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleCreateProduction = (e) => {
    e.preventDefault();
    const newProduction = {
      id: Date.now(),
      name: productionForm.name,
      productionCost: parseFloat(productionForm.productionCost),
      startDate: new Date(productionForm.startDate).toISOString(),
      sales: [],
      completed: false,
    };
    setProductions([...productions, newProduction]);
    setProductionForm({ name: '', productionCost: '', startDate: new Date().toISOString().split('T')[0] });
    setShowProductionForm(false);
  };

  const handleAddSale = (e) => {
    e.preventDefault();
    const updatedProductions = productions.map((prod) => {
      if (prod.id === selectedProduction.id) {
        return {
          ...prod,
          sales: [
            ...prod.sales,
            {
              id: Date.now(),
              amount: parseFloat(saleForm.amount),
              description: saleForm.description,
              date: new Date(saleForm.date).toISOString(),
            },
          ],
        };
      }
      return prod;
    });
    setProductions(updatedProductions);
    setSaleForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    setShowSaleForm(false);
    setSelectedProduction(updatedProductions.find((p) => p.id === selectedProduction.id));
  };

  const handleDeleteSale = (productionId, saleId) => {
    if (confirm('Supprimer cette vente ?')) {
      const updatedProductions = productions.map((prod) => {
        if (prod.id === productionId) {
          return {
            ...prod,
            sales: prod.sales.filter((s) => s.id !== saleId),
          };
        }
        return prod;
      });
      setProductions(updatedProductions);
      if (selectedProduction) {
        setSelectedProduction(updatedProductions.find((p) => p.id === productionId));
      }
    }
  };

  const handleToggleCompleted = (productionId) => {
    const updatedProductions = productions.map((prod) => {
      if (prod.id === productionId) {
        return { ...prod, completed: !prod.completed };
      }
      return prod;
    });
    setProductions(updatedProductions);
    if (selectedProduction && selectedProduction.id === productionId) {
      setSelectedProduction(updatedProductions.find((p) => p.id === productionId));
    }
  };

  const handleDeleteProduction = (id) => {
    if (confirm('Supprimer cette production et toutes ses ventes ?')) {
      setProductions(productions.filter((p) => p.id !== id));
      if (selectedProduction && selectedProduction.id === id) {
        setSelectedProduction(null);
      }
    }
  };

  const activeProductions = productions.filter((p) => !p.completed);
  const completedProductions = productions.filter((p) => p.completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-amber-900">Productions & Ventes</h2>
        <button
          onClick={() => setShowProductionForm(!showProductionForm)}
          className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Production
        </button>
      </div>

      {showProductionForm && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-4">
            Démarrer une nouvelle production
          </h3>
          <form onSubmit={handleCreateProduction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Nom du lot *
              </label>
              <input
                type="text"
                required
                value={productionForm.name}
                onChange={(e) => setProductionForm({ ...productionForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Lot du 19 Avril"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Coût de production total (FCFA) *
              </label>
              <input
                type="number"
                required
                value={productionForm.productionCost}
                onChange={(e) => setProductionForm({ ...productionForm, productionCost: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="20000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                Date de démarrage
              </label>
              <input
                type="date"
                required
                value={productionForm.startDate}
                onChange={(e) => setProductionForm({ ...productionForm, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setShowProductionForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Productions en cours */}
      <div className="bg-white rounded-lg shadow-sm border border-amber-200">
        <div className="p-4 border-b border-amber-200 bg-blue-50">
          <h3 className="font-semibold text-amber-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Productions en cours ({activeProductions.length})
          </h3>
        </div>
        <div className="divide-y divide-amber-100">
          {activeProductions.length === 0 ? (
            <p className="text-center py-8 text-amber-600">
              Aucune production en cours
            </p>
          ) : (
            activeProductions
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map((production) => {
                const totalSales = production.sales.reduce((sum, s) => sum + s.amount, 0);
                const isExpanded = selectedProduction?.id === production.id;

                return (
                  <div key={production.id} className="p-4">
                    <div
                      onClick={() => setSelectedProduction(isExpanded ? null : production)}
                      className="cursor-pointer hover:bg-amber-50 -m-4 p-4 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-amber-900 text-lg">
                            {production.name}
                          </h4>
                          <p className="text-sm text-amber-600 flex items-center gap-1 mt-1">
                            <Calendar className="w-4 h-4" />
                            Démarré le {format(new Date(production.startDate), "d MMM yyyy", { locale: fr })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-red-700">Coût production</p>
                          <p className="font-bold text-red-800">
                            {production.productionCost.toLocaleString()} FCFA
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-green-700">Ventes totales</p>
                          <p className="font-bold text-green-800">
                            {totalSales.toLocaleString()} FCFA
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <p className="text-sm text-amber-600">
                          {production.sales.length} vente(s) • Cliquez pour détails
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-amber-200">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-amber-900">Ventes du lot</h5>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSaleForm(true);
                            }}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Vente
                          </button>
                        </div>

                        {showSaleForm && (
                          <form onSubmit={handleAddSale} className="bg-amber-50 p-4 rounded-lg mb-4">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-amber-900 mb-1">
                                  Montant (FCFA) *
                                </label>
                                <input
                                  type="number"
                                  required
                                  value={saleForm.amount}
                                  onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })}
                                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-amber-900 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={saleForm.description}
                                  onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })}
                                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-amber-900 mb-1">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  required
                                  value={saleForm.date}
                                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                >
                                  Ajouter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowSaleForm(false)}
                                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {production.sales.length === 0 ? (
                            <p className="text-center py-4 text-amber-600 text-sm">
                              Aucune vente enregistrée
                            </p>
                          ) : (
                            production.sales
                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                              .map((sale) => (
                                <div
                                  key={sale.id}
                                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                                >
                                  <div>
                                    <p className="font-medium text-amber-900 text-sm">
                                      {sale.description || 'Vente'}
                                    </p>
                                    <p className="text-xs text-amber-600">
                                      {format(new Date(sale.date), "d MMM yyyy", { locale: fr })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-green-700">
                                      {sale.amount.toLocaleString()} FCFA
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSale(production.id, sale.id);
                                      }}
                                      className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-amber-200 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCompleted(production.id);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Marquer comme terminé
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduction(production.id);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Productions terminées */}
      {completedProductions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-amber-200">
          <div className="p-4 border-b border-amber-200 bg-purple-50">
            <h3 className="font-semibold text-amber-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              Productions terminées ({completedProductions.length})
            </h3>
          </div>
          <div className="divide-y divide-amber-100">
            {completedProductions
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map((production) => {
                const totalSales = production.sales.reduce((sum, s) => sum + s.amount, 0);
                const profit = totalSales - production.productionCost;

                return (
                  <div key={production.id} className="p-4 bg-purple-50/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-amber-900">
                          {production.name}
                        </h4>
                        <p className="text-sm text-amber-600">
                          {format(new Date(production.startDate), "d MMM yyyy", { locale: fr })} • {production.sales.length} vente(s)
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteProduction(production.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-red-100 p-2 rounded">
                        <p className="text-xs text-red-700">Coût</p>
                        <p className="font-bold text-red-800 text-sm">
                          {production.productionCost.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-100 p-2 rounded">
                        <p className="text-xs text-green-700">Ventes</p>
                        <p className="font-bold text-green-800 text-sm">
                          {totalSales.toLocaleString()}
                        </p>
                      </div>
                      <div className={`p-2 rounded ${profit >= 0 ? 'bg-purple-100' : 'bg-orange-100'}`}>
                        <p className={`text-xs ${profit >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>
                          Bénéfice
                        </p>
                        <p className={`font-bold text-sm ${profit >= 0 ? 'text-purple-800' : 'text-orange-800'}`}>
                          {profit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
