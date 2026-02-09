import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { withRef } from "../lib/referralTracking";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Zap,
  Users,
  Shield,
  Heart,
  Star,
  Award,
  Trophy,
  TrendingUp,
  Sparkles,
  Mail,
  Phone,
  Video,
  FileText,
  Search,
  HelpCircle,
  Book,
  Headphones,
  Bell,
} from "lucide-react";
import { Header } from "../components/Header";
import Footer from "../components/Footer";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "../components/ui/Button";
export default function Support() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const goToSignup = () => navigate(withRef('/signup'));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ticketsResolved, setTicketsResolved] = useState(0);
  const supportChannels = [
    {
      icon: Mail,
      title: language === "de" ? "E-Mail Support" : "Email Support",
      description:
        language === "de"
          ? "Antwort innerhalb von 24 Stunden"
          : "Response within 24 hours",
      availability: language === "de" ? "24/7 verfügbar" : "24/7 available",
      color: "blue",
      responseTime: "< 24h",
      xp: "+50 XP",
    },
    {
      icon: MessageSquare,
      title: language === "de" ? "Live Chat" : "Live Chat",
      description:
        language === "de"
          ? "Direkter Chat mit unserem Team"
          : "Direct chat with our team",
      availability: language === "de" ? "Mo-Fr, 9-18 Uhr" : "Mon-Fri, 9am-6pm",
      color: "emerald",
      responseTime: "< 5 min",
      xp: "+100 XP",
    },
    {
      icon: Phone,
      title: language === "de" ? "Telefon" : "Phone",
      description:
        language === "de"
          ? "Persönlicher Support am Telefon"
          : "Personal phone support",
      availability: language === "de" ? "Mo-Fr, 9-18 Uhr" : "Mon-Fri, 9am-6pm",
      color: "purple",
      responseTime: "Sofort",
      xp: "+150 XP",
    },
    {
      icon: Video,
      title: language === "de" ? "Video-Call" : "Video Call",
      description:
        language === "de"
          ? "Bildschirmfreigabe und persönliche Beratung"
          : "Screen sharing and personal consultation",
      availability: language === "de" ? "Nach Vereinbarung" : "By appointment",
      color: "red",
      responseTime: language === "de" ? "Terminbasiert" : "By appointment",
      xp: "+200 XP",
    },
  ];
  const helpCategories = [
    {
      icon: FileText,
      title: language === "de" ? "Erste Schritte" : "Getting Started",
      articles: 12,
      color: "blue",
    },
    {
      icon: Users,
      title: language === "de" ? "Mieterverwaltung" : "Tenant Management",
      articles: 24,
      color: "emerald",
    },
    {
      icon: Book,
      title: language === "de" ? "Finanzen" : "Finances",
      articles: 18,
      color: "amber",
    },
    {
      icon: Shield,
      title:
        language === "de" ? "Sicherheit & Datenschutz" : "Security & Privacy",
      articles: 15,
      color: "red",
    },
  ];
  const stats = [
    {
      icon: CheckCircle2,
      value: "98%",
      label: language === "de" ? "Lösungsrate" : "Resolution Rate",
      color: "emerald",
    },
    {
      icon: Clock,
      value: "< 2h",
      label: language === "de" ? "Ø Reaktionszeit" : "Avg Response Time",
      color: "blue",
    },
    {
      icon: Star,
      value: "4.9/5",
      label:
        language === "de" ? "Kundenzufriedenheit" : "Customer Satisfaction",
      color: "amber",
    },
    {
      icon: Users,
      value: "10k+",
      label: language === "de" ? "Glückliche Nutzer" : "Happy Users",
      color: "purple",
    },
  ];
  const achievements = [
    {
      icon: Trophy,
      title: language === "de" ? "Schnelle Hilfe" : "Quick Help",
      description:
        language === "de" ? "Erstes Ticket gelöst" : "First ticket resolved",
      unlocked: ticketsResolved >= 1,
    },
    {
      icon: Award,
      title: language === "de" ? "Support-Profi" : "Support Pro",
      description:
        language === "de" ? "5 Tickets gelöst" : "5 tickets resolved",
      unlocked: ticketsResolved >= 5,
    },
    {
      icon: Star,
      title: language === "de" ? "Power-User" : "Power User",
      description:
        language === "de" ? "10 Tickets gelöst" : "10 tickets resolved",
      unlocked: ticketsResolved >= 10,
    },
  ];
  const tenantPortalFeatures = [
    {
      icon: MessageSquare,
      title: language === "de" ? "Direkter Kontakt" : "Direct Contact",
      description:
        language === "de"
          ? "Mieter können direkt Tickets erstellen und mit Ihnen kommunizieren"
          : "Tenants can create tickets directly and communicate with you",
    },
    {
      icon: FileText,
      title: language === "de" ? "Dokumentenzugriff" : "Document Access",
      description:
        language === "de"
          ? "Mieter haben Zugriff auf Verträge, Abrechnungen und wichtige Dokumente"
          : "Tenants have access to contracts, statements and important documents",
    },
    {
      icon: Clock,
      title: language === "de" ? "Zahlungsübersicht" : "Payment Overview",
      description:
        language === "de"
          ? "Transparente Übersicht aller Zahlungen und offenen Beträge"
          : "Transparent overview of all payments and outstanding amounts",
    },
    {
      icon: Bell,
      title: language === "de" ? "Benachrichtigungen" : "Notifications",
      description:
        language === "de"
          ? "Automatische Updates zu wichtigen Ereignissen und Terminen"
          : "Automatic updates on important events and appointments",
    },
  ];
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setTicketsResolved(ticketsResolved + 1);
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-blue-50 flex flex-col">
      {" "}
      <Header />{" "}
      <div className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="max-w-7xl mx-auto">
          {" "}
          {/* Hero Section */}{" "}
          <div className="text-center mb-16 relative">
            {" "}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              {" "}
              <Headphones className="w-64 h-64 text-emerald-600" />{" "}
            </div>{" "}
            <div className="relative">
              {" "}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 font-medium mb-4">
                {" "}
                <Heart className="w-4 h-4" />{" "}
                {language === "de"
                  ? "Wir sind für Sie da"
                  : "We're Here for You"}{" "}
              </div>{" "}
              <h1 className="text-5xl font-bold text-dark mb-6">
                {" "}
                {language === "de"
                  ? "Erstklassiger Support"
                  : "First-Class Support"}{" "}
              </h1>{" "}
              <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                {" "}
                {language === "de"
                  ? "Unser Support-Team steht Ihnen mit Rat und Tat zur Seite. Schnell, kompetent und persönlich."
                  : "Our support team is here to help you. Fast, competent and personal."}{" "}
              </p>{" "}
              <div className="flex items-center justify-center gap-4">
                {" "}
                <Button
                  onClick={() => navigate("/contact")}
                  variant="primary"
                >
                  {" "}
                  {language === "de" ? "Kontakt aufnehmen" : "Contact Us"}{" "}
                </Button>{" "}
                <Button
                  onClick={() => navigate("/tenant-login")}
                  variant="outlined"
                >
                  {" "}
                  {language === "de"
                    ? "Zum Mieterportal"
                    : "To Tenant Portal"}{" "}
                </Button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Stats Section */}{" "}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
            {" "}
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-md p-6 text-center hover:transition-all duration-300 transform hover:-translate-y-1"
                >
                  {" "}
                  <div
                    className={`w-12 h-12 mx-auto rounded flex items-center justify-center mb-3 bg-${stat.color}-100`}
                  >
                    {" "}
                    <Icon className={`w-6 h-6 text-${stat.color}-600`} />{" "}
                  </div>{" "}
                  <div className="text-3xl font-bold text-dark mb-1">
                    {stat.value}
                  </div>{" "}
                  <p className="text-gray-400 text-sm">{stat.label}</p>{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
          {/* Support Channels */}{" "}
          <div className="mb-20">
            {" "}
            <div className="text-center mb-12">
              {" "}
              <h2 className="text-4xl font-bold text-dark mb-4">
                {" "}
                {language === "de"
                  ? "Wie möchten Sie Kontakt aufnehmen?"
                  : "How Would You Like to Get in Touch?"}{" "}
              </h2>{" "}
              <p className="text-lg text-gray-400">
                {" "}
                {language === "de"
                  ? "Wählen Sie Ihren bevorzugten Kommunikationskanal"
                  : "Choose your preferred communication channel"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {" "}
              {supportChannels.map((channel, index) => {
                const Icon = channel.icon;
                return (
                  <div
                    key={index}
                    onClick={() => handleCategoryClick(channel.title)}
                    className={`bg-white rounded-md p-6 cursor-pointer transition-all duration-300 hover:hover:-translate-y-2 border-2 ${selectedCategory === channel.title ? "border-emerald-500" : "border-transparent"}`}
                  >
                    {" "}
                    <div className="relative">
                      {" "}
                      <div
                        className={`w-14 h-14 rounded flex items-center justify-center mb-4 bg-${channel.color}-100`}
                      >
                        {" "}
                        <Icon
                          className={`w-7 h-7 text-${channel.color}-600`}
                        />{" "}
                      </div>{" "}
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">
                        {" "}
                        {channel.xp}{" "}
                      </div>{" "}
                    </div>{" "}
                    <h3 className="text-xl font-bold text-dark mb-2">
                      {channel.title}
                    </h3>{" "}
                    <p className="text-gray-400 text-sm mb-4">
                      {channel.description}
                    </p>{" "}
                    <div className="space-y-2">
                      {" "}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        {" "}
                        <Clock className="w-4 h-4" />{" "}
                        {channel.availability}{" "}
                      </div>{" "}
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                        {" "}
                        <Zap className="w-4 h-4" /> {channel.responseTime}{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
          </div>{" "}
          {/* Tenant Portal Section */}{" "}
          <div className="bg-gradient-to-br from-emerald-600 to-primary-blue rounded-full p-12 mb-20 relative overflow-hidden">
            {" "}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full -mr-48 -mt-48"></div>{" "}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-32 -mb-32"></div>{" "}
            <div className="relative">
              {" "}
              <div className="text-center mb-12">
                {" "}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white font-medium mb-4">
                  {" "}
                  <Users className="w-4 h-4" />{" "}
                  {language === "de" ? "Mieterportal" : "Tenant Portal"}{" "}
                </div>{" "}
                <h2 className="text-4xl font-bold text-white mb-4">
                  {" "}
                  {language === "de"
                    ? "Selbstbedienung für Ihre Mieter"
                    : "Self-Service for Your Tenants"}{" "}
                </h2>{" "}
                <p className="text-emerald-100 text-lg max-w-3xl mx-auto">
                  {" "}
                  {language === "de"
                    ? "Geben Sie Ihren Mietern die Möglichkeit, selbstständig Anfragen zu stellen und Informationen abzurufen."
                    : "Give your tenants the ability to make inquiries and retrieve information independently."}{" "}
                </p>{" "}
              </div>{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {" "}
                {tenantPortalFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-sm rounded-md p-6 hover:bg-white/20 transition-all duration-300"
                    >
                      {" "}
                      <div className="flex items-start gap-4">
                        {" "}
                        <div className="w-12 h-12 rounded flex items-center justify-center bg-white/20 flex-shrink-0">
                          {" "}
                          <Icon className="w-6 h-6 text-white" />{" "}
                        </div>{" "}
                        <div>
                          {" "}
                          <h3 className="text-lg font-bold text-white mb-2">
                            {feature.title}
                          </h3>{" "}
                          <p className="text-emerald-100 text-sm">
                            {feature.description}
                          </p>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>
                  );
                })}{" "}
              </div>{" "}
              <div className="text-center">
                {" "}
                <Button
                  onClick={() => navigate("/tenant-login")}
                  variant="outlined"
                >
                  {" "}
                  {language === "de"
                    ? "Zum Mieterportal"
                    : "Go to Tenant Portal"}{" "}
                </Button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Help Center */}{" "}
          <div className="mb-20">
            {" "}
            <div className="text-center mb-12">
              {" "}
              <h2 className="text-4xl font-bold text-dark mb-4">
                {" "}
                {language === "de" ? "Hilfe-Center" : "Help Center"}{" "}
              </h2>{" "}
              <p className="text-lg text-gray-400">
                {" "}
                {language === "de"
                  ? "Finden Sie Antworten auf die häufigsten Fragen"
                  : "Find answers to the most common questions"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {" "}
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-md p-6 cursor-pointer transition-all duration-300 hover:hover:-translate-y-2 border-2 border-transparent hover:border-${category.color}-500`}
                  >
                    {" "}
                    <div
                      className={`w-12 h-12 rounded flex items-center justify-center mb-4 bg-${category.color}-100`}
                    >
                      {" "}
                      <Icon
                        className={`w-6 h-6 text-${category.color}-600`}
                      />{" "}
                    </div>{" "}
                    <h3 className="text-lg font-bold text-dark mb-2">
                      {category.title}
                    </h3>{" "}
                    <p className="text-gray-400 text-sm">
                      {" "}
                      {category.articles}{" "}
                      {language === "de" ? "Artikel" : "Articles"}{" "}
                    </p>{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
            <div className="bg-white rounded-md p-8">
              {" "}
              <div className="flex items-center gap-4">
                {" "}
                <div className="flex-1">
                  {" "}
                  <div className="relative">
                    {" "}
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" />{" "}
                    <input
                      type="text"
                      placeholder={
                        language === "de"
                          ? "Wie können wir Ihnen helfen?"
                          : "How can we help you?"
                      }
                      className="w-full pl-12 pr-4 py-4 border-2 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-lg"
                    />{" "}
                  </div>{" "}
                </div>{" "}
                <Button variant="primary">
                  {" "}
                  {language === "de" ? "Suchen" : "Search"}{" "}
                </Button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Achievements Section */}{" "}
          <div className="bg-white rounded-lg p-12 mb-20">
            {" "}
            <div className="text-center mb-12">
              {" "}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 font-medium mb-4">
                {" "}
                <Trophy className="w-4 h-4" />{" "}
                {language === "de" ? "Ihre Erfolge" : "Your Achievements"}{" "}
              </div>{" "}
              <h2 className="text-3xl font-bold text-dark mb-4">
                {" "}
                {language === "de" ? "Support-Level" : "Support Level"}{" "}
              </h2>{" "}
              <p className="text-lg text-gray-400">
                {" "}
                {language === "de"
                  ? "Sammeln Sie Erfahrungspunkte und schalten Sie Erfolge frei!"
                  : "Collect experience points and unlock achievements!"}{" "}
              </p>{" "}
            </div>{" "}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {" "}
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={index}
                    className={`rounded-md p-6 transition-all duration-300 ${achievement.unlocked ? "bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-400" : "bg-gray-50 border-2 opacity-50"}`}
                  >
                    {" "}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${achievement.unlocked ? "bg-amber-400" : "bg-gray-200"}`}
                    >
                      {" "}
                      <Icon className="w-8 h-8 text-white" />{" "}
                    </div>{" "}
                    <h3 className="text-lg font-bold text-dark text-center mb-2">
                      {" "}
                      {achievement.title}{" "}
                    </h3>{" "}
                    <p className="text-sm text-gray-400 text-center">
                      {achievement.description}
                    </p>{" "}
                  </div>
                );
              })}{" "}
            </div>{" "}
            <div className="mt-8 text-center">
              {" "}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-full">
                {" "}
                <TrendingUp className="w-5 h-5 text-gray-400" />{" "}
                <span className="font-semibold text-gray-400">
                  {" "}
                  {ticketsResolved} / 10{" "}
                  {language === "de"
                    ? "Tickets gelöst"
                    : "Tickets resolved"}{" "}
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Final CTA */}{" "}
          <div className="text-center">
            {" "}
            <h2 className="text-3xl font-bold text-dark mb-4">
              {" "}
              {language === "de"
                ? "Haben Sie noch Fragen?"
                : "Do You Still Have Questions?"}{" "}
            </h2>{" "}
            <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
              {" "}
              {language === "de"
                ? "Unser Support-Team ist bereit, Ihnen zu helfen. Wir freuen uns auf Ihre Anfrage!"
                : "Our support team is ready to help you. We look forward to your inquiry!"}{" "}
            </p>{" "}
            <div className="flex items-center justify-center gap-4">
              {" "}
              <Button
                onClick={() => navigate("/contact")}
                variant="primary"
              >
                {" "}
                {language === "de"
                  ? "Jetzt Support kontaktieren"
                  : "Contact Support Now"}{" "}
              </Button>{" "}
              <Button
                onClick={goToSignup}
                variant="outlined"
              >
                {" "}
                {language === "de" ? "Kostenlos starten" : "Start Free"}{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <Footer />{" "}
    </div>
  );
}
