'use client'

import { useState } from 'react'
import { CSVExporter } from '@/lib/exporters/CSVExporter'
import { PDFReportGenerator } from '@/lib/exporters/PDFReportGenerator'
import { format } from 'date-fns'

export default function ExportPanel({ feedback, analytics, filteredFeedback }) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState('csv')
  const [exportOptions, setExportOptions] = useState({
    // CSV options
    includeHeaders: true,
    dateFormat: 'yyyy-MM-dd',
    includeFields: ['all'],
    separateFiles: false,
    includeRawData: true,
    includeSummary: true,
    
    // PDF options
    includeCharts: true,
    includeFeedbackTable: true,
    includeInsights: true,
    maxFeedbackEntries: 20,
    
    // General options
    useFilteredData: true,
    filename: ''
  })

  const dataToExport = exportOptions.useFilteredData ? filteredFeedback : feedback
  const recordCount = dataToExport.length

  const handleExportOptionChange = (option, value) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }))
  }

  const generateFilename = (type) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const dataType = exportOptions.useFilteredData ? 'filtered' : 'all'
    const base = exportOptions.filename || `feedback_${dataType}_${timestamp}`
    return `${base}.${type}`
  }

  const handleCSVExport = async () => {
    try {
      setIsExporting(true)

      if (exportOptions.includeSummary && exportOptions.includeRawData && exportOptions.separateFiles) {
        // Export as separate files
        await CSVExporter.exportWithAnalytics(dataToExport, analytics, {
          ...exportOptions,
          separateFiles: true
        })
      } else if (exportOptions.includeSummary && exportOptions.includeRawData) {
        // Export as combined file
        await CSVExporter.exportWithAnalytics(dataToExport, analytics, {
          ...exportOptions,
          separateFiles: false
        })
      } else if (exportOptions.includeRawData) {
        // Export raw data only
        const csvData = CSVExporter.generateCSV(dataToExport, exportOptions)
        CSVExporter.downloadCSV(csvData, generateFilename('csv'))
      } else if (exportOptions.includeSummary) {
        // Export summary only
        const summaryCSV = CSVExporter.generateSummaryCSV(dataToExport, analytics)
        CSVExporter.downloadCSV(summaryCSV, generateFilename('csv'))
      }

    } catch (error) {
      console.error('CSV export failed:', error)
      alert('Failed to export CSV. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDFExport = async () => {
    try {
      setIsExporting(true)

      const generator = new PDFReportGenerator()
      
      // Collect chart elements if needed
      let chartElements = []
      if (exportOptions.includeCharts) {
        const chartContainers = document.querySelectorAll('[data-chart-export]')
        chartElements = Array.from(chartContainers).map(element => ({
          element,
          title: element.getAttribute('data-chart-title') || 'Chart',
          width: 160,
          height: 100
        }))
      }

      const report = await generator.generateReport(dataToExport, analytics, {
        title: 'Feedback Analytics Report',
        subtitle: exportOptions.useFilteredData ? 
          `Filtered Results (${recordCount} of ${feedback.length} entries)` : 
          `Complete Dataset (${recordCount} entries)`,
        includeCharts: exportOptions.includeCharts,
        includeFeedbackTable: exportOptions.includeFeedbackTable,
        includeInsights: exportOptions.includeInsights,
        maxFeedbackEntries: exportOptions.maxFeedbackEntries,
        chartElements
      })

      generator.downloadPDF(generateFilename('pdf'))

    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    if (exportType === 'csv') {
      handleCSVExport()
    } else {
      handlePDFExport()
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
      
      {/* Export Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="csv"
              checked={exportType === 'csv'}
              onChange={(e) => setExportType(e.target.value)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">CSV (Data)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="pdf"
              checked={exportType === 'pdf'}
              onChange={(e) => setExportType(e.target.value)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">PDF (Report)</span>
          </label>
        </div>
      </div>

      {/* Data Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Data to Export
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              checked={exportOptions.useFilteredData}
              onChange={() => handleExportOptionChange('useFilteredData', true)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">
              Filtered results ({recordCount} entries)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={!exportOptions.useFilteredData}
              onChange={() => handleExportOptionChange('useFilteredData', false)}
              className="form-radio text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">
              All feedback ({feedback.length} entries)
            </span>
          </label>
        </div>
      </div>

      {/* CSV Options */}
      {exportType === 'csv' && (
        <div className="mb-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-700">CSV Options</h4>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeHeaders}
                onChange={(e) => handleExportOptionChange('includeHeaders', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include column headers</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeRawData}
                onChange={(e) => handleExportOptionChange('includeRawData', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include raw feedback data</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeSummary}
                onChange={(e) => handleExportOptionChange('includeSummary', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include analytics summary</span>
            </label>

            {exportOptions.includeRawData && exportOptions.includeSummary && (
              <label className="flex items-center ml-4">
                <input
                  type="checkbox"
                  checked={exportOptions.separateFiles}
                  onChange={(e) => handleExportOptionChange('separateFiles', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Export as separate files</span>
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Format
            </label>
            <select
              value={exportOptions.dateFormat}
              onChange={(e) => handleExportOptionChange('dateFormat', e.target.value)}
              className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="yyyy-MM-dd">2024-01-15</option>
              <option value="MM/dd/yyyy">01/15/2024</option>
              <option value="dd/MM/yyyy">15/01/2024</option>
              <option value="PPP">January 15th, 2024</option>
            </select>
          </div>
        </div>
      )}

      {/* PDF Options */}
      {exportType === 'pdf' && (
        <div className="mb-6 space-y-4">
          <h4 className="text-sm font-medium text-gray-700">PDF Report Options</h4>
          
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeCharts}
                onChange={(e) => handleExportOptionChange('includeCharts', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include charts and visualizations</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeFeedbackTable}
                onChange={(e) => handleExportOptionChange('includeFeedbackTable', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include feedback entries table</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.includeInsights}
                onChange={(e) => handleExportOptionChange('includeInsights', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="ml-2 text-sm text-gray-700">Include insights and recommendations</span>
            </label>
          </div>

          {exportOptions.includeFeedbackTable && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max feedback entries in table
              </label>
              <input
                type="number"
                min="5"
                max="100"
                value={exportOptions.maxFeedbackEntries}
                onChange={(e) => handleExportOptionChange('maxFeedbackEntries', parseInt(e.target.value))}
                className="block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Custom Filename */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Filename (optional)
        </label>
        <input
          type="text"
          value={exportOptions.filename}
          onChange={(e) => handleExportOptionChange('filename', e.target.value)}
          placeholder="Leave empty for auto-generated name"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Preview: {generateFilename(exportType)}
        </p>
      </div>

      {/* Export Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Ready to export {recordCount} feedback entries
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || recordCount === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export {exportType.toUpperCase()}
            </>
          )}
        </button>
      </div>
    </div>
  )
}