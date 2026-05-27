import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const emptyForm = { name: '', description: '', unit: '', cost_price: '', sell_price: '' }

const UNITS = ['pcs', 'kg', 'g', 'ltr', 'box', 'set', 'hrs', 'days', 'm', 'm²', 'other']

function margin(cost, sell) {
  if (!cost || cost === 0) return null
  return (((sell - cost) / cost) * 100).toFixed(1)
}

function ProductDrawer({ product, onClose, onSave, onDelete, isAdmin }) {
  const [form, setForm] = useState(product ? { ...product, cost_price: product.cost_price ?? '', sell_price: product.sell_price ?? '' } : { ...emptyForm })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = !!product?.id

  const profit = parseFloat(form.sell_price || 0) - parseFloat(form.cost_price || 0)
  const marginPct = margin(parseFloat(form.cost_price), parseFloat(form.sell_price))

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Product name is required'); return }
    if (parseFloat(form.sell_price) < 0 || parseFloat(form.cost_price) < 0) { setError('Prices cannot be negative'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        cost_price: parseFloat(form.cost_price) || 0,
        sell_price: parseFloat(form.sell_price) || 0,
      }
      if (isEdit) {
        const res = await api.patch(`/products/${product.id}`, payload)
        onSave(res.data, 'updated')
      } else {
        const res = await api.post('/products/', payload)
        onSave(res.data, 'created')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setLoading(true)
    try {
      await api.delete(`/products/${product.id}`)
      onDelete(product.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit product' : 'New product'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing ${product.name}` : 'Add to your product catalog'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Basic info */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
            <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Product details</p>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Product / Service name *</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Power Drill, Delivery Fee, Installation"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 focus:bg-white"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Description</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this product or service..."
                rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none bg-gray-50 focus:bg-white"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Unit</label>
              <select
                value={form.unit || ''}
                onChange={e => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
                disabled={!isAdmin}
              >
                <option value="">Select unit...</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Cost price (what you pay)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={e => setForm({ ...form, cost_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Sell price (what you charge)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sell_price}
                    onChange={e => setForm({ ...form, sell_price: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            </div>

            {/* Live margin preview */}
            {(form.cost_price || form.sell_price) && (
              <div className={`rounded-lg px-4 py-3 flex items-center justify-between ${profit >= 0 ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                <div>
                  <p className="text-xs text-gray-500">Profit per unit</p>
                  <p className={`text-base font-semibold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    ${profit.toFixed(2)}
                  </p>
                </div>
                {marginPct !== null && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Margin</p>
                    <p className={`text-base font-semibold ${parseFloat(marginPct) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {marginPct}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-2">
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
              </button>
            </div>
            {isEdit && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-500 hover:bg-red-50 border border-red-200'}`}
              >
                {confirmDelete ? 'Click again to confirm delete' : 'Delete product'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all') // all | active | inactive

  const fetchProducts = async (q = '') => {
    try {
      const res = await api.get('/products/', { params: q ? { search: q } : {} })
      setProducts(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = (product, action) => {
    if (action === 'created') {
      setProducts(prev => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)))
      showToast(`${product.name} added`)
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p))
      showToast(`${product.name} updated`)
    }
    setDrawer(null)
  }

  const handleDelete = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id))
    setDrawer(null)
    showToast('Product deleted')
  }

  const filtered = products.filter(p => {
    if (filter === 'active') return p.is_active
    if (filter === 'inactive') return !p.is_active
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 focus:bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className="ti ti-x text-xs" />
              </button>
            )}
          </div>
          <div className="flex gap-1">
            {['all', 'active', 'inactive'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setDrawer('new')}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            <i className="ti ti-plus" /> Add product
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <i className="ti ti-package text-3xl text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {search ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {search ? `No results for "${search}"` : 'Add products and services to use on invoices'}
            </p>
            {!search && isAdmin && (
              <button onClick={() => setDrawer('new')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
                Add first product
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Product</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Unit</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Cost price</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Sell price</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Margin</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const m = margin(p.cost_price, p.sell_price)
                  const profit = p.sell_price - p.cost_price
                  return (
                    <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i className="ti ti-package text-indigo-500 text-sm" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{p.name}</div>
                            {p.description && <div className="text-xs text-gray-400 truncate max-w-xs">{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.unit
                          ? <span className="inline-flex px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-mono">{p.unit}</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">${p.cost_price.toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">${p.sell_price.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        {m !== null ? (
                          <div>
                            <span className={`text-xs font-medium ${parseFloat(m) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {parseFloat(m) >= 0 ? '+' : ''}{m}%
                            </span>
                            <span className={`text-xs ml-1 ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              (${profit.toFixed(2)})
                            </span>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => setDrawer(p)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                        >
                          <i className="ti ti-pencil text-xs" /> {isAdmin ? 'Edit' : 'View'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {drawer !== null && (
        <ProductDrawer
          product={drawer === 'new' ? null : drawer}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          onDelete={handleDelete}
          isAdmin={isAdmin}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50">
          <i className="ti ti-circle-check text-green-400" /> {toast}
        </div>
      )}
    </div>
  )
}
