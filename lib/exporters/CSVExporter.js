import Papa from 'papaparse'
import { format } from 'date-fns'

export class CSVExporter {
  static generateCSV(feedback, options = {}) {
    const {
      includeFields = ['all'],
      dateFormat = 'yyyy-MM-dd',
      includeHeaders = true,
      customFields = []
    } = options

    // Define available fields
    const availableFields = {
      id: 'ID',
      content: 'Feedback Content',
      category: 'Category',
      source: 'Source',
      sentimentLabel: 'Sentiment',
      sentimentScore: 'Sentiment Score',
      feedbackDate: 'Feedback Date',
      createdAt: 'Created Date',
      topics: 'Topics'
    }

    // Determine which fields to include
    let fieldsToInclude
    if (includeFields.includes('all')) {
      fieldsToInclude = Object.keys(availableFields)
    } else {
      fieldsToInclude = includeFields.filter(field => availableFields[field])
    }

    // Add custom fields
    if (customFields.length > 0) {
      customFields.forEach(field => {
        if (!fieldsToInclude.includes(field.key)) {
          fieldsToInclude.push(field.key)
          availableFields[field.key] = field.label
        }
      })
    }

    // Format data for CSV
    const csvData = feedback.map(item => {
      const row = {}
      
      fieldsToInclude.forEach(field => {
        switch (field) {
          case 'id':
            row[availableFields[field]] = item.id
            break
          case 'content':
            row[availableFields[field]] = item.content || ''
            break
          case 'category':
            row[availableFields[field]] = item.category || ''
            break
          case 'source':
            row[availableFields[field]] = item.source || ''
            break
          case 'sentimentLabel':
            row[availableFields[field]] = item.sentimentLabel || item.sentiment_label || ''
            break
          case 'sentimentScore':
            const score = item.sentimentScore || item.sentiment_score || 0
            row[availableFields[field]] = typeof score === 'number' ? 
              (score * 100).toFixed(1) + '%' : score
            break
          case 'feedbackDate':
            const feedbackDate = item.feedbackDate || item.feedback_date
            row[availableFields[field]] = feedbackDate ? 
              format(new Date(feedbackDate), dateFormat) : ''
            break
          case 'createdAt':
            const createdAt = item.createdAt || item.created_at
            row[availableFields[field]] = createdAt ? 
              format(new Date(createdAt), dateFormat + ' HH:mm:ss') : ''
            break
          case 'topics':
            row[availableFields[field]] = Array.isArray(item.topics) ? 
              item.topics.join(', ') : (item.topics || '')
            break
          default:
            // Handle custom fields
            row[availableFields[field] || field] = item[field] || ''
        }
      })
      
      return row
    })

    // Generate CSV string
    const csv = Papa.unparse(csvData, {
      header: includeHeaders,
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      newline: '\r\n'
    })

    return csv
  }

  static downloadCSV(csvData, filename = 'feedback_export.csv') {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  static generateSummaryCSV(feedback, analytics) {
    const summaryData = [
      { Metric: 'Total Feedback', Value: feedback.length },
      { Metric: 'Positive Feedback', Value: analytics.sentimentDistribution.positive || 0 },
      { Metric: 'Negative Feedback', Value: analytics.sentimentDistribution.negative || 0 },
      { Metric: 'Neutral Feedback', Value: analytics.sentimentDistribution.neutral || 0 },
      { Metric: 'Average Sentiment Score', Value: `${(analytics.averageSentiment * 100).toFixed(1)}%` },
      { Metric: 'Date Range', Value: this.getDateRange(feedback) },
      { Metric: 'Most Common Category', Value: this.getMostCommonValue(feedback, 'category') },
      { Metric: 'Most Common Source', Value: this.getMostCommonValue(feedback, 'source') }
    ]

    return Papa.unparse(summaryData, {
      header: true,
      quotes: true
    })
  }

  static getDateRange(feedback) {
    if (feedback.length === 0) return 'No data'
    
    const dates = feedback
      .map(f => new Date(f.feedbackDate || f.feedback_date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b)
    
    if (dates.length === 0) return 'No valid dates'
    
    const earliest = format(dates[0], 'yyyy-MM-dd')
    const latest = format(dates[dates.length - 1], 'yyyy-MM-dd')
    
    return earliest === latest ? earliest : `${earliest} to ${latest}`
  }

  static getMostCommonValue(feedback, field) {
    const counts = {}
    feedback.forEach(item => {
      const value = item[field]
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })
    
    const entries = Object.entries(counts)
    if (entries.length === 0) return 'N/A'
    
    const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b)
    return `${mostCommon[0]} (${mostCommon[1]})`
  }

  static async exportWithAnalytics(feedback, analytics, options = {}) {
    const {
      includeRawData = true,
      includeSummary = true,
      separateFiles = false
    } = options

    if (separateFiles) {
      // Export as separate files
      if (includeRawData) {
        const rawCSV = this.generateCSV(feedback, options)
        this.downloadCSV(rawCSV, 'feedback_raw_data.csv')
      }
      
      if (includeSummary) {
        const summaryCSV = this.generateSummaryCSV(feedback, analytics)
        this.downloadCSV(summaryCSV, 'feedback_summary.csv')
      }
    } else {
      // Export as single file with multiple sheets (as separate sections)
      let combinedCSV = ''
      
      if (includeSummary) {
        combinedCSV += '# FEEDBACK SUMMARY\n'
        combinedCSV += this.generateSummaryCSV(feedback, analytics)
        combinedCSV += '\n\n'
      }
      
      if (includeRawData) {
        combinedCSV += '# RAW FEEDBACK DATA\n'
        combinedCSV += this.generateCSV(feedback, options)
      }
      
      this.downloadCSV(combinedCSV, 'feedback_complete_export.csv')
    }
  }
}

export default CSVExporter