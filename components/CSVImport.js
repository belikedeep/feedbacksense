'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { analyzeSentiment } from '@/lib/sentimentAnalysis'
import Papa from 'papaparse'

export default function CSVImport({ onFeedbackImported }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [columnMapping, setColumnMapping] = useState({
    content: '',
    source: '',
    category: '',
    date: ''
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setMessage('')
      
      // Parse first few rows for preview
      Papa.parse(selectedFile, {
        header: true,
        preview: 3,
        complete: (results) => {
          setPreview(results)
        }
      })
    } else {
      setMessage('Please select a valid CSV file')
    }
  }

  const handleImport = async () => {
    if (!file || !columnMapping.content) {
      setMessage('Please select a file and map the content column')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const feedbacks = []
          
          for (const row of results.data) {
            if (row[columnMapping.content] && row[columnMapping.content].trim()) {
              const content = row[columnMapping.content].trim()
              const sentimentResult = await analyzeSentiment(content)
              
              feedbacks.push({
                content,
                source: row[columnMapping.source] || 'csv_import',
                category: row[columnMapping.category] || 'general',
                sentimentScore: sentimentResult.score,
                sentimentLabel: sentimentResult.label,
                feedbackDate: row[columnMapping.date] || new Date().toISOString(),
                topics: sentimentResult.topics || []
              })
            }
          }

          if (feedbacks.length > 0) {
            const response = await fetch('/api/feedback/bulk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ feedbacks })
            })

            if (!response.ok) throw new Error('Failed to import feedback')
            const result = await response.json()

            setMessage(`Successfully imported ${result.count} feedback entries!`)
            onFeedbackImported(result.feedbacks)
            setFile(null)
            setPreview(null)
            setColumnMapping({ content: '', source: '', category: '', date: '' })
          } else {
            setMessage('No valid feedback found in the CSV file')
          }
          
          setLoading(false)
        },
        error: (error) => {
          setMessage('Error parsing CSV: ' + error.message)
          setLoading(false)
        }
      })
    } catch (error) {
      setMessage('Error importing feedback: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Feedback from CSV</h2>
      
      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Preview and Column Mapping */}
        {preview && (
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview & Column Mapping</h3>
            
            {/* Column Mapping */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Content Column *</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={columnMapping.content}
                  onChange={(e) => setColumnMapping({...columnMapping, content: e.target.value})}
                >
                  <option value="">Select...</option>
                  {preview.meta.fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Source Column</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={columnMapping.source}
                  onChange={(e) => setColumnMapping({...columnMapping, source: e.target.value})}
                >
                  <option value="">Select...</option>
                  {preview.meta.fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Category Column</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={columnMapping.category}
                  onChange={(e) => setColumnMapping({...columnMapping, category: e.target.value})}
                >
                  <option value="">Select...</option>
                  {preview.meta.fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date Column</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={columnMapping.date}
                  onChange={(e) => setColumnMapping({...columnMapping, date: e.target.value})}
                >
                  <option value="">Select...</option>
                  {preview.meta.fields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {preview.meta.fields.map(field => (
                      <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.data.map((row, idx) => (
                    <tr key={idx}>
                      {preview.meta.fields.map(field => (
                        <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row[field]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        {preview && (
          <div>
            <button
              onClick={handleImport}
              disabled={loading || !columnMapping.content}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Import Feedback'}
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Instructions:</h4>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>The CSV must have a header row with column names</li>
            <li>At minimum, you need a column containing feedback content</li>
            <li>Optional columns: source, category, date</li>
            <li>Example: content,source,category,date</li>
            <li>The system will automatically analyze sentiment for each feedback</li>
          </ul>
        </div>
      </div>
    </div>
  )
}