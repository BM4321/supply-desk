import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtShort = (n) => {
  n = parseFloat(n || 0)
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

const STATUS_STYLES = {
  draft:   { bg: 'bg-gray-100',  text: 'text-gray-600',  dot: 'bg-gray-400' },
  sent:    { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500' },
  paid:    { bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500' },
  overdue: { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500' },
}

// ── Mini bar chart (pure SVG, no library needed) ──────────────────────────
function BarChart({ data, valueKey, color = '#6366f1', label }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  const h = 80
  const barW = 28
  const gap = 8
  const width = data.length * (barW + gap)

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${h + 24}`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const barH = Math.max((d[valueKey] / max) * h, 2)
          const x = i * (barW + gap)
          const y = h - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={color} opacity={i === data.length - 1 ? 1 : 0.5} />
              <text x={x + barW / 2} y={h + 16} textAnchor="middle" fontSize="9" fill="#9ca3af">{d.month}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color = 'indigo', trend }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-500', border: 'border-indigo-100' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-500',  border: 'border-green-100' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-500',  border: 'border-amber-100' },
    red:    { bg: 'bg-red-50',    icon: 'text-red-500',    border: 'border-red-100' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500',   border: 'border-blue-100' },
  }
  const c = colors[color]
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center`}>
          <i className={`ti ${icon} text-lg ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    </div>
  )

  const s = data?.summary || {}
  const monthly = data?.monthly || []
  const topClients = data?.top_clients || []
  const recent = data?.recent_invoices || []
  const statusCounts = data?.status_counts || {}
  const margin = s.total_revenue > 0 ? ((s.total_profit / s.total_revenue) * 100).toFixed(1) : 0

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {/* Welcome */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-gray-400 mt-0.5">Here's your business overview</p>
        </div>
        <button
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
        >
          <i className="ti ti-plus" /> New invoice
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total revenue" value={fmt(s.total_revenue)} sub="All paid invoices" icon="ti-currency-dollar" color="green" />
        <StatCard label="This month" value={fmt(s.month_revenue)} sub="Paid this month" icon="ti-calendar-stats" color="indigo" />
        <StatCard label="Outstanding" value={fmt(s.outstanding_amount)} sub={`${s.outstanding_count} invoice${s.outstanding_count !== 1 ? 's' : ''} unpaid`} icon="ti-clock" color={s.outstanding_amount > 0 ? 'amber' : 'green'} />
        <StatCard label="Net profit" value={fmt(s.total_profit)} sub={`${margin}% margin`} icon="ti-trending-up" color={s.total_profit >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <StatCard label="Total clients" value={s.client_count} sub="In your database" icon="ti-users" color="blue" />
        <StatCard label="Total invoices" value={s.invoice_count} sub="All time" icon="ti-file-invoice" color="indigo" />
        <StatCard label="Total cost" value={fmt(s.total_cost)} sub="What you spent sourcing" icon="ti-shopping-cart" color="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Revenue chart */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue & profit — last 6 months</h3>
              <p className="text-xs text-gray-400 mt-0.5">Paid invoices only</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" /> Profit</span>
            </div>
          </div>
          {monthly.every(m => m.revenue === 0) ? (
            <div className="h-24 flex items-center justify-center text-xs text-gray-400">No paid invoices yet — data will appear here</div>
          ) : (
            <div className="flex gap-2 items-end h-24">
              {monthly.map((m, i) => {
                const maxVal = Math.max(...monthly.map(d => d.revenue), 1)
                const revH = Math.max((m.revenue / maxVal) * 80, 2)
                const proH = Math.max((Math.max(m.profit, 0) / maxVal) * 80, m.profit > 0 ? 2 : 0)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end gap-0.5 justify-center" style={{ height: 80 }}>
                      <div style={{ height: revH, minHeight: 2 }} className="flex-1 bg-indigo-400 rounded-t-sm opacity-70" title={`Revenue: ${fmt(m.revenue)}`} />
                      <div style={{ height: proH, minHeight: m.profit > 0 ? 2 : 0 }} className="flex-1 bg-green-400 rounded-t-sm" title={`Profit: ${fmt(m.profit)}`} />
                    </div>
                    <span className="text-[10px] text-gray-400">{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Invoice status breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice status</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const total = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1
              const pct = Math.round((count / total) * 100)
              const s = STATUS_STYLES[status]
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s?.dot || 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-600 capitalize">{status}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s?.dot?.replace('bg-', 'bg-') || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.values(statusCounts).every(v => v === 0) && (
              <p className="text-xs text-gray-400 text-center py-4">No invoices yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent invoices */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Recent invoices</h3>
            <button onClick={() => navigate('/invoices')} className="text-xs text-indigo-500 hover:text-indigo-700">View all →</button>
          </div>
          {recent.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">No invoices yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(inv => {
                const s = STATUS_STYLES[inv.status] || STATUS_STYLES.draft
                return (
                  <div key={inv.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i className="ti ti-file-invoice text-gray-500 text-sm" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 font-mono">{inv.invoice_number}</div>
                        <div className="text-xs text-gray-400">{inv.client_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{fmt(inv.total)}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{inv.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top clients */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Top clients</h3>
            <button onClick={() => navigate('/clients')} className="text-xs text-indigo-500 hover:text-indigo-700">View all →</button>
          </div>
          {topClients.length === 0 ? (
            <div className="py-10 text-center text-xs text-gray-400">No paid invoices yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topClients.map((c, i) => {
                const maxRev = topClients[0]?.revenue || 1
                const pct = (c.revenue / maxRev) * 100
                return (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-mono w-4">#{i + 1}</span>
                        <span className="text-sm text-gray-900 font-medium">{c.name}</span>
                        <span className="text-xs text-gray-400">{c.count} invoice{c.count !== 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{fmt(c.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
