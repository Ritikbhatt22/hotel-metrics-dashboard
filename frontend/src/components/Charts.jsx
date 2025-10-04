import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'

export function RevenueChart({ data }) {
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="font-semibold mb-2">Revenue Over Time</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function OccupancyChart({ data }) {
  return (
    <div className="bg-white rounded-lg shadow border p-4">
      <div className="font-semibold mb-2">Occupancy Over Time</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="occupancy" stroke="#10b981" name="Occupancy %" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
