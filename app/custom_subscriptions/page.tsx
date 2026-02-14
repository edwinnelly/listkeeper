"use client";
import { useState } from "react";
import { 
  Check, 
  Crown,
  Zap,
  Star,
  CreditCard,
  Users,
  BarChart,
  Shield,
  FileText,
  DownloadCloud,
  Eye,
  TrendingUp,
  Building2
} from "lucide-react";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  originalPrice: number;
  discountedPrice: number;
  period: string;
  savings: number;
  savingsDuration: string;
  popular?: boolean;
  features: PlanFeature[];
  users: string;
  cta: string;
  icon: any;
  color: string;
}

// =============================================================================
// PRICING PLANS COMPONENT
// =============================================================================

const PricingPlansPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>("essentials");
  const [isProcessing, setIsProcessing] = useState(false);

  // ===========================================================================
  // PLANS DATA
  // ===========================================================================

  const plans: Plan[] = [
    {
      id: "starter",
      name: "Starter",
      originalPrice: 1500,
      discountedPrice: 0,
      period: "month",
      savings: 100,
      savingsDuration: "first 3 months",
      features: [
        { text: "Up to 5 users", included: true },
        { text: "Basic income & expense tracking", included: true },
        { text: "10 invoices per month", included: true },
        { text: "Connect 1 bank account", included: true },
        { text: "Basic reports", included: true },
        { text: "Email support", included: true },
        { text: "Advanced analytics", included: false },
        { text: "Custom branding", included: false },
        { text: "Priority support", included: false },
      ],
      users: "1-5 users",
      cta: "Start Free Trial",
      icon: Building2,
      color: "from-gray-500 to-gray-700"
    },
    {
      id: "essentials",
      name: "Essentials",
      originalPrice: 4500,
      discountedPrice: 2776,
      period: "month",
      savings: 38,
      savingsDuration: "first year",
      popular: true,
      features: [
        { text: "Up to 10 users", included: true },
        { text: "Advanced income & expense tracking", included: true },
        { text: "Unlimited invoices", included: true },
        { text: "Connect up to 5 bank accounts", included: true },
        { text: "Advanced financial reports", included: true },
        { text: "Customizable templates", included: true },
        { text: "Basic analytics", included: true },
        { text: "Phone & email support", included: true },
        { text: "Priority support", included: false },
      ],
      users: "6-10 users",
      cta: "Get Started",
      icon: Zap,
      color: "from-blue-500 to-purple-600"
    },
    {
      id: "growth",
      name: "Growth",
      originalPrice: 9000,
      discountedPrice: 6500,
      period: "month",
      savings: 28,
      savingsDuration: "first year",
      features: [
        { text: "Up to 25 users", included: true },
        { text: "Complete financial management", included: true },
        { text: "Unlimited invoices & estimates", included: true },
        { text: "Connect unlimited bank accounts", included: true },
        { text: "Advanced analytics dashboard", included: true },
        { text: "Custom branding", included: true },
        { text: "Inventory management", included: true },
        { text: "Multi-currency support", included: true },
        { text: "Priority support", included: true },
      ],
      users: "11-25 users",
      cta: "Go Growth",
      icon: TrendingUp,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      originalPrice: 18000,
      discountedPrice: 12500,
      period: "month",
      savings: 30,
      savingsDuration: "first year",
      features: [
        { text: "Unlimited users", included: true },
        { text: "Full suite of financial tools", included: true },
        { text: "Advanced automation", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Custom integrations", included: true },
        { text: "Advanced security & compliance", included: true },
        { text: "White-label solutions", included: true },
        { text: "24/7 premium support", included: true },
        { text: "SLA guarantee", included: true, highlight: true },
      ],
      users: "Unlimited users",
      cta: "Contact Sales",
      icon: Crown,
      color: "from-amber-500 to-orange-600"
    }
  ];

  // ===========================================================================
  // UTILITY FUNCTIONS
  // ===========================================================================

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePayment = async (plan: Plan) => {
    setIsProcessing(true);
    console.log(`Processing payment for plan: ${plan.name}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    // Here you would integrate with your payment gateway
    alert(`Redirecting to payment for ${plan.name} plan...`);
  };

  // ===========================================================================
  // MAIN RENDER
  // ===========================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 shadow-lg">
              <Star className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-semibold text-gray-700">Trusted by 10,000+ Businesses</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Scale your business with our flexible pricing plans. All plans include a 30-day money-back guarantee.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-white/50 shadow-lg">
            <button className="px-6 py-3 rounded-xl font-semibold text-gray-700 transition-all duration-300">
              Monthly
            </button>
            <button className="px-6 py-3 rounded-xl font-semibold text-blue-600 bg-white shadow-sm transition-all duration-300">
              Yearly <span className="text-sm text-green-600 ml-1">(Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const isPopular = plan.popular;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white/80 backdrop-blur-xl rounded-3xl border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                  isPopular 
                    ? 'border-purple-500 shadow-2xl shadow-purple-200/50' 
                    : 'border-white/50 shadow-xl shadow-blue-100/30'
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg">
                      <Star className="h-4 w-4" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className={`p-8 bg-gradient-to-r ${plan.color} rounded-t-3xl text-white`}>
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className="h-8 w-8" />
                    {isPopular && <Crown className="h-6 w-6 text-amber-300" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-white/80 text-sm mb-6">{plan.users}</p>

                  {/* Pricing */}
                  <div className="flex items-end gap-2 mb-2">
                    {plan.discountedPrice > 0 ? (
                      <>
                        <span className="text-4xl font-bold">{formatPrice(plan.discountedPrice)}</span>
                        <span className="text-xl text-white/70 line-through">{formatPrice(plan.originalPrice)}</span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold">Free</span>
                    )}
                    <span className="text-white/70 mb-1">/{plan.period}</span>
                  </div>

                  {/* Savings Badge */}
                  {plan.savings > 0 && (
                    <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold">
                        Save {plan.savings}% ({plan.savingsDuration})
                      </span>
                    </div>
                  )}
                </div>

                {/* Plan Features */}
                <div className="p-8">
                  <div className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
                          feature.highlight 
                            ? 'bg-amber-50 border border-amber-200' 
                            : 'bg-gray-50/50'
                        }`}
                      >
                        {feature.included ? (
                          <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                            feature.highlight ? 'text-amber-600' : 'text-green-500'
                          }`} />
                        ) : (
                          <div className="h-5 w-5 mt-0.5 flex-shrink-0 rounded-full border-2 border-gray-300" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight ? 'text-amber-700 font-semibold' : 'text-gray-700'
                            : 'text-gray-400'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Button */}
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={isProcessing}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                      isPopular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        {plan.cta}
                      </>
                    )}
                  </button>

                  {/* Additional Info */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-500">
                      {plan.id === "starter" ? "No credit card required" : "30-day money-back guarantee"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 p-8 shadow-xl shadow-blue-100/20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare Plan Features
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-6 px-4 text-lg font-semibold text-gray-900">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center py-6 px-4">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">{plan.name}</span>
                        <span className="text-sm text-gray-600">{plan.users}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans[0].features.map((_, featureIndex) => (
                  <tr key={featureIndex} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4 text-gray-700 font-medium">
                      {plans[0].features[featureIndex].text}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="py-4 px-4 text-center">
                        {plan.features[featureIndex].included ? (
                          <Check className="h-6 w-6 text-green-500 mx-auto" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-600 mb-12">Get answers to common questions about our pricing and plans</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                question: "Can I change plans later?",
                answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                question: "Is there a contract or long-term commitment?",
                answer: "No, all plans are month-to-month. Cancel anytime with no hidden fees."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards, bank transfers, and popular payment gateways."
              },
              {
                question: "Do you offer discounts for non-profits?",
                answer: "Yes, we offer special pricing for non-profit organizations. Contact our sales team."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 text-left border border-white/50 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600 text-sm">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlansPage;