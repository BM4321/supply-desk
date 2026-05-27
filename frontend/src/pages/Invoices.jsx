import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const STATUS_STYLES = {
  draft:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Draft' },
  sent:    { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Sent' },
  paid:    { bg: 'bg-green-50',   text: 'text-green-700',  label: 'Paid' },
  overdue: { bg: 'bg-red-50',     text: 'text-red-700',    label: 'Overdue' },
}

function fmt(n) { return `$${parseFloat(n || 0).toFixed(2)}` }

function calcTotals(items, discount, tax) {
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.unit_price || 0)), 0)
  const discountAmt = subtotal * (parseFloat(discount || 0) / 100)
  const afterDiscount = subtotal - discountAmt
  const taxAmt = afterDiscount * (parseFloat(tax || 0) / 100)
  const total = afterDiscount + taxAmt
  return { subtotal, discountAmt, taxAmt, total }
}

// ── Print / PDF view ──────────────────────────────────────────────────────
function PrintView({ invoice, onClose }) {
  const { subtotal, discountAmt, taxAmt, total } = calcTotals(invoice.items, invoice.discount, invoice.tax)

  const handlePrint = () => window.print()

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      {/* Toolbar - hidden on print */}
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <button onClick={onClose} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <i className="ti ti-arrow-left" /> Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Invoice {invoice.invoice_number}</span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
          >
            <i className="ti ti-printer" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice paper */}
      <div className="max-w-2xl mx-auto my-8 print:my-0 print:max-w-full">
        <div className="bg-white shadow-sm print:shadow-none p-12 print:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SupplyDesk</h1>
              <p className="text-sm text-gray-400 mt-0.5">General Supplies</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-light text-gray-400 uppercase tracking-widest text-xs mb-1">Invoice</div>
              <div className="text-xl font-bold text-gray-900">{invoice.invoice_number}</div>
              <div className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status]?.bg} ${STATUS_STYLES[invoice.status]?.text}`}>
                {STATUS_STYLES[invoice.status]?.label}
              </div>
            </div>
          </div>

          {/* Bill to + dates */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Bill to</p>
              <p className="text-sm font-semibold text-gray-900">{invoice.client?.name}</p>
              {invoice.client?.company && <p className="text-sm text-gray-600">{invoice.client.company}</p>}
              {invoice.client?.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
              {invoice.client?.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
              {invoice.client?.address && <p className="text-sm text-gray-500 mt-1">{invoice.client.address}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Issue date</p>
                  <p className="text-sm text-gray-900">{new Date(invoice.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                {invoice.due_date && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Due date</p>
                    <p className="text-sm text-gray-900 font-medium">{new Date(invoice.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left text-xs font-semibold text-gray-900 uppercase tracking-wide pb-2">Description</th>
                <th className="text-center text-xs font-semibold text-gray-900 uppercase tracking-wide pb-2">Qty</th>
                <th className="text-right text-xs font-semibold text-gray-900 uppercase tracking-wide pb-2">Unit price</th>
                <th className="text-right text-xs font-semibold text-gray-900 uppercase tracking-wide pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-sm text-gray-900">{item.description}</td>
                  <td className="py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="py-3 text-sm text-gray-600 text-right">{fmt(item.unit_price)}</td>
                  <td className="py-3 text-sm font-medium text-gray-900 text-right">{fmt(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{fmt(subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount ({invoice.discount}%)</span>
                  <span className="text-red-600">-{fmt(discountAmt)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({invoice.tax}%)</span>
                  <span className="text-gray-900">{fmt(taxAmt)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-gray-900 pt-2">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Notes</p>
              <p className="text-sm text-gray-600">{invoice.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6">
            <p className="text-xs text-gray-400 text-center">Thank you for your business.</p>
          </div>
        </div>
      </div>

      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: white; } }`}</style>
    </div>
  )
}

