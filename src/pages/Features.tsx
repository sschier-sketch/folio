import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, FileText, Wrench, Euro, BarChart3,
  Bell, Shield, Clock, Zap, TrendingUp, Award, CheckCircle2,
  Sparkles, Star, Target
} from 'lucide-react';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { useLanguage } from '../contexts/LanguageContext';

export default function Features() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const features = [
    {
      icon: Building2,
      title: language === 'de' ? 'Immobilienverwaltung' : 'Property Management',
      description: language === 'de'
        ? 'Verwalten Sie alle Ihre Immobilien an einem Ort. Mit detaillierten Informationen, Dokumenten und Übersichten.'
        : 'Manage all your properties in one place. With detailed information, documents and overviews.',
      benefit: language === 'de' ? '70% weniger Zeitaufwand' : '70% less time spent',
      color: 'blue',
      achievement: 'property-master'
    },
    {
      icon: Users,
      title: language === 'de' ? 'Mieterverwaltung' : 'Tenant Management',
      description: language === 'de'
        ? 'Komplette Übersicht über alle Mieter, Verträge und Kommunikation. Mieterportal inklusive.'
        : 'Complete overview of all tenants, contracts and communication. Tenant portal included.',
      benefit: language === 'de' ? '100% digitale Kommunikation' : '100% digital communication',
      color: 'emerald',
      achievement: 'tenant-pro'
    },
    {
      icon: Euro,
      title: language === 'de' ? 'Finanzübersicht' : 'Financial Overview',
      description: language === 'de'
        ? 'Automatische Mietverfolgung, Ausgaben und detaillierte Finanzanalysen. Immer den Überblick behalten.'
        : 'Automatic rent tracking, expenses and detailed financial analyses. Always stay on top.',
      benefit: language === 'de' ? '99% Pünktlichkeit bei Zahlungen' : '99% payment punctuality',
      color: 'amber',
      achievement: 'finance-wizard'
    },
    {
      icon: Wrench,
      title: language === 'de' ? 'Ticketsystem' : 'Ticket System',
      description: language === 'de'
        ? 'Professionelles Ticket-Management für alle Anfragen und Reparaturen. Mit Status-Tracking.'
        : 'Professional ticket management for all inquiries and repairs. With status tracking.',
      benefit: language === 'de' ? '50% schnellere Bearbeitung' : '50% faster processing',
      color: 'red',
      achievement: 'ticket-hero'
    },
    {
      icon: FileText,
      title: language === 'de' ? 'Vertragsverwaltung' : 'Contract Management',
      description: language === 'de'
        ? 'Digitale Verträge mit automatischen Erinnerungen für Verlängerungen und Mietanpassungen.'
        : 'Digital contracts with automatic reminders for renewals and rent adjustments.',
      benefit: language === 'de' ? 'Keine verpassten Fristen' : 'No missed deadlines',
      color: 'purple',
      achievement: 'contract-expert'
    },
    {
      icon: BarChart3,
      title: language === 'de' ? 'Analysen & Reports' : 'Analytics & Reports',
      description: language === 'de'
        ? 'Detaillierte Auswertungen und Statistiken zu Ihrem Immobilienportfolio. Datenbasierte Entscheidungen.'
        : 'Detailed evaluations and statistics on your property portfolio. Data-driven decisions.',
      benefit: language === 'de' ? '10x bessere Einblicke' : '10x better insights',
      color: 'indigo',
      achievement: 'data-master'
    },
  ];

  const journeySteps = [
    {
      icon: Target,
      title: language === 'de' ? 'Anmelden' : 'Sign Up',
      description: language === 'de' ? 'Kostenloses Konto in 2 Minuten' : 'Free account in 2 minutes',
      reward: '+100 XP'
    },
    {
      icon: Building2,
      title: language === 'de' ? 'Erste Immobilie' : 'First Property',
      description: language === 'de' ? 'Fügen Sie Ihre erste Immobilie hinzu' : 'Add your first property',
      reward: '+250 XP'
    },
    {
      icon: Users,
      title: language === 'de' ? 'Mieter hinzufügen' : 'Add Tenant',
      description: language === 'de' ? 'Laden Sie Ihren ersten Mieter ein' : 'Invite your first tenant',
      reward: '+200 XP'
    },
    {
      icon: Award,
      title: language === 'de' ? 'Profi werden' : 'Become Pro',
      description: language === 'de' ? 'Schalten Sie alle Features frei' : 'Unlock all features',
      reward: '+500 XP + Badge'
    },
  ];

  const handleStepClick = (index: number) => {
    if (!completedSteps.includes(index)) {
      setCompletedSteps([...completedSteps, index]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 flex flex-col">
      <Header />

      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Sparkles className="w-64 h-64 text-primary-blue" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue/10 rounded-full text-primary-blue font-medium mb-4">
                <Zap className="w-4 h-4" />
                {language === 'de' ? 'Alle Features im Überblick' : 'All Features at a Glance'}
              </div>
              <h1 className="text-5xl font-bold text-dark mb-6">
                {language === 'de'
                  ? 'Immobilienverwaltung neu gedacht'
                  : 'Property Management Reimagined'}
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                {language === 'de'
                  ? 'Entdecken Sie die moderne Art der Immobilienverwaltung. Einfach, effizient und digital.'
                  : 'Discover the modern way of property management. Simple, efficient and digital.'}
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-primary-blue text-white rounded-full font-semibold hover:bg-primary-blue transition-all duration-200 hover:"
                >
                  {language === 'de' ? 'Jetzt starten - Kostenlos' : 'Start Now - Free'}
                </button>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-8 py-4 bg-white text-gray-400 rounded font-semibold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-100"
                >
                  {language === 'de' ? 'Preise ansehen' : 'View Pricing'}
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isHovered = hoveredFeature === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredFeature(index)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`bg-white rounded-md p-8 border-2 transition-all duration-300 cursor-pointer ${
                    isHovered
                      ? 'border-blue-500 transform -translate-y-2'
                      : 'border-transparent hover:border-gray-100'
                  }`}
                >
                  <div className={`w-16 h-16 rounded flex items-center justify-center mb-4 transition-transform duration-300 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  } bg-${feature.color}-100`}>
                    <Icon className={`w-8 h-8 text-${feature.color}-600`} />
                  </div>

                  <h3 className="text-xl font-bold text-dark mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-4 leading-relaxed">{feature.description}</p>

                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="font-semibold text-emerald-600">{feature.benefit}</span>
                  </div>

                  {isHovered && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-amber-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {language === 'de' ? 'Achievement freigeschaltet!' : 'Achievement unlocked!'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Journey Section */}
          <div className="bg-gradient-to-br from-primary-blue to-primary-blue rounded-full p-12 mb-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -ml-48 -mb-48"></div>

            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium mb-4">
                  <Star className="w-4 h-4" />
                  {language === 'de' ? 'Ihre Reise zur perfekten Verwaltung' : 'Your Journey to Perfect Management'}
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  {language === 'de' ? 'In 4 Schritten zum Erfolg' : 'Success in 4 Steps'}
                </h2>
                <p className="text-primary-blue/20 text-lg">
                  {language === 'de'
                    ? 'Sammeln Sie XP und schalten Sie Achievements frei!'
                    : 'Collect XP and unlock achievements!'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {journeySteps.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps.includes(index);

                  return (
                    <div
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`bg-white/10 backdrop-blur-sm rounded-md p-6 cursor-pointer transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-2 border-emerald-400'
                          : 'hover:bg-white/20 border-2 border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <div className={`w-12 h-12 rounded flex items-center justify-center mb-4 transition-all duration-300 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-white/20'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          ) : (
                            <Icon className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                          {step.reward}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                      <p className="text-primary-blue/20 text-sm">{step.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="text-center mt-12">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-white text-primary-blue rounded-full font-bold hover:bg-primary-blue/5 transition-all duration-200 hover:"
                >
                  {language === 'de' ? 'Jetzt Journey starten!' : 'Start Journey Now!'}
                </button>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-md p-8 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">100%</h3>
              <p className="text-gray-400">
                {language === 'de' ? 'DSGVO-konform & sicher' : 'GDPR compliant & secure'}
              </p>
            </div>

            <div className="bg-white rounded-md p-8 text-center">
              <div className="w-16 h-16 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">24/7</h3>
              <p className="text-gray-400">
                {language === 'de' ? 'Support & Verfügbarkeit' : 'Support & Availability'}
              </p>
            </div>

            <div className="bg-white rounded-md p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">4.9/5</h3>
              <p className="text-gray-400">
                {language === 'de' ? 'Kundenbewertung' : 'Customer Rating'}
              </p>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-white rounded-lg p-12">
            <h2 className="text-3xl font-bold text-dark mb-4">
              {language === 'de'
                ? 'Bereit für die moderne Immobilienverwaltung?'
                : 'Ready for Modern Property Management?'}
            </h2>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {language === 'de'
                ? 'Starten Sie noch heute kostenlos und erleben Sie, wie einfach Immobilienverwaltung sein kann.'
                : 'Start for free today and experience how simple property management can be.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-primary-blue text-white rounded-full font-semibold hover:bg-primary-blue transition-all duration-200 hover:flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {language === 'de' ? 'Kostenlos starten' : 'Start Free'}
              </button>
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-white text-gray-400 rounded font-semibold hover:bg-gray-50 transition-all duration-200 border-2 border-gray-100"
              >
                {language === 'de' ? 'Kontakt aufnehmen' : 'Contact Us'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
