import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState([])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!files.length) return

    setStatus('uploading')
    const form = new FormData()
    for (const f of files) form.append('files', f)

    try {
      const res = await axios.post(`${API_BASE}/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(res.data.results || [])
      setStatus('done')
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bulk Upload Files</h1>
        <a className="text-blue-600" href="/">Go to Dashboard</a>
      </div>
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow border p-6 space-y-4">
        <input type="file" multiple accept=".pdf,.xlsx,.xls" onChange={(e)=> setFiles([...e.target.files])} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Upload</button>
      </form>

      {status === 'uploading' && (
        <div className="text-gray-700">Processing files... please wait.</div>
      )}

      {status === 'done' && (
        <div className="space-y-2">
          <div className="font-medium">Processed Results</div>
          <ul className="list-disc ml-6">
            {results.map((r,i)=> (
              <li key={i}>{r.file}: {r.status} {r.jsonPath ? `(saved ${r.jsonPath})` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-600">Upload failed. Check server logs.</div>
      )}
    </div>
  )
}
