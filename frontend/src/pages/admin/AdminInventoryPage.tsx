import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Search, AlertTriangle, Package, DollarSign } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const addStock = async (id: string) => {
    const amount = window.prompt("Enter quantity to add to stock:");
    if (!amount || isNaN(Number(amount))) return;

    try {
      await api.post(`/inventory/${id}/add-stock`, { amount: Number(amount) });
      fetchInventory();
    } catch (error) {
      console.error('Failed to add stock', error);
      alert('Failed to update stock');
    }
  };

  const handleAddPart = async () => {
    const sku = window.prompt("Enter SKU (e.g. CABLE-01):");
    if (!sku) return;
    const name = window.prompt("Enter Part Name:");
    if (!name) return;
    const qty = window.prompt("Enter Initial Quantity:");
    
    try {
      await api.post('/inventory', {
        sku,
        name,
        quantity: Number(qty) || 0,
        minStockLevel: 5
      });
      fetchInventory();
    } catch (error) {
      console.error('Failed to create part', error);
      alert('Failed to create part');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spare Parts Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage maintenance inventory and monitor stock levels</p>
        </div>
        <button onClick={handleAddPart} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Part
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search parts by SKU or Name..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">SKU</th>
                <th className="px-6 py-3 font-medium">Part Name & Desc</th>
                <th className="px-6 py-3 font-medium">Stock Level</th>
                <th className="px-6 py-3 font-medium">Unit Cost</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading inventory...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No inventory items found.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className={`hover:bg-slate-50 ${item.isLowStock ? 'bg-red-50/30' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.supplier || 'No supplier listed'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <span className={`font-semibold ${item.isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                          {item.quantity} units
                        </span>
                        {item.isLowStock && (
                          <span className="flex items-center gap-1 text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Low Stock (Min: {item.minStockLevel})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        {item.cost ? item.cost.toFixed(2) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => addStock(item.id)}
                        className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                      >
                        + Add Stock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
