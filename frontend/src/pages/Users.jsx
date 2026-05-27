import { useState, useEffect } from 'react'
import api from '../api'

export default function Users() {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchUsers = () => api.get('/users/').then(r => setUsers(r.data))

  useEffect(() => { fetchUsers() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/users/', form)
      setSuccess(`${form.name} has been added.`)
      setShowModal(false)
      setForm({ name: '', email: '', password: '', role: 'staff' })
      fetchUsers()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage who has access to SupplyDesk.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError('') }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <i className="ti ti-plus text-base" /> Add user
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Name</th>
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Email</th>
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Role</th>
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Status</th>
              <th className="text-left text-xs text-gray-400 uppercase tracking-wide font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3.5 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.is_active ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {u.is_system ? (
                    <span className="text-xs text-gray-400">System user</span>
                  ) : (
                    <button
                      onClick={() => toggleActive(u)}
                      className="text-xs text-indigo-500 hover:underline"
                    >
                      {u.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Add new user</h3>
              <button onClick={() => setShowModal(false)}>
                <i className="ti ti-x text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5">
              {[
                { label: 'Full name', key: 'name', type: 'text', placeholder: 'Jane Smith' },
                { label: 'Email address', key: 'email', type: 'email', placeholder: 'jane@example.com' },
                { label: 'Temporary password', key: 'password', type: 'password', placeholder: 'Min. 8 characters' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    required
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {loading ? 'Creating...' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
