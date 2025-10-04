import React from 'react'

export default function KPIcards({ totals }) {
  const items = [
    { label: 'Revenue', value: totals.revenue, formatter: (v)=>`$${(v||0).toLocaleString()}` },
    { label: 'ADR', value: totals.ADR, formatter: (v)=>`$${(v||0).toFixed(2)}` },
    { label: 'RevPAR', value: totals.RevPAR, formatter: (v)=>`$${(v||0).toFixed(2)}` },
    { label: 'Occupancy', value: totals.occupancy, formatter: (v)=>`${(v||0).toFixed(1)}%` },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {items.map((k)=> (
        <div key={k.label} className="rounded-lg bg-white shadow p-4 border">
          <div className="text-sm text-gray-500">{k.label}</div>
          <div className="text-2xl font-semibold mt-1">{k.formatter(k.value)}</div>
        </div>
      ))}
    </div>
  )
}
