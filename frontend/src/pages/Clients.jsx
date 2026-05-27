import { useState, useEffect, useRef } from 'react'
import api from '../api'

const emptyForm = { name: '', email: '', phone: '', company: '', address: '', notes: '' }

function Avatar({ name }) {
  const colors = ['#4f6ef7','#e8594a','#2ecc9a','#f5a623','#9b59b6','#1abc9c']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div style={{ background: color }} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function ClientDrawer({ client, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(client ? { ...client } : { ...emptyForm })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isEdit = !!client?.id

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Client name is required'); return }
    setLoading(true); setError('')
    try {
      if (isEdit) {
        const res = await api.patch(`/clients/${client.id}`, form)
        onSave(res.data, 'updated')
      } else {
        const res = await api.post('/clients/', form)
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
      await api.delete(`/clients/${client.id}`)
      onDelete(client.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not delete')
      setLoading(false)
    }
  }

  const f = (label, key, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-xs text-gray-500 mb-1.5 font-medium">{label}</label>
      <input
        type={type}
        value={form[key] || ''}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50 focus:bg-white transition-colors"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{isEdit ? 'Edit client' : 'New client'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{isEdit ? `Editing ${client.name}` : 'Add a new client to your list'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
            <p className="text-xs font-medium text-indigo-700 mb-3 uppercase tracking-wide">Contact details</p>
            <div className="space-y-3">
              {f('Full name *', 'name', 'text', 'John Doe')}
              {f('Email address', 'email', 'email', 'john@example.com')}
              {f('Phone number', 'phone', 'tel', '+1 234 567 8900')}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Business info</p>
            <div className="space-y-3">
              {f('Company / Organisation', 'company', 'text', 'Acme Corp')}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium">Address</label>
                <textarea
                  value={form.address || ''}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="123 Main St, City, Country"
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes about this client..."
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 space-y-2">
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add client'}
            </button>
          </div>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-500 hover:bg-red-50 border border-red-200'}`}
            >
              {confirmDelete ? 'Click again to confirm delete' : 'Delete client'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [drawer, setDrawer] = useState(null) // null | 'new' | client object
  const [toast, setToast] = useState('')
  const searchRef = useRef()

  const fetchClients = async (q = '') => {
    try {
      const res = await api.get('/clients/', { params: q ? { search: q } : {} })
      setClients(res.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchClients() }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchClients(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSave = (client, action) => {
    if (action === 'created') {
      setClients(prev => [client, ...prev])
      showToast(`${client.name} added successfully`)
    } else {
      setClients(prev => prev.map(c => c.id === client.id ? client : c))
      showToast(`${client.name} updated`)
    }
    setDrawer(null)
  }

  const handleDelete = (id) => {
    setClients(prev => prev.filter(c => c.id !== id))
    setDrawer(null)
    showToast('Client deleted')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 focus:bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="ti ti-x text-xs" />
              </button>
            )}
          </div>
          <span className="text-xs text-gray-400">{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <i className="ti ti-plus" /> Add client
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <i className="ti ti-users text-3xl text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">
              {search ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              {search ? `No results for "${search}"` : 'Add your first client to get started'}
            </p>
            {!search && (
              <button onClick={() => setDrawer('new')} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800">
                Add first client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Client</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Contact</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Company</th>
                  <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Added</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {clients.map(client => (
                  <tr key={client.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={client.name} />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          {client.address && <div className="text-xs text-gray-400 truncate max-w-xs">{client.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="space-y-0.5">
                        {client.email && <div className="text-sm text-gray-600 flex items-center gap-1.5"><i className="ti ti-mail text-gray-400 text-xs" />{client.email}</div>}
                        {client.phone && <div className="text-sm text-gray-600 flex items-center gap-1.5"><i className="ti ti-phone text-gray-400 text-xs" />{client.phone}</div>}
                        {!client.email && !client.phone && <span className="text-xs text-gray-400">No contact info</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {client.company
                        ? <span className="inline-flex items-center gap-1 text-sm text-gray-700"><i className="ti ti-building text-gray-400 text-xs" />{client.company}</span>
                        : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {new Date(client.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDrawer(client)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <i className="ti ti-pencil text-xs" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawer !== null && (
        <ClientDrawer
          client={drawer === 'new' ? null : drawer}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 z-50">
          <i className="ti ti-circle-check text-green-400" /> {toast}
        </div>
      )}
    </div>
  )
}
