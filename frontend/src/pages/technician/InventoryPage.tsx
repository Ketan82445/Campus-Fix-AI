import React, { useState, useEffect } from 'react';
import { inventoryApi, InventoryItem } from '../../services/inventoryApi';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', sku: '', quantity: 1, minStockLevel: 5, location: '' });

  const fetchInventory = async () => {
    try {
      const res = await inventoryApi.getAll();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await inventoryApi.create(newItem);
    setShowAdd(false);
    fetchInventory();
  };

  const handleAddStock = async (id: string, qty: number) => {
    await inventoryApi.addStock(id, qty);
    fetchInventory();
  };

  if (isLoading) return <LoadingSpinner message="Loading Inventory..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" /> Spare Parts & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage physical spare parts for campus operations</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 transition">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required type="text" placeholder="Item Name (e.g. HDMI Cable)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="border p-2 rounded" />
            <input required type="text" placeholder="SKU/Code (e.g. CAB-HD-01)" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="border p-2 rounded" />
            <input required type="number" placeholder="Initial Quantity" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="border p-2 rounded" />
            <input type="text" placeholder="Location (e.g. Server Room B)" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} className="border p-2 rounded" />
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded font-semibold text-sm">Save Item</button>
        </form>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.sku}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                  {item.name}
                  {item.quantity <= item.minStockLevel && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </td>
                <td className="px-4 py-3 text-slate-500">{item.location || 'N/A'}</td>
                <td className="px-4 py-3 text-center font-bold">
                  <span className={item.quantity <= item.minStockLevel ? 'text-amber-600' : 'text-emerald-600'}>{item.quantity}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleAddStock(item.id, 5)} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition">+5 Restock</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">No inventory items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
