// Enhanced sentiment analysis with AI-powered categorization
// Combines traditional keyword matching with Gemini AI categorization

import { categorizeFeedback } from './geminiAI.js';

const positiveWords = [
  'amazing', 'awesome', 'excellent', 'fantastic', 'great', 'good', 'love', 'perfect',
  'wonderful', 'best', 'outstanding', 'brilliant', 'satisfied', 'happy', 'pleased',
  'impressed', 'recommend', 'helpful', 'fast', 'quick', 'easy', 'smooth', 'efficient'
]

const negativeWords = [
  'terrible', 'awful', 'bad', 'worst', 'hate', 'horrible', 'disgusting', 'disappointing',
  'frustrated', 'angry', 'annoyed', 'slow', 'difficult', 'hard', 'confusing', 'broken',
  'useless', 'poor', 'expensive', 'overpriced', 'delayed', 'late', 'rude', 'unhelpful'
]

export async function analyzeSentiment(text) {
  const words = text.toLowerCase().split(/\s+/)
  
  let positiveScore = 0
  let negativeScore = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveScore++
    }
    if (negativeWords.includes(word)) {
      negativeScore++
    }
  })
  
  // Calculate overall sentiment
  const totalSentimentWords = positiveScore + negativeScore
  let score = 0
  let label = 'neutral'
  
  if (totalSentimentWords > 0) {
    // Calculate ratio of positive vs total sentiment words
    score = positiveScore / totalSentimentWords
    
    if (score >= 0.6) {
      label = 'positive'
    } else if (score <= 0.4) {
      label = 'negative'
    }
  } else {
    // Default neutral score
    score = 0.5
  }
  
  // Score is already normalized to 0-1 range
  const normalizedScore = score
  
  // Extract basic topics/keywords
  const topics = extractTopics(text)
  
  return {
    score: normalizedScore,
    label,
    confidence: totalSentimentWords > 0 ? Math.min(totalSentimentWords * 0.2, 1) : 0.1,
    topics
  }
}

function extractTopics(text) {
  const topicKeywords = {
    'product': ['product', 'item', 'quality', 'design', 'feature'],
    'service': ['service', 'support', 'help', 'staff', 'team'],
    'delivery': ['delivery', 'shipping', 'arrived', 'package', 'fast', 'slow'],
    'price': ['price', 'cost', 'expensive', 'cheap', 'value', 'money'],
    'website': ['website', 'app', 'online', 'interface', 'login'],
    'payment': ['payment', 'checkout', 'card', 'billing', 'transaction']
  }
  
  const topics = []
  const words = text.toLowerCase().split(/\s+/)
  
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some(keyword => words.includes(keyword))) {
      topics.push(topic)
    }
  })
  
  return topics.length > 0 ? topics : ['general']
}

/**
 * Enhanced analysis combining sentiment analysis with AI categorization
 * @param {string} text - The feedback text to analyze
 * @returns {Promise<Object>} Combined analysis result
 */
export async function analyzeAndCategorizeFeedback(text) {
  try {
    // Run sentiment analysis and AI categorization in parallel
    const [sentimentResult, aiResult] = await Promise.all([
      analyzeSentiment(text),
      categorizeFeedback(text)
    ]);

    // Create comprehensive analysis result
    const analysisResult = {
      // Sentiment analysis results
      sentimentScore: sentimentResult.score,
      sentimentLabel: sentimentResult.label,
      sentimentConfidence: sentimentResult.confidence,
      topics: sentimentResult.topics,
      
      // AI categorization results
      aiCategory: aiResult.category,
      aiCategoryConfidence: aiResult.confidence,
      aiReasoning: aiResult.reasoning,
      
      // Combined metadata
      analysisTimestamp: new Date().toISOString(),
      analysisVersion: '2.1.0'
    };

    // Create classification metadata for database storage
    const classificationMeta = {
      sentimentAnalysis: {
        method: 'keyword_based',
        positiveWords: sentimentResult.topics.includes('compliment') ? 1 : 0,
        negativeWords: sentimentResult.topics.includes('complaint') ? 1 : 0,
        confidence: sentimentResult.confidence
      },
      aiClassification: {
        method: 'gemini_ai',
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        reasoning: aiResult.reasoning,
        confidence: aiResult.confidence
      },
      timestamp: new Date().toISOString()
    };

    // Create classification history entry
    const historyEntry = {
      timestamp: new Date().toISOString(),
      category: aiResult.category,
      confidence: aiResult.confidence,
      method: 'ai_classification',
      reasoning: aiResult.reasoning
    };

    return {
      ...analysisResult,
      classificationMeta,
      historyEntry
    };

  } catch (error) {
    console.error('Enhanced analysis failed:', error);
    
    // Fallback to basic sentiment analysis only
    const sentimentResult = await analyzeSentiment(text);
    
    return {
      sentimentScore: sentimentResult.score,
      sentimentLabel: sentimentResult.label,
      sentimentConfidence: sentimentResult.confidence,
      topics: sentimentResult.topics,
      
      // Fallback AI results
      aiCategory: 'general_inquiry',
      aiCategoryConfidence: 0.3,
      aiReasoning: 'Fallback classification due to AI service unavailability',
      
      classificationMeta: {
        sentimentAnalysis: {
          method: 'keyword_based',
          confidence: sentimentResult.confidence
        },
        aiClassification: {
          method: 'fallback',
          reasoning: 'AI service unavailable',
          confidence: 0.3
        },
        timestamp: new Date().toISOString(),
        error: error.message
      },
      
      historyEntry: {
        timestamp: new Date().toISOString(),
        category: 'general_inquiry',
        confidence: 0.3,
        method: 'fallback',
        reasoning: 'AI service unavailable'
      },
      
      analysisTimestamp: new Date().toISOString(),
      analysisVersion: '2.1.0'
    };
  }
}

/**
 * Re-analyze existing feedback with AI categorization
 * @param {string} text - The feedback text to re-analyze
 * @param {Array} existingHistory - Existing classification history
 * @returns {Promise<Object>} Re-analysis result
 */
export async function reanalyzeFeedback(text, existingHistory = []) {
  try {
    const result = await analyzeAndCategorizeFeedback(text);
    
    // Add previous classifications to history
    const updatedHistory = [
      ...existingHistory,
      result.historyEntry
    ];
    
    return {
      ...result,
      classificationHistory: updatedHistory
    };
    
  } catch (error) {
    console.error('Re-analysis failed:', error);
    throw error;
  }
}