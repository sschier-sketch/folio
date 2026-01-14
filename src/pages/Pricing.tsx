import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Zap,
  Sparkles,
  TrendingUp,
  Award,
  Gift,
  Crown,
  Rocket,
  Star,
  Users,
  Building2,
  Shield,
  Heart,
} from "lucide-react";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../contexts/LanguageContext";
export default function Pricing() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const savings = billingCycle === "yearly" ? "30% sparen" : "";
  const plans = [
    {
      id: "starter",
      name: language === "de" ? "Starter" : "Starter",
      icon: Rocket,
      description:
        language === "de"
          ? "Perfekt für Einsteiger mit 1-3 Immobilien"
          : "Perfect for beginners with 1-3 properties",
      monthlyPrice: 0,
      yearlyPrice: 0,
      color: "slate",
      popular: false,
      badge: null,
      features: [
        {
          text:
            language === "de" ? "Bis zu 3 Immobilien" : "Up to 3 properties",
          included: true,
        },
        {
          text: language === "de" ? "Unbegrenzt Mieter" : "Unlimited tenants",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Basic Finanzübersicht"
              : "Basic financial overview",
          included: true,
        },
        {
          text: language === "de" ? "Ticketsystem" : "Ticket system",
          included: true,
        },
        {
          text: language === "de" ? "Mieterportal" : "Tenant portal",
          included: true,
        },
        {
          text: language === "de" ? "E-Mail Support" : "Email support",
          included: true,
        },
        {
          text:
            language === "de" ? "Erweiterte Analysen" : "Advanced analytics",
          included: false,
        },
        {
          text: language === "de" ? "Prioritäts-Support" : "Priority support",
          included: false,
        },
        {
          text: language === "de" ? "API-Zugang" : "API access",
          included: false,
        },
      ],
      xp: "+100 XP",
      achievement: "starter-badge",
    },
    {
      id: "pro",
      name: "Pro",
      icon: Crown,
      description:
        language === "de"
          ? "Ideal für professionelle Verwalter"
          : "Ideal for professional managers",
      monthlyPrice: 12.90,
      yearlyPrice: 108,
      color: "blue",
      popular: true,
      badge: language === "de" ? "Beliebteste Wahl" : "Most Popular",
      features: [
        {
          text:
            language === "de" ? "Bis zu 20 Immobilien" : "Up to 20 properties",
          included: true,
        },
        {
          text: language === "de" ? "Unbegrenzt Mieter" : "Unlimited tenants",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Erweiterte Finanzanalysen"
              : "Advanced financial analytics",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Prioritäts-Ticketsystem"
              : "Priority ticket system",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Premium Mieterportal"
              : "Premium tenant portal",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Prioritäts-Support (24h)"
              : "Priority support (24h)",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Detaillierte Reports & Statistiken"
              : "Detailed reports & statistics",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Automatische Erinnerungen"
              : "Automatic reminders",
          included: true,
        },
        {
          text: language === "de" ? "Export-Funktionen" : "Export functions",
          included: true,
        },
        {
          text: language === "de" ? "API-Zugang" : "API access",
          included: false,
        },
      ],
      xp: "+500 XP",
      achievement: "pro-badge",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      icon: Building2,
      description:
        language === "de"
          ? "Für große Portfolios und Unternehmen"
          : "For large portfolios and companies",
      monthlyPrice: 99,
      yearlyPrice: 949,
      color: "amber",
      popular: false,
      badge: language === "de" ? "Beste Performance" : "Best Performance",
      features: [
        {
          text:
            language === "de"
              ? "Unbegrenzt Immobilien"
              : "Unlimited properties",
          included: true,
        },
        {
          text: language === "de" ? "Unbegrenzt Mieter" : "Unlimited tenants",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Premium Finanzanalysen"
              : "Premium financial analytics",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Enterprise Ticketsystem"
              : "Enterprise ticket system",
          included: true,
        },
        {
          text:
            language === "de"
              ? "White-Label Mieterportal"
              : "White-label tenant portal",
          included: true,
        },
        {
          text:
            language === "de"
              ? "VIP Support (2h Reaktionszeit)"
              : "VIP support (2h response)",
          included: true,
        },
        {
          text: language === "de" ? "Individuelle Reports" : "Custom reports",
          included: true,
        },
        {
          text:
            language === "de"
              ? "KI-gestützte Einblicke"
              : "AI-powered insights",
          included: true,
        },
        {
          text: language === "de" ? "Voller API-Zugang" : "Full API access",
          included: true,
        },
        {
          text:
            language === "de"
              ? "Dedizierter Account Manager"
              : "Dedicated account manager",
          included: true,
        },
      ],
      xp: "+1000 XP",
      achievement: "enterprise-badge",
    },
  ];
  const getPrice = (plan: (typeof plans)[0]) => {
    if (plan.monthlyPrice === 0)
      return language === "de" ? "Kostenlos" : "Free";
    const price =
      billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
    return `€${price}`;
  };
  const getPeriod = () => {
    return billingCycle === "monthly"
      ? language === "de"
        ? "/Monat"
        : "/month"
      : language === "de"
        ? "/Jahr"
        : "/year";
  };
  const bonuses = [
    {
      icon: Gift,
      title: language === "de" ? "Willkommensbonus" : "Welcome Bonus",
      description:
        language === "de"
          ? "Erhalten Sie 500 XP bei der Anmeldung"
          : "Get 500 XP on signup",
      color: "emerald",
    },
    {
      icon: Users,
      title: language === "de" ? "Empfehlungsprogramm" : "Referral Program",
      description:
        language === "de"
          ? "Laden Sie Freunde ein und erhalten Sie 1 Monat gratis"
          : "Invite friends and get 1 month free",
      color: "blue",
    },
    {
      icon: Award,
      title: language === "de" ? "Treue-Belohnungen" : "Loyalty Rewards",
      description:
        language === "de"
          ? "Sammeln Sie jeden Monat zusätzliche Boni"
          : "Collect additional bonuses every month",
      color: "amber",
    },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
      {" "}
      <Header />{" "}
      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          {/* Hero Section */}{" "}
          <div className="text-center mb-16">
            {" "}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue/10 rounded-full text-primary-blue font-medium mb-4">
              {" "}
              <Sparkles className="w-4 h-4" />{" "}
              {language === "de"
                ? "Transparente Preise"
                : "Transparent Pricing"}{" "}
            </div>{" "}
            <h1 className="text-5xl font-bold text-dark mb-6">
              {" "}
              {language === "de"
                ? "Der perfekte Plan für Sie"
                : "The Perfect Plan for You"}{" "}
            </h1>{" "}
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              {" "}
              {language === "de"
                ? "Starten Sie kostenlos und upgraden Sie, wenn Ihr Portfolio wächst. Keine versteckten Kosten."
                : "Start for free and upgrade as your portfolio grows. No hidden costs."}{" "}
            </p>{" "}
            {/* Billing Toggle */}{" "}
            <div className="inline-flex items-center gap-4 bg-white rounded-full p-2">
              {" "}
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 ${billingCycle === "monthly" ? "bg-primary-blue text-white " : "text-gray-400 hover:text-dark"}`}
              >
                {" "}
                {language === "de" ? "Monatlich" : "Monthly"}{" "}
              </button>{" "}
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-200 relative ${billingCycle === "yearly" ? "bg-primary-blue text-white " : "text-gray-400 hover:text-dark"}`}
              >
                {" "}
                {language === "de" ? "Jährlich" : "Yearly"}{" "}
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {" "}
                  -30%{" "}
                </span>{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
          {/* Pricing Cards */}{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {" "}
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.id;
              const isPopular = plan.popular;
              return (
                <div
                  key={plan.id}
                  onMouseEnter={() => setSelectedPlan(plan.id)}
                  onMouseLeave={() => setSelectedPlan(null)}
                  className={`relative bg-white rounded-lg p-8 transition-all duration-300 ${isPopular ? "border-4 border-blue-500 scale-105" : isSelected ? "border-2 border-blue-300 transform scale-105" : "border-2 hover:"}`}
                >
                  {" "}
                  {plan.badge && (
                    <div
                      className={`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-sm font-bold text-white ${isPopular ? "bg-primary-blue" : "bg-amber-500"}`}
                    >
                      {" "}
                      <div className="flex items-center gap-1">
                        {" "}
                        <Star className="w-4 h-4" /> {plan.badge}{" "}
                      </div>{" "}
                    </div>
                  )}{" "}
                  <div className="text-center mb-6">
                    {" "}
                    <div
                      className={`w-16 h-16 mx-auto rounded-md flex items-center justify-center mb-4 bg-${plan.color}-100`}
                    >
                      {" "}
                      <Icon className={`w-8 h-8 text-${plan.color}-600`} />{" "}
                    </div>{" "}
                    <h3 className="text-2xl font-bold text-dark mb-2">
                      {plan.name}
                    </h3>{" "}
                    <p className="text-gray-400 text-sm mb-4">
                      {plan.description}
                    </p>{" "}
                    <div className="flex items-baseline justify-center gap-1">
                      {" "}
                      <span className="text-4xl font-bold text-dark">
                        {getPrice(plan)}
                      </span>{" "}
                      {plan.monthlyPrice > 0 && (
                        <span className="text-gray-400">{getPeriod()}</span>
                      )}{" "}
                    </div>{" "}
                    {billingCycle === "yearly" && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-emerald-600 font-semibold mt-2">
                        {" "}
                        {language === "de"
                          ? `Sie sparen €${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(0)} pro Jahr`
                          : `Save €${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(0)} per year`}{" "}
                      </p>
                    )}{" "}
                  </div>{" "}
                  {/* XP Badge */}{" "}
                  <div
                    className={`mb-6 p-3 rounded text-center bg-${plan.color}-50 border border-${plan.color}-200`}
                  >
                    {" "}
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-${plan.color}-700">
                      {" "}
                      <Zap className="w-4 h-4" /> {plan.xp}{" "}
                      <Award className="w-4 h-4" />{" "}
                      {language === "de" ? "Bonus" : "Bonus"}{" "}
                    </div>{" "}
                  </div>{" "}
                  <ul className="space-y-3 mb-8">
                    {" "}
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {" "}
                        {feature.included ? (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-200 flex-shrink-0 mt-0.5" />
                        )}{" "}
                        <span
                          className={
                            feature.included ? "text-gray-400" : "text-gray-300"
                          }
                        >
                          {" "}
                          {feature.text}{" "}
                        </span>{" "}
                      </li>
                    ))}{" "}
                  </ul>{" "}
                  <button
                    onClick={() =>
                      navigate(
                        plan.id === "starter" ? "/signup" : "/subscription",
                      )
                    }
                    className={`w-full py-4 rounded font-bold transition-all duration-200 ${isPopular ? "bg-primary-blue text-white hover:bg-primary-blue hover:" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                  >
                    {" "}
                    {plan.id === "starter"
                      ? language === "de"
                        ? "Kostenlos starten"
                        : "Start Free"
                      : language === "de"
                        ? "Jetzt upgraden"
                        : "Upgrade Now"}{" "}
                  </button>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
          {/* Bonus Section */}{" "}
          <div className="bg-gradient-to-br from-primary-blue to-purple-600 rounded-full p-12 mb-20 relative overflow-hidden">
            {" "}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>{" "}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>{" "}
            <div className="relative">
              {" "}
              <div className="text-center mb-12">
                {" "}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium mb-4">
                  {" "}
                  <Gift className="w-4 h-4" />{" "}
                  {language === "de"
                    ? "Exklusive Boni"
                    : "Exclusive Bonuses"}{" "}
                </div>{" "}
                <h2 className="text-4xl font-bold text-white mb-4">
                  {" "}
                  {language === "de"
                    ? "Mehr als nur Software"
                    : "More Than Just Software"}{" "}
                </h2>{" "}
                <p className="text-primary-blue/20 text-lg">
                  {" "}
                  {language === "de"
                    ? "Profitieren Sie von unserem Belohnungssystem und zusätzlichen Vorteilen"
                    : "Benefit from our rewards system and additional perks"}{" "}
                </p>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {" "}
                {bonuses.map((bonus, index) => {
                  const Icon = bonus.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-md p-6 hover:bg-white/20 transition-all duration-300"
                    >
                      {" "}
                      <div
                        className={`w-12 h-12 rounded flex items-center justify-center mb-4 bg-${bonus.color}-500`}
                      >
                        {" "}
                        <Icon className="w-6 h-6 text-white" />{" "}
                      </div>{" "}
                      <h3 className="text-xl font-bold text-white mb-2">
                        {bonus.title}
                      </h3>{" "}
                      <p className="text-primary-blue/20">
                        {bonus.description}
                      </p>{" "}
                    </div>
                  );
                })}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Trust Section */}{" "}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            {" "}
            <div className="bg-white rounded-md p-6 text-center">
              {" "}
              <Shield className="w-8 h-8 text-emerald-500 mx-auto mb-3" />{" "}
              <p className="text-gray-400 text-sm font-medium">
                {" "}
                {language === "de"
                  ? "30 Tage Geld-zurück-Garantie"
                  : "30-day money-back guarantee"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-md p-6 text-center">
              {" "}
              <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-3" />{" "}
              <p className="text-gray-400 text-sm font-medium">
                {" "}
                {language === "de"
                  ? "Jederzeit kündbar"
                  : "Cancel anytime"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-md p-6 text-center">
              {" "}
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />{" "}
              <p className="text-gray-400 text-sm font-medium">
                {" "}
                {language === "de"
                  ? "Von 10.000+ Nutzern geliebt"
                  : "Loved by 10,000+ users"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-md p-6 text-center">
              {" "}
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-3" />{" "}
              <p className="text-gray-400 text-sm font-medium">
                {" "}
                {language === "de"
                  ? "4.9/5 Sterne Bewertung"
                  : "4.9/5 star rating"}{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* FAQ Section */}{" "}
          <div className="bg-white rounded-lg p-12">
            {" "}
            <h2 className="text-3xl font-bold text-dark mb-8 text-center">
              {" "}
              {language === "de"
                ? "Häufig gestellte Fragen"
                : "Frequently Asked Questions"}{" "}
            </h2>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {" "}
              <div>
                {" "}
                <h3 className="font-bold text-dark mb-2">
                  {" "}
                  {language === "de"
                    ? "Kann ich jederzeit wechseln?"
                    : "Can I switch anytime?"}{" "}
                </h3>{" "}
                <p className="text-gray-400">
                  {" "}
                  {language === "de"
                    ? "Ja! Sie können jederzeit zwischen den Plänen wechseln. Bei einem Upgrade zahlen Sie nur die Differenz."
                    : "Yes! You can switch between plans anytime. When upgrading, you only pay the difference."}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="font-bold text-dark mb-2">
                  {" "}
                  {language === "de"
                    ? "Gibt es versteckte Kosten?"
                    : "Are there hidden costs?"}{" "}
                </h3>{" "}
                <p className="text-gray-400">
                  {" "}
                  {language === "de"
                    ? "Nein! Was Sie sehen ist was Sie bezahlen. Keine Setup-Gebühren, keine versteckten Kosten."
                    : "No! What you see is what you pay. No setup fees, no hidden costs."}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="font-bold text-dark mb-2">
                  {" "}
                  {language === "de"
                    ? "Was passiert beim Downgrade?"
                    : "What happens when I downgrade?"}{" "}
                </h3>{" "}
                <p className="text-gray-400">
                  {" "}
                  {language === "de"
                    ? "Ihre Daten bleiben erhalten. Sie verlieren nur Zugriff auf Premium-Features."
                    : "Your data remains intact. You only lose access to premium features."}{" "}
                </p>{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="font-bold text-dark mb-2">
                  {" "}
                  {language === "de"
                    ? "Wie funktioniert die Bezahlung?"
                    : "How does payment work?"}{" "}
                </h3>{" "}
                <p className="text-gray-400">
                  {" "}
                  {language === "de"
                    ? "Sichere Zahlung per Kreditkarte oder SEPA-Lastschrift. Alle Transaktionen sind verschlüsselt."
                    : "Secure payment via credit card or SEPA direct debit. All transactions are encrypted."}{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Final CTA */}{" "}
          <div className="text-center mt-16">
            {" "}
            <h2 className="text-3xl font-bold text-dark mb-4">
              {" "}
              {language === "de"
                ? "Noch Fragen?"
                : "Still have questions?"}{" "}
            </h2>{" "}
            <p className="text-lg text-gray-400 mb-8">
              {" "}
              {language === "de"
                ? "Unser Team hilft Ihnen gerne bei der Auswahl des richtigen Plans."
                : "Our team is happy to help you choose the right plan."}{" "}
            </p>{" "}
            <button
              onClick={() => navigate("/contact")}
              className="px-8 py-4 bg-white text-gray-400 rounded font-semibold hover:bg-gray-50 transition-all duration-200 border-2 "
            >
              {" "}
              {language === "de" ? "Kontakt aufnehmen" : "Contact Us"}{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />{" "}
    </div>
  );
}
