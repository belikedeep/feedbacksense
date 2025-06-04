'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { batchAnalyzeAndCategorizeFeedback } from '@/lib/sentimentAnalysis'
import { getBatchConfig } from '@/lib/batchConfig'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

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
          // Extract and validate feedback content
          const validRows = results.data.filter(row =>
            row[columnMapping.content] && row[columnMapping.content].trim()
          );
          
          if (validRows.length === 0) {
            setMessage('No valid feedback content found in the CSV file')
            setLoading(false)
            return
          }
          
          const total = validRows.length
          setMessage(`Processing ${total} feedback entries with AI batch analysis...`)
          
          try {
            // Get batch configuration for CSV import
            const batchConfig = getBatchConfig('csv_import')
            
            // Extract content for batch processing
            const contentTexts = validRows.map(row => row[columnMapping.content].trim())
            
            setMessage(`🚀 Starting batch analysis with optimized processing (${batchConfig.batchSize} items per batch)...`)
            
            // Use batch analysis with progress tracking
            const analysisResults = await batchAnalyzeAndCategorizeFeedback(
              contentTexts,
              batchConfig.batchSize,
              (progress) => {
                setMessage(
                  `⚡ ${batchConfig.description}: Batch ${progress.batchesCompleted}/${progress.totalBatches} - ` +
                  `${progress.processed}/${progress.total} entries analyzed (${progress.percentage}%)`
                )
              }
            )
            
            // Create feedback objects with analysis results
            const feedbacks = validRows.map((row, index) => {
              const analysisResult = analysisResults[index]
              
              return {
                content: row[columnMapping.content].trim(),
                source: row[columnMapping.source] || 'csv_import',
                category: row[columnMapping.category] || analysisResult.aiCategory,
                sentimentScore: analysisResult.sentimentScore,
                sentimentLabel: analysisResult.sentimentLabel,
                feedbackDate: row[columnMapping.date] || new Date().toISOString(),
                topics: analysisResult.topics || [],
                // Include AI analysis data
                aiCategoryConfidence: analysisResult.aiCategoryConfidence,
                aiClassificationMeta: analysisResult.classificationMeta,
                classificationHistory: [analysisResult.historyEntry],
                manualOverride: row[columnMapping.category] ? true : false // True if CSV had a category
              }
            })

            if (feedbacks.length > 0) {
              setMessage(`Saving ${feedbacks.length} analyzed feedback entries to database...`)
              
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

              setMessage(`🎉 Successfully imported ${result.count} feedback entries with AI batch analysis! All entries were processed efficiently using batch processing.`)
              onFeedbackImported(result.feedbacks)
              setFile(null)
              setPreview(null)
              setColumnMapping({ content: '', source: '', category: '', date: '' })
            } else {
              setMessage('No valid feedback found in the CSV file')
            }
            
          } catch (batchAnalysisError) {
            console.error('Batch analysis failed:', batchAnalysisError)
            setMessage(`Error during batch analysis: ${batchAnalysisError.message}. Please try with a smaller file.`)
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📁</span>
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file containing feedback data for bulk import and AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-4xl">📄</div>
                    <div>
                      <Label htmlFor="csv-file" className="cursor-pointer">
                        <Button variant="outline" className="gap-2">
                          <span>📁</span>
                          Choose CSV File
                        </Button>
                      </Label>
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {file ? `Selected: ${file.name}` : 'Click to browse or drag and drop your CSV file here'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview and Column Mapping */}
          {preview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-xl">🗺️</span>
                  Column Mapping & Preview
                </CardTitle>
                <CardDescription>
                  Map your CSV columns to the appropriate feedback fields
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Column Mapping */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="content-column">
                      Content Column *
                      <Badge variant="destructive" className="ml-2 text-xs">Required</Badge>
                    </Label>
                    <Select
                      value={columnMapping.content || "none"}
                      onValueChange={(value) => setColumnMapping({...columnMapping, content: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Select column...</SelectItem>
                        {preview.meta.fields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="source-column">
                      Source Column
                      <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                    </Label>
                    <Select
                      value={columnMapping.source || "none"}
                      onValueChange={(value) => setColumnMapping({...columnMapping, source: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Skip this field</SelectItem>
                        {preview.meta.fields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category-column">
                      Category Column
                      <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                    </Label>
                    <Select
                      value={columnMapping.category || "none"}
                      onValueChange={(value) => setColumnMapping({...columnMapping, category: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Let AI categorize" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">🤖 AI Auto-categorization</SelectItem>
                        {preview.meta.fields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-column">
                      Date Column
                      <Badge variant="secondary" className="ml-2 text-xs">Optional</Badge>
                    </Label>
                    <Select
                      value={columnMapping.date || "none"}
                      onValueChange={(value) => setColumnMapping({...columnMapping, date: value === "none" ? "" : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Use current date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Use current date</SelectItem>
                        {preview.meta.fields.map(field => (
                          <SelectItem key={field} value={field}>{field}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Preview Table */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Data Preview (First 3 rows)</h4>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          {preview.meta.fields.map(field => (
                            <th key={field} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-r last:border-r-0">
                              <div className="flex items-center gap-2">
                                {field}
                                {columnMapping.content === field && <Badge variant="destructive" className="text-xs">Content</Badge>}
                                {columnMapping.source === field && <Badge variant="secondary" className="text-xs">Source</Badge>}
                                {columnMapping.category === field && <Badge variant="secondary" className="text-xs">Category</Badge>}
                                {columnMapping.date === field && <Badge variant="secondary" className="text-xs">Date</Badge>}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            {preview.meta.fields.map(field => (
                              <td key={field} className="px-4 py-3 text-sm border-r last:border-r-0 max-w-[200px] truncate">
                                {row[field]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={loading || !columnMapping.content}
                    size="lg"
                    className="gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        🚀 Import & Analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          {message && (
            <Alert className={message.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Processing Info */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <span className="text-xl">🤖</span>
                AI Batch Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">What happens during import:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    CSV data validation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Batch AI analysis (15 items/batch)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Sentiment classification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Auto-categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Database storage
                  </li>
                </ul>
              </div>
              <Separator />
              <div>
                <Badge variant="secondary" className="text-xs">
                  ⚡ 10-15x faster than individual processing
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                CSV Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Requirements:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Header row with column names</li>
                  <li>• At least one content column</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Optional columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Source (email, chat, survey, etc.)</li>
                  <li>• Category (overrides AI)</li>
                  <li>• Date (ISO format preferred)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example structure:</h4>
                <div className="bg-muted/50 p-3 rounded text-xs font-mono">
                  content,source,date<br/>
                  "Great service!",email,2024-01-01<br/>
                  "Issue with billing",chat,2024-01-02
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch size:</span>
                <Badge variant="outline">15 items</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing speed:</span>
                <Badge variant="outline">~1-2 sec/batch</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate limit friendly:</span>
                <Badge variant="default">✓ Yes</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}