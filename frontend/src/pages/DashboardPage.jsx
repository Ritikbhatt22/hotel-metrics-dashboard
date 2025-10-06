import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import KPIcards from '../components/KPIcards.jsx'
import TableView from '../components/TableView.jsx'
import { RevenueChart, OccupancyChart } from '../components/Charts.jsx'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function computeTotals(rows) {
  if (!rows.length) return { revenue: 0, ADR: 0, RevPAR: 0, occupancy: 0 }
  const revenue = rows.reduce((s,r)=> s + (r.metrics?.revenue || 0), 0)
  const ADR = rows.reduce((s,r)=> s + (r.metrics?.ADR || 0), 0) / rows.length
  const RevPAR = rows.reduce((s,r)=> s + (r.metrics?.RevPAR || 0), 0) / rows.length
  const occupancy = rows.reduce((s,r)=> s + (r.metrics?.occupancy || 0), 0) / rows.length
  return { revenue, ADR, RevPAR, occupancy }
}

function normalizeForUI(rows) {
  return rows.map(r => {
    // handle Firestore timestamp or string
    let dateValue = null;

    if (r.date) {
      // Firestore Timestamp (browser SDK/REST): seconds | _seconds
      if (typeof r.date === 'object') {
        const seconds = r.date.seconds ?? r.date._seconds;
        if (typeof seconds === 'number') {
          dateValue = new Date(seconds * 1000);
        } else if (r.date instanceof Date) {
          dateValue = new Date(r.date.getTime());
        }
      }
      // If still null, try to parse as string/number
      if (!dateValue) {
        if (typeof r.date === 'string' || typeof r.date === 'number') {
          const d = new Date(r.date);
          if (!isNaN(d)) dateValue = d;
        }
      }
    }

    return {
      date: dateValue ? dateValue.toISOString().slice(0, 10) : '',
      revenue: r.metrics?.revenue || 0,
      ADR: r.metrics?.ADR || 0,
      RevPAR: r.metrics?.RevPAR || 0,
      occupancy: r.metrics?.occupancy || 0,
      hotelName: r.hotelName,
    };
  });
}

 function deleteMetrics(hotelName) {
  if (!hotelName) {
    alert('Please select a hotel to delete its metrics.');
    return;
  }
  try{
     axios.delete(`${API_BASE}/api/metrics/${encodeURIComponent(hotelName)}`).then(res => {
      window.location.reload();
    })
  } catch (e) {
    console.error(e)
  }
}



export default function DashboardPage() {
  const [all, setAll] = useState([])
  const [hotelName, setHotelName] = useState('')
  const [loading, setLoading] = useState(false)

  const filtered = useMemo(() => {
    return hotelName ? all.filter(r => r.hotelName === hotelName) : all;
  }, [all, hotelName])

  const rows = useMemo(() => normalizeForUI(filtered), [filtered])
  const totals = useMemo(() => computeTotals(filtered), [filtered])

  useEffect(() => {
    let cancel = false
    async function load() {
      setLoading(true)
      try {
        const res = await axios.get(`${API_BASE}/api/metrics`)
        if (!cancel) setAll(res.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { cancel = true }
  }, [])

  const deleteAllMetrics = async () => {
    try {
      const res = await axios.delete(`${API_BASE}/api/metrics`);
      if (res.status === 200) {
        console.log("✅ Metrics deleted:", res.data);
        alert("All metrics deleted successfully!");
        window.location.reload();
      } else {
        console.warn("⚠️ Unexpected response:", res.status, res.data);
      }
    } catch (error) {
      console.error(" Failed to delete metrics:", error.message || error);
      alert("Failed to delete metrics. Please check console logs.");
    }
  };
  
  

  const hotelOptions = useMemo(() => {
    return Array.from(new Set(all.map(r => r.hotelName)))
  }, [all])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Hotel Dashboard</h1>
        <a className="text-blue-600" href="/upload">Upload Files</a>
      </div>

      <div className="bg-white rounded-lg shadow border p-4 flex items-center gap-4">
        <label className="text-sm text-gray-600">Filter by Hotel</label>
        <select className="border rounded px-2 py-1" value={hotelName} onChange={(e)=> setHotelName(e.target.value)}>
          <option value="">All Hotels</option>
          {hotelOptions.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={()=> deleteMetrics(hotelName)}>Delete Metrics</button>
        <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={()=> deleteAllMetrics()}>Delete All Metrics</button>
      </div>

      <KPIcards totals={totals} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RevenueChart data={rows} />
        <OccupancyChart data={rows} />
      </div>

      <TableView rows={rows} />

      {loading && <div>Loading...</div>}
    </div>
  )
}
