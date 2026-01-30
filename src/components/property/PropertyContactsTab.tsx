import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit2, Phone, Mail, UserCog } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { PremiumUpgradePrompt } from "../PremiumUpgradePrompt";
import TableActionsDropdown, { ActionItem } from "../common/TableActionsDropdown";

interface PropertyContactsTabProps {
  propertyId: string;
}

interface Contact {
  id: string;
  contact_name: string;
  contact_role: string;
  phone_landline: string | null;
  phone_mobile: string | null;
  email: string | null;
  notes: string | null;
  availability_days: string[] | null;
  availability_time_start: string | null;
  availability_time_end: string | null;
  availability_notes: string | null;
}

interface ContactGroup {
  role: string;
  title: string;
  icon: any;
  color: string;
  bgColor: string;
  contacts: Contact[];
}

export default function PropertyContactsTab({ propertyId }: PropertyContactsTabProps) {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [formData, setFormData] = useState({
    contact_name: "",
    contact_role: "caretaker",
    phone_landline: "",
    phone_mobile: "",
    email: "",
    notes: "",
    availability_days: [] as string[],
    availability_time_start: "",
    availability_time_end: "",
    availability_notes: "",
  });

  useEffect(() => {
    if (user && isPremium) {
      loadContacts();
    }
  }, [user, propertyId, isPremium]);

  async function loadContacts() {
    try {
      setLoading(true);
      const { data } = await supabase
        .from("property_contacts")
        .select("*")
        .eq("property_id", propertyId)
        .order("contact_name");

      if (data) {
        setContacts(data);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setLoading(false);
    }
  }

  const openAddModal = () => {
    setEditingContact(null);
    setFormData({
      contact_name: "",
      contact_role: "caretaker",
      phone_landline: "",
      phone_mobile: "",
      email: "",
      notes: "",
      availability_days: [],
      availability_time_start: "",
      availability_time_end: "",
      availability_notes: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      contact_name: contact.contact_name,
      contact_role: contact.contact_role,
      phone_landline: contact.phone_landline || "",
      phone_mobile: contact.phone_mobile || "",
      email: contact.email || "",
      notes: contact.notes || "",
      availability_days: contact.availability_days || [],
      availability_time_start: contact.availability_time_start || "",
      availability_time_end: contact.availability_time_end || "",
      availability_notes: contact.availability_notes || "",
    });
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!user || !formData.contact_name) {
      alert("Bitte geben Sie mindestens einen Namen ein.");
      return;
    }

    try {
      if (editingContact) {
        const { error } = await supabase
          .from("property_contacts")
          .update({
            contact_name: formData.contact_name,
            contact_role: formData.contact_role,
            phone_landline: formData.phone_landline || null,
            phone_mobile: formData.phone_mobile || null,
            email: formData.email || null,
            notes: formData.notes || null,
            availability_days: formData.availability_days.length > 0 ? formData.availability_days : null,
            availability_time_start: formData.availability_time_start || null,
            availability_time_end: formData.availability_time_end || null,
            availability_notes: formData.availability_notes || null,
          })
          .eq("id", editingContact.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("property_contacts").insert({
          user_id: user.id,
          property_id: propertyId,
          contact_name: formData.contact_name,
          contact_role: formData.contact_role,
          phone_landline: formData.phone_landline || null,
          phone_mobile: formData.phone_mobile || null,
          email: formData.email || null,
          notes: formData.notes || null,
          availability_days: formData.availability_days.length > 0 ? formData.availability_days : null,
          availability_time_start: formData.availability_time_start || null,
          availability_time_end: formData.availability_time_end || null,
          availability_notes: formData.availability_notes || null,
        });

        if (error) throw error;
      }

      setShowAddModal(false);
      loadContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert("Fehler beim Speichern des Kontakts");
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Möchten Sie diesen Kontakt wirklich löschen?")) return;

    try {
      const { error } = await supabase
        .from("property_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Fehler beim Löschen des Kontakts");
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      caretaker: "Hausmeister",
      service_provider: "Dienstleister",
      owner: "Eigentümer",
      manager: "Verwalter",
      other: "Sonstiges",
    };
    return labels[role] || role;
  };

  const contactGroups: ContactGroup[] = [
    {
      role: "caretaker",
      title: "Hausmeister",
      icon: UserCog,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      contacts: contacts.filter((c) => c.contact_role === "caretaker"),
    },
    {
      role: "service_provider",
      title: "Dienstleister",
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      contacts: contacts.filter((c) => c.contact_role === "service_provider"),
    },
    {
      role: "owner",
      title: "Eigentümer",
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      contacts: contacts.filter((c) => c.contact_role === "owner"),
    },
    {
      role: "manager",
      title: "Verwalter",
      icon: Users,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      contacts: contacts.filter((c) => c.contact_role === "manager"),
    },
    {
      role: "other",
      title: "Sonstige Kontakte",
      icon: Users,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      contacts: contacts.filter((c) => c.contact_role === "other"),
    },
  ];

  if (!isPremium) {
    return <PremiumUpgradePrompt featureKey="property_contacts" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-dark">Kontakte</h3>
          <p className="text-sm text-gray-500 mt-1">
            {contacts.length} Kontakt{contacts.length !== 1 ? "e" : ""} gespeichert
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Kontakt hinzufügen
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Noch keine Kontakte für diese Immobilie</p>
          <p className="text-sm text-gray-400 mb-4">
            Speichern Sie Hausmeister, Dienstleister und weitere wichtige Kontakte
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ersten Kontakt hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {contactGroups.map((group) => {
            if (group.contacts.length === 0) return null;

            const Icon = group.icon;

            return (
              <div key={group.role} className="bg-white rounded-lg">
                <div className={`${group.bgColor} px-4 py-3 border-b border-gray-200 flex items-center gap-3 rounded-t-lg`}>
                  <Icon className={`w-5 h-5 ${group.color}`} />
                  <div className="flex-1">
                    <h4 className="font-semibold text-dark">{group.title}</h4>
                    <p className="text-xs text-gray-500">
                      {group.contacts.length} Kontakt{group.contacts.length !== 1 ? "e" : ""}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {group.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h5 className="font-semibold text-dark">{contact.contact_name}</h5>
                          <p className="text-xs text-gray-500 mt-0.5">{getRoleLabel(contact.contact_role)}</p>
                        </div>
                        <TableActionsDropdown
                          actions={[
                            {
                              label: 'Bearbeiten',
                              onClick: () => openEditModal(contact)
                            },
                            {
                              label: 'Löschen',
                              onClick: () => handleDelete(contact.id),
                              variant: 'danger' as const
                            }
                          ]}
                        />
                      </div>

                      <div className="space-y-2 text-sm">
                        {contact.phone_landline && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>Festnetz: {contact.phone_landline}</span>
                          </div>
                        )}
                        {contact.phone_mobile && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>Mobil: {contact.phone_mobile}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {(contact.availability_days?.length || contact.availability_time_start || contact.availability_notes) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Verfügbarkeit</p>
                            {contact.availability_days && contact.availability_days.length > 0 && (
                              <p className="text-xs text-gray-600">
                                {contact.availability_days.map(d => {
                                  const dayLabels: Record<string, string> = {
                                    monday: 'Mo', tuesday: 'Di', wednesday: 'Mi',
                                    thursday: 'Do', friday: 'Fr', saturday: 'Sa', sunday: 'So'
                                  };
                                  return dayLabels[d] || d;
                                }).join(', ')}
                              </p>
                            )}
                            {(contact.availability_time_start || contact.availability_time_end) && (
                              <p className="text-xs text-gray-600">
                                {contact.availability_time_start || '?'} - {contact.availability_time_end || '?'} Uhr
                              </p>
                            )}
                            {contact.availability_notes && (
                              <p className="text-xs text-gray-500 mt-1">{contact.availability_notes}</p>
                            )}
                          </div>
                        )}
                        {contact.notes && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">{contact.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark">
                {editingContact ? "Kontakt bearbeiten" : "Neuer Kontakt"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolle <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contact_role}
                  onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="caretaker">Hausmeister</option>
                  <option value="service_provider">Dienstleister</option>
                  <option value="owner">Eigentümer</option>
                  <option value="manager">Verwalter</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Festnetz
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_landline}
                    onChange={(e) => setFormData({ ...formData, phone_landline: e.target.value })}
                    placeholder="z.B. 030 12345678"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon Mobil
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_mobile}
                    onChange={(e) => setFormData({ ...formData, phone_mobile: e.target.value })}
                    placeholder="z.B. 0171 1234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="beispiel@email.de"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notizen</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Zusätzliche Informationen zum Kontakt"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">Verfügbarkeit</label>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Wochentage</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "monday", label: "Mo" },
                        { value: "tuesday", label: "Di" },
                        { value: "wednesday", label: "Mi" },
                        { value: "thursday", label: "Do" },
                        { value: "friday", label: "Fr" },
                        { value: "saturday", label: "Sa" },
                        { value: "sunday", label: "So" },
                      ].map((day) => (
                        <label
                          key={day.value}
                          className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            formData.availability_days.includes(day.value)
                              ? "bg-blue-100 border-blue-600 text-blue-700"
                              : "bg-white border-gray-300 text-gray-700 hover:border-blue-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={formData.availability_days.includes(day.value)}
                            onChange={(e) => {
                              const newDays = e.target.checked
                                ? [...formData.availability_days, day.value]
                                : formData.availability_days.filter((d) => d !== day.value);
                              setFormData({ ...formData, availability_days: newDays });
                            }}
                          />
                          <span className="text-sm font-medium">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Von</label>
                      <input
                        type="time"
                        value={formData.availability_time_start}
                        onChange={(e) =>
                          setFormData({ ...formData, availability_time_start: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Bis</label>
                      <input
                        type="time"
                        value={formData.availability_time_end}
                        onChange={(e) =>
                          setFormData({ ...formData, availability_time_end: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Verfügbarkeits-Hinweise
                    </label>
                    <textarea
                      value={formData.availability_notes}
                      onChange={(e) =>
                        setFormData({ ...formData, availability_notes: e.target.value })
                      }
                      rows={2}
                      placeholder="z.B. nur nach Terminvereinbarung, Urlaubszeiten, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: "#faf8f8", color: "#000000" }}
                  className="px-4 py-2 rounded-lg font-medium hover:bg-[#bdbfcb] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors"
                >
                  {editingContact ? "Speichern" : "Hinzufügen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
