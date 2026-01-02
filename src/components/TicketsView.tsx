import { useState, useEffect } from "react";
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import TicketModal from "./TicketModal";
import TicketDetails from "./TicketDetails";
import { PremiumFeatureGuard } from "./PremiumFeatureGuard";
interface Property {
  id: string;
  name: string;
}
interface Tenant {
  id: string;
  first_name: string;
  last_name: string;
}
interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  created_by_name: string | null;
  ticket_type?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  properties?: { name: string };
  tenants?: { first_name: string; last_name: string } | null;
}
export default function TicketsView() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  useEffect(() => {
    loadData();
  }, [user]);
  const loadData = async () => {
    if (!user) return;
    try {
      const [ticketsRes, propertiesRes, tenantsRes] = await Promise.all([
        supabase
          .from("tickets")
          .select("*, properties(name), tenants(first_name, last_name)")
          .eq("user_id", user.id)
          .order("status", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase.from("properties").select("id, name").eq("user_id", user.id),
        supabase
          .from("tenants")
          .select("id, first_name, last_name")
          .eq("user_id", user.id),
      ]);
      setTickets(ticketsRes.data || []);
      setProperties(propertiesRes.data || []);
      setTenants(tenantsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "closed":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-300" />;
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "Offen";
      case "in_progress":
        return "In Bearbeitung";
      case "closed":
        return "Geschlossen";
      default:
        return status;
    }
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-gray-50 text-dark";
      default:
        return "bg-gray-50 text-dark";
    }
  };
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "Dringend";
      case "high":
        return "Hoch";
      case "medium":
        return "Mittel";
      case "low":
        return "Niedrig";
      default:
        return priority;
    }
  };
  const filteredTickets = tickets.filter((ticket) => {
    if (filterStatus === "all") return true;
    return ticket.status === filterStatus;
  });
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        {" "}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue"></div>{" "}
      </div>
    );
  }
  if (showDetails && selectedTicket) {
    return (
      <TicketDetails
        ticket={selectedTicket}
        onBack={() => {
          setShowDetails(false);
          setSelectedTicket(null);
          loadData();
        }}
      />
    );
  }
  return (
    <PremiumFeatureGuard featureName="Ticketsystem">
      {" "}
      <div>
        {" "}
        <div className="flex justify-between items-start gap-6 mb-8">
          {" "}
          <div className="flex-1">
            {" "}
            <h1 className="text-3xl font-bold text-dark mb-2">Tickets</h1>{" "}
            <p className="text-gray-400">
              Verwalten Sie Anfragen und Nachrichten Ihrer Mieter
            </p>{" "}
          </div>{" "}
          <button
            onClick={() => {
              setSelectedTicket(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-all hover:flex-shrink-0"
          >
            {" "}
            <Plus className="w-5 h-5" /> Ticket erstellen{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex gap-2 mb-6">
          {" "}
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "all" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            Alle{" "}
          </button>{" "}
          <button
            onClick={() => setFilterStatus("open")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "open" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            Offen{" "}
          </button>{" "}
          <button
            onClick={() => setFilterStatus("in_progress")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "in_progress" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            In Bearbeitung{" "}
          </button>{" "}
          <button
            onClick={() => setFilterStatus("closed")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === "closed" ? "bg-primary-blue text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}
          >
            {" "}
            Geschlossen{" "}
          </button>{" "}
        </div>{" "}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded shadow-sm p-12 text-center">
            {" "}
            <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />{" "}
            <h3 className="text-xl font-semibold text-dark mb-2">
              {" "}
              {filterStatus === "all"
                ? "Noch keine Tickets"
                : "Keine Tickets gefunden"}{" "}
            </h3>{" "}
            <p className="text-gray-400 mb-6">
              {" "}
              {filterStatus === "all"
                ? "Erstellen Sie Ihr erstes Ticket oder warten Sie auf Anfragen von Mietern."
                : `Es gibt keine Tickets mit dem Status "${getStatusLabel(filterStatus)}".`}{" "}
            </p>{" "}
            {filterStatus === "all" && (
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-blue text-white rounded-full font-medium hover:bg-primary-blue transition-colors"
              >
                {" "}
                <Plus className="w-5 h-5" /> Erstes Ticket erstellen{" "}
              </button>
            )}{" "}
          </div>
        ) : (
          <div className="space-y-3">
            {" "}
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowDetails(true);
                }}
                className="bg-white rounded shadow-sm p-6 hover:transition-shadow cursor-pointer"
              >
                {" "}
                <div className="flex items-start justify-between">
                  {" "}
                  <div className="flex items-start gap-4 flex-1">
                    {" "}
                    {getStatusIcon(ticket.status)}{" "}
                    <div className="flex-1">
                      {" "}
                      <div className="flex items-center gap-3 mb-2">
                        {" "}
                        <span className="text-sm font-medium text-gray-300">
                          {" "}
                          {ticket.ticket_number}{" "}
                        </span>{" "}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}
                        >
                          {" "}
                          {getPriorityLabel(ticket.priority)}{" "}
                        </span>{" "}
                      </div>{" "}
                      <h3 className="text-lg font-semibold text-dark mb-2">
                        {" "}
                        {ticket.subject}{" "}
                      </h3>{" "}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {" "}
                        {ticket.ticket_type === "contact" ? (
                          <>
                            {" "}
                            <span className="inline-flex items-center px-2 py-1 bg-primary-blue/10 text-primary-blue rounded-full text-xs font-medium">
                              {" "}
                              Kontaktanfrage{" "}
                            </span>{" "}
                            <span>•</span> <span>{ticket.contact_name}</span>{" "}
                            <span>•</span>{" "}
                            <span>{ticket.contact_email}</span>{" "}
                          </>
                        ) : (
                          <>
                            {" "}
                            <span>{ticket.properties?.name}</span>{" "}
                            {ticket.tenants && (
                              <>
                                {" "}
                                <span>•</span>{" "}
                                <span>
                                  {" "}
                                  {ticket.tenants.first_name}{" "}
                                  {ticket.tenants.last_name}{" "}
                                </span>{" "}
                              </>
                            )}{" "}
                          </>
                        )}{" "}
                        <span>•</span>{" "}
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString(
                            "de-DE",
                          )}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="text-right">
                    {" "}
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${ticket.status === "open" ? "bg-red-100 text-red-800" : ticket.status === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {" "}
                      {getStatusLabel(ticket.status)}{" "}
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            ))}{" "}
          </div>
        )}{" "}
        {showModal && (
          <TicketModal
            ticket={selectedTicket}
            properties={properties}
            tenants={tenants}
            onClose={() => {
              setShowModal(false);
              setSelectedTicket(null);
            }}
            onSave={() => {
              setShowModal(false);
              setSelectedTicket(null);
              loadData();
            }}
          />
        )}{" "}
      </div>{" "}
    </PremiumFeatureGuard>
  );
}
