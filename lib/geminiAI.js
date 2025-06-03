import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

/**
 * Gemini AI service for feedback categorization
 * Provides AI-powered categorization with fallback mechanisms
 */

// Load environment variables (for standalone usage)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

// Initialize Gemini AI client
let genAI;

function initializeGeminiAI() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('Gemini AI initialized successfully');
      return true;
    } else {
      console.warn('Gemini API key not found or invalid');
      return false;
    }
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return false;
  }
}

// Initialize on module load
initializeGeminiAI();

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 60,
  requests: [],
};

/**
 * Check if we're within rate limits
 * @returns {boolean} True if within limits
 */
function checkRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Remove old requests
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => time > oneMinuteAgo);
  
  // Check if we can make a new request
  return RATE_LIMIT.requests.length < RATE_LIMIT.maxRequestsPerMinute;
}

/**
 * Record a new API request for rate limiting
 */
function recordRequest() {
  RATE_LIMIT.requests.push(Date.now());
}

/**
 * Fallback categorization using keyword-based approach
 * @param {string} feedbackText - The feedback text to categorize
 * @returns {Object} Categorization result
 */
function fallbackCategorization(feedbackText) {
  const text = feedbackText.toLowerCase();
  
  // Define category keywords
  const categoryKeywords = {
    bug_report: ['bug', 'error', 'broken', 'crash', 'issue', 'problem', 'not working', 'fails', 'glitch'],
    feature_request: ['feature', 'add', 'request', 'suggestion', 'improve', 'enhancement', 'would like', 'need'],
    shipping_complaint: ['delivery', 'shipping', 'arrived', 'package', 'late', 'delayed', 'damaged', 'lost'],
    product_quality: ['quality', 'material', 'build', 'durability', 'defective', 'cheap', 'flimsy'],
    customer_service: ['service', 'support', 'staff', 'representative', 'help', 'rude', 'unhelpful', 'friendly'],
    refund_request: ['refund', 'return', 'money back', 'cancel', 'charge', 'billing', 'payment'],
    compliment: ['great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'thank you']
  };
  
  let bestMatch = { category: 'general_inquiry', score: 0 };
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword)).length;
    if (matches > bestMatch.score) {
      bestMatch = { category, score: matches };
    }
  });
  
  return {
    category: bestMatch.category,
    confidence: Math.min(bestMatch.score * 0.2, 0.8), // Lower confidence for fallback
    reasoning: `Keyword-based classification (fallback method). Found ${bestMatch.score} matching keywords.`
  };
}

/**
 * Categorize feedback using Gemini AI
 * @param {string} feedbackText - The feedback text to categorize
 * @returns {Promise<Object>} Categorization result with category, confidence, and reasoning
 */
export async function categorizeFeedback(feedbackText) {
  // Input validation
  if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim().length === 0) {
    throw new Error('Invalid feedback text provided');
  }
  
  // Check if Gemini AI is available
  if (!genAI) {
    console.warn('Gemini AI not available, using fallback categorization');
    return fallbackCategorization(feedbackText);
  }
  
  // Check rate limits
  if (!checkRateLimit()) {
    console.warn('Rate limit exceeded, using fallback categorization');
    return fallbackCategorization(feedbackText);
  }
  
  try {
    recordRequest();
    
    const model = genAI.getGenerativeModel({ 
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' 
    });
    
    const prompt = `
You are an AI assistant specialized in categorizing customer feedback. 

Analyze the following feedback text and categorize it into one of these categories:
- feature_request: Requests for new features or improvements
- bug_report: Reports of technical issues, errors, or malfunctions
- shipping_complaint: Issues related to delivery, packaging, or shipping
- product_quality: Concerns about product quality, materials, or build
- customer_service: Feedback about customer support or service experience
- general_inquiry: General questions or neutral feedback
- refund_request: Requests for refunds, returns, or billing issues
- compliment: Positive feedback, praise, or compliments

Feedback text: "${feedbackText}"

Respond with a JSON object containing:
{
  "category": "one of the categories above",
  "confidence": number between 0 and 1,
  "reasoning": "brief explanation of why this category was chosen"
}

Be concise and accurate. Confidence should reflect how certain you are about the categorization.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini AI');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate response structure
    const validCategories = [
      'feature_request', 'bug_report', 'shipping_complaint', 'product_quality',
      'customer_service', 'general_inquiry', 'refund_request', 'compliment'
    ];
    
    if (!validCategories.includes(parsed.category)) {
      throw new Error(`Invalid category returned: ${parsed.category}`);
    }
    
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error(`Invalid confidence score: ${parsed.confidence}`);
    }
    
    return {
      category: parsed.category,
      confidence: Math.round(parsed.confidence * 100) / 100, // Round to 2 decimal places
      reasoning: parsed.reasoning || 'AI-based categorization'
    };
    
  } catch (error) {
    console.error('Gemini AI categorization failed:', error);
    
    // Return fallback categorization on error
    return fallbackCategorization(feedbackText);
  }
}

/**
 * Batch categorize multiple feedback texts (for cost efficiency)
 * @param {string[]} feedbackTexts - Array of feedback texts
 * @returns {Promise<Object[]>} Array of categorization results
 */
export async function batchCategorizeFeedback(feedbackTexts) {
  if (!Array.isArray(feedbackTexts) || feedbackTexts.length === 0) {
    throw new Error('Invalid feedback texts array provided');
  }
  
  // For now, process individually but could be optimized for batch processing
  const results = [];
  
  for (const text of feedbackTexts) {
    try {
      const result = await categorizeFeedback(text);
      results.push(result);
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to categorize feedback: ${text}`, error);
      results.push(fallbackCategorization(text));
    }
  }
  
  return results;
}

/**
 * Get current API usage statistics
 * @returns {Object} Usage statistics
 */
export function getUsageStats() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  const recentRequests = RATE_LIMIT.requests.filter(time => time > oneMinuteAgo);
  
  return {
    requestsInLastMinute: recentRequests.length,
    remainingRequests: Math.max(0, RATE_LIMIT.maxRequestsPerMinute - recentRequests.length),
    isGeminiAvailable: !!genAI
  };
}