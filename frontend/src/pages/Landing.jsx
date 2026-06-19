import { Link } from 'react-router-dom';
import {
  Building2, MessageSquare, Users, BarChart3, Upload,
  Shield, ArrowRight, CheckCircle2, Phone,
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Lead Management',
    description: 'Organize buyer and seller leads with status tracking, filters, and Excel bulk import.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integration',
    description: 'Connect directly with Meta WhatsApp Cloud API to message clients from one dashboard.',
  },
  {
    icon: Upload,
    title: 'Bulk Import',
    description: 'Upload Excel files with name, phone, and location to onboard hundreds of leads instantly.',
  },
  {
    icon: BarChart3,
    title: 'Live Dashboard',
    description: 'Track new leads, active conversations, and pipeline status at a glance.',
  },
  {
    icon: Shield,
    title: 'Template Messaging',
    description: 'Send approved starter templates in bulk and manage compliant WhatsApp outreach.',
  },
  {
    icon: Phone,
    title: 'Conversation History',
    description: 'Full chat threads per lead with incoming and outgoing messages in one place.',
  },
];

const steps = [
  'Import or add property leads',
  'Send starter WhatsApp templates',
  'Reply when clients respond',
  'Track status through closing',
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-gray-900">SeaRock CRM</p>
              <p className="text-xs text-gray-500">Real Estate · Pakistan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-medium text-brand-700 hover:text-brand-800"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-emerald-50" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-brand-100 text-brand-700 text-sm font-medium rounded-full mb-6">
              Built for Real Estate Agencies
            </span>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
              Manage Leads &amp; Close Deals with{' '}
              <span className="text-brand-600">WhatsApp CRM</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              SeaRock CRM helps Pakistani real estate agencies manage property leads,
              send WhatsApp starter messages in bulk, and track every client conversation — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/20"
              >
                Login to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Explore Features
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Lead Tracking', value: 'Full Pipeline' },
              { label: 'Messaging', value: 'Meta WhatsApp' },
              { label: 'Bulk Import', value: 'Excel Upload' },
              { label: 'Chat History', value: 'Per Lead' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/80 backdrop-blur rounded-xl border border-gray-200 p-5 shadow-sm">
                <p className="text-2xl font-bold text-brand-600">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need to Grow</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete CRM workflow designed for real estate teams — from first contact to closed deal.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Simple Workflow, Powerful Results</h2>
              <p className="text-gray-600 mb-8">
                Stop juggling spreadsheets and WhatsApp on your phone. SeaRock CRM centralizes
                your entire sales process so your team can focus on closing deals.
              </p>
              <ul className="space-y-4">
                {steps.map((step, i) => (
                  <li key={step} className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-brand-800 rounded-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">Why SeaRock CRM?</h3>
              <ul className="space-y-4">
                {[
                  'Direct Meta WhatsApp Cloud API integration',
                  'Bulk starter messages to selected leads',
                  'Auto status updates when leads are contacted',
                  'Template management for compliant messaging',
                  'Secure admin login for your team',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-300 shrink-0 mt-0.5" />
                    <span className="text-brand-50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-brand-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Manage Your Leads?</h2>
          <p className="text-brand-100 text-lg mb-8">
            Sign in to your SeaRock CRM dashboard and start connecting with clients today.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors"
          >
            Sign In Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-gray-900">SeaRock CRM</span>
          </div>
          <p className="text-sm text-gray-500">
            Real Estate Customer Relationship Management · Pakistan
          </p>
        </div>
      </footer>
    </div>
  );
}
