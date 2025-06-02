// Simple sentiment analysis using basic keyword matching
// In production, you might want to use a more sophisticated approach

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
    score = (positiveScore - negativeScore) / totalSentimentWords
    
    if (score > 0.2) {
      label = 'positive'
    } else if (score < -0.2) {
      label = 'negative'
    }
  }
  
  // Normalize score to 0-1 range
  const normalizedScore = (score + 1) / 2
  
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