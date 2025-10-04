import React from 'react'

export default function TableView({ rows }) {
  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-right">Revenue</th>
              <th className="px-4 py-2 text-right">ADR</th>
              <th className="px-4 py-2 text-right">RevPAR</th>
              <th className="px-4 py-2 text-right">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{r.date}</td>
                <td className="px-4 py-2 text-right">${r.revenue.toLocaleString()}</td>
                <td className="px-4 py-2 text-right">${r.ADR.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${r.RevPAR.toFixed(2)}</td>
                <td className="px-4 py-2 text-right">{r.occupancy.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