// ── Invoice Builder Drawer ────────────────────────────────────────────────
function InvoiceDrawer({ invoice, clients, products, onClose, onSave, onDelete }) {
  const isEdit = !!invoice?.id
  const [form, setForm] = useState({
    client_id: invoice?.client_id || '',
    due_date: invoice?.due_date ? invoice.due_date.slice(0, 10) : '',
    notes: invoice?.notes || '',
    discount: invoice?.discount ?? 0,
    tax: invoice?.tax ?? 0,
    status: invoice?.status || 'draft',
  })
  const [items, setItems] = useState(
    invoice?.items?.length
      ? invoice.items.map(i => ({ ...i, quantity: i.quantity, unit_price: i.unit_price, cost_price: i.cost_price }))
      : [{ description: '', quantity: 1, unit_price: 0, cost_price: 0, product_id: null }]
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { subtotal, discountAmt, taxAmt, total } = calcTotals(items, form.discount, form.tax)

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, cost_price: 0, product_id: null }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i, field, value) => {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }
  const pickProduct = (i, productId) => {
    const p = products.find(p => p.id === parseInt(productId))
    if (!p) return
    const updated = [...items]
    updated[i] = { ...updated[i], product_id: p.id, description: p.name, unit_price: p.sell_price, cost_price: p.cost_price }
    setItems(updated)
  }

  const handleSave = async () => {
    if (!form.client_id) { setError('Please select a client'); return }
    if (items.some(i => !i.description.trim())) { setError('All items must have a description'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form,
        client_id: parseInt(form.client_id),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        discount: parseFloat(form.discount) || 0,
        tax: parseFloat(form.tax) || 0,
        items: items.map(i => ({
          product_id: i.product_id || null,
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unit_price: parseFloat(i.unit_price) || 0,
          cost_price: parseFloat(i.cost_price) || 0,
        }))
      }
      if (isEdit) {
        const res = await api.patch(`/invoices/${invoice.id}`, payload)
        onSave(res.data, 'updated')
      } else {
        const res = await api.post('/invoices/', payload)
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
      await api.delete(`/invoices/${invoice.id}`)
      onDelete(invoice.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? `Edit ${invoice.invoice_number}` : 'New invoice'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? 'Update invoice details' : 'Create a new invoice for a client'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          {/* Client + dates */}
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
            <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Invoice details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Client *</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                >
                  <option value="">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Due date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                />
              </div>
              {isEdit && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5 font-medium">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                  >
                    {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Line items</p>
              <button onClick={addItem} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                <i className="ti ti-plus text-xs" /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      onChange={e => pickProduct(i, e.target.value)}
                      className="flex-1 px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-500"
                      defaultValue=""
                    >
                      <option value="">Pick from catalog...</option>
                      {products.filter(p => p.is_active).map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {fmt(p.sell_price)}</option>
                      ))}
                    </select>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <i className="ti ti-trash text-sm" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <input
                        value={item.description}
                        onChange={e => updateItem(i, 'description', e.target.value)}
                        placeholder="Description *"
                        className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number" min="0.01" step="0.01"
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.cost_price}
                          onChange={e => updateItem(i, 'cost_price', e.target.value)}
                          placeholder="Cost"
                          className="w-full pl-5 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 bg-orange-50 text-orange-700"
                          title="Cost price (internal)"
                        />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.unit_price}
                          onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          placeholder="Price"
                          className="w-full pl-5 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="text-xs font-medium text-gray-700">{fmt(item.quantity * item.unit_price)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1.5 text-xs text-gray-400">
                    <span>Qty</span><span className="flex-1 text-center">Cost (internal)</span><span className="mr-6">Sell price</span><span>Total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount, tax, notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Discount (%)</label>
              <input type="number" min="0" max="100" value={form.discount}
                onChange={e => setForm({ ...form, discount: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">Tax (%)</label>
              <input type="number" min="0" max="100" value={form.tax}
                onChange={e => setForm({ ...form, tax: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Payment instructions, terms, etc."
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>

          {/* Live totals */}
          <div className="bg-gray-900 rounded-xl p-4 text-white space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal</span><span className="text-white">{fmt(subtotal)}</span>
            </div>
            {parseFloat(form.discount) > 0 && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Discount ({form.discount}%)</span><span className="text-red-400">-{fmt(discountAmt)}</span>
              </div>
            )}
            {parseFloat(form.tax) > 0 && (
              <div className="flex justify-between text-sm text-gray-400">
                <span>Tax ({form.tax}%)</span><span className="text-white">{fmt(taxAmt)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-gray-700 pt-2">
              <span>Total</span><span className="text-green-400 text-lg">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-2 flex-shrink-0">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create invoice'}
            </button>
          </div>
          {isEdit && (
            <button onClick={handleDelete} disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${confirmDelete ? 'bg-red-600 text-white' : 'text-red-500 hover:bg-red-50 border border-red-200'}`}>
              {confirmDelete ? 'Click again to confirm delete' : 'Delete invoice'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Invoices Page ────────────────────────────────────────────────────
export default function Invoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(null)
  const [printInvoice, setPrintInvoice] = useState(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    Promise.all([
      api.get('/invoices/'),
      api.get('/clients/'),
      api.get('/products/?active_only=true'),
    ]).then(([inv, cli, pro]) => {
      setInvoices(inv.data)
      setClients(cli.data)
      setProducts(pro.data)
    }).finally(() => setLoading(false))
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSave = (invoice, action) => {
    if (action === 'created') setInvoices(prev => [invoice, ...prev])
    else setInvoices(prev => prev.map(i => i.id === invoice.id ? invoice : i))
    setDrawer(null)
    showToast(action === 'created' ? `${invoice.invoice_number} created` : `${invoice.invoice_number} updated`)
  }

  const handleDelete = (id) => {
    setInvoices(prev => prev.filter(i => i.id !== id))
    setDrawer(null)
    showToast('Invoice deleted')
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)
  const totals = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    sent: invoices.filter(i => i.status === 'sent').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  }

  if (printInvoice) return <PrintView invoice={printInvoice} onClose={() => setPrintInvoice(null)} />

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize flex items-center gap-1.5 ${filter === f ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {f} {totals[f] > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f ? 'bg-white/20' : 'bg-gray-200'}`}>{totals[f]}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors">
          <i className="ti ti-plus" /> New invoice
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <i className="ti ti-file-invoice text-3xl text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">No invoices yet</h3>
            <p className="text-xs text-gray-400 mb-4">Create your first invoice to get started</p>
            <button onClick={() => setDrawer('new')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
              Create invoice
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Invoice</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Client</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Date</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Due</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Total</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const { total } = calcTotals(inv.items, inv.discount, inv.tax)
                  const s = STATUS_STYLES[inv.status] || STATUS_STYLES.draft
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-medium text-gray-900">{inv.invoice_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-gray-900">{inv.client?.name}</div>
                        {inv.client?.company && <div className="text-xs text-gray-400">{inv.client.company}</div>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {new Date(inv.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-900">{fmt(total)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPrintInvoice(inv)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <i className="ti ti-printer text-xs" /> Print
                          </button>
                          <button onClick={() => setDrawer(inv)} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                            <i className="ti ti-pencil text-xs" /> Edit
                          </button>
                        </div>
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
        <InvoiceDrawer
          invoice={drawer === 'new' ? null : drawer}
          clients={clients}
          products={products}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          onDelete={handleDelete}
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
