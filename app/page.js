'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { CheckIcon, ChartBarIcon, ClockIcon, ShieldCheckIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import DemoModal from '@/components/DemoModal'

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      }
    }
    checkAuth()
  }, [])

  const features = [
    {
      icon: SparklesIcon,
      title: "AI Sentiment Analysis",
      description: "Know if customers love or hate your product instantly with advanced AI that understands context and emotion."
    },
    {
      icon: ChartBarIcon,
      title: "Visual Analytics",
      description: "Beautiful charts and dashboards that reveal hidden trends and patterns in your customer feedback."
    },
    {
      icon: ClockIcon,
      title: "Save 10+ Hours Weekly",
      description: "Automate feedback analysis that used to take hours. Upload thousands of reviews in seconds."
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Private",
      description: "Enterprise-grade security with row-level data isolation. Your data stays yours, always."
    }
  ]

  const benefits = [
    "Increase customer retention by 25%",
    "Identify issues before they become problems",
    "Turn negative feedback into positive changes",
    "Make data-driven decisions with confidence",
    "Track satisfaction improvements over time",
    "Spot trending topics and concerns instantly"
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "E-commerce Owner",
      company: "TechStyle Boutique",
      content: "FeedbackSense helped us identify delivery issues before they became a major problem. Customer satisfaction up 40%!",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Product Manager",
      company: "InnovateTech",
      content: "The AI sentiment analysis is incredibly accurate. We can now respond to negative feedback within hours instead of weeks.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Restaurant Owner",
      company: "Coastal Cuisine",
      content: "Easy to use and incredibly insightful. The CSV import saved us days of manual work analyzing reviews.",
      rating: 5
    }
  ]

  const faqItems = [
    {
      question: "How accurate is the AI sentiment analysis?",
      answer: "Our AI achieves 94% accuracy in sentiment detection, constantly learning from patterns in your specific industry and feedback types."
    },
    {
      question: "Can I import existing feedback from other platforms?",
      answer: "Yes! Import from CSV files, connect APIs, or manually add feedback. We support data from all major review platforms and survey tools."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade security with encryption, row-level security, and strict data isolation. Your data is never shared or used for training."
    },
    {
      question: "How quickly can I get started?",
      answer: "Setup takes less than 2 minutes. Simply sign up, import your feedback, and start getting insights immediately."
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">FeedbackSense</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Login
              </Link>
              <Link 
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Customer Feedback Into Business Growth
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              AI-powered analytics that turn complaints into opportunities and reviews into revenue. 
              Know what your customers really think in seconds, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link 
                href="/signup"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button
                onClick={() => setShowDemo(true)}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Watch Demo
              </button>
            </div>
            <p className="text-blue-200">
              Join 500+ businesses already growing with FeedbackSense • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stop Guessing What Your Customers Think
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Are you struggling with scattered feedback that's impossible to analyze?
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Drowning in scattered feedback from emails, reviews, and social media?",
              "Can't tell if customers are happy or about to churn?", 
              "Missing patterns that could grow your business?",
              "Spending hours manually analyzing sentiment?"
            ].map((problem, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="text-red-500 text-4xl mb-4">😩</div>
                <p className="text-gray-700 font-medium">{problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One Platform. All Your Feedback. Instant Insights.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              FeedbackSense transforms chaos into clarity with AI-powered analysis
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Get from feedback chaos to actionable insights in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Import Your Feedback",
                description: "Upload CSV files, connect APIs, or manually add feedback from any source - reviews, emails, surveys, social media.",
                icon: "📁"
              },
              {
                step: "2", 
                title: "AI Analyzes Everything",
                description: "Our advanced AI instantly analyzes sentiment, extracts topics, and identifies patterns across all your feedback.",
                icon: "🤖"
              },
              {
                step: "3",
                title: "Get Actionable Insights", 
                description: "View beautiful charts, spot trends, and get recommendations to improve customer satisfaction.",
                icon: "📊"
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You'll Achieve
            </h2>
            <p className="text-xl text-gray-600">Real results that impact your bottom line</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-4">
                <CheckIcon className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
                <span className="text-lg text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Business Owners
            </h2>
            <p className="text-xl text-gray-600">See how FeedbackSense transforms businesses</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">⭐</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Start free, scale as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                description: "Perfect for getting started",
                features: ["Up to 100 feedback entries", "Basic sentiment analysis", "Simple analytics", "Email support"],
                cta: "Start Free",
                popular: false
              },
              {
                name: "Pro", 
                price: "$19",
                description: "Everything you need to grow",
                features: ["Unlimited feedback", "Advanced AI analysis", "Full analytics suite", "CSV import/export", "Priority support", "Custom categories"],
                cta: "Start Free Trial",
                popular: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "For large teams and organizations",
                features: ["Everything in Pro", "API access", "Custom integrations", "Team collaboration", "Dedicated support", "SLA guarantee"],
                cta: "Contact Sales",
                popular: false
              }
            ].map((plan, index) => (
              <div key={index} className={`relative p-8 border rounded-lg ${plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    {plan.price}
                    {plan.price !== "Custom" && <span className="text-lg text-gray-600">/month</span>}
                  </div>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-2">
                        <CheckIcon className="h-5 w-5 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                    className={`block w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      plan.popular 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-blue-600 text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Understand Your Customers?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of businesses making smarter decisions with customer feedback insights
          </p>
          <Link 
            href="/signup"
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center"
          >
            Start Your Free Trial - No Credit Card Required
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
          <p className="text-blue-200 mt-4">Setup takes 2 minutes • Cancel anytime • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">FeedbackSense</h3>
              <p className="text-gray-400">Transform customer feedback into business growth with AI-powered analytics.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FeedbackSense. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  )
}
