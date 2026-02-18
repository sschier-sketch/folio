import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import CmsPageWrapper from "../components/CmsPageWrapper";

export function AVV() {
  return (
    <>
      <SeoHead />
      <div>
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <Shield className="w-3.5 h-3.5 text-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Rechtliches
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Auftragsverarbeitungsvereinbarung
            </h1>
            <p className="mt-4 text-gray-500 text-lg">
              Gemäß Art. 28 DSGVO — Stand: Februar 2026
            </p>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-[800px] mx-auto">
            <CmsPageWrapper slug="avv" fallback={<AVVFallbackContent />} />

            <div className="mt-16 pt-8 border-t border-gray-200">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#3c8af7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function AVVFallbackContent() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">Präambel</h2>
        <p className="text-gray-600 leading-relaxed">
          Diese Vereinbarung regelt die Auftragsverarbeitung personenbezogener Daten durch die sober care GmbH
          (nachfolgend "Auftragsverarbeiter") im Auftrag des Kunden (nachfolgend "Verantwortlicher") gemäß
          Art. 28 der Datenschutz-Grundverordnung (DSGVO).
        </p>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter verarbeitet personenbezogene Daten nur im Rahmen der dokumentierten
          Weisungen des Verantwortlichen, es sei denn, er ist durch das Recht der Union oder der
          Mitgliedstaaten, dem der Auftragsverarbeiter unterliegt, hierzu verpflichtet.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">1. Gegenstand und Dauer der Auftragsverarbeitung</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">1.1 Gegenstand</h3>
        <p className="text-gray-600 leading-relaxed">
          Gegenstand der Auftragsverarbeitung ist die Bereitstellung einer cloudbasierten
          Immobilienverwaltungssoftware (Software-as-a-Service). Der Auftragsverarbeiter erbringt für den
          Verantwortlichen folgende Leistungen:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Hosting und Betrieb der Softwareplattform</li>
          <li>Speicherung und Verarbeitung von Immobilien- und Mieterdaten</li>
          <li>Bereitstellung von Analyse- und Reporting-Funktionen</li>
          <li>Technischer Support und Wartung</li>
          <li>Datensicherung und -wiederherstellung</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">1.2 Dauer</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Laufzeit dieser Vereinbarung entspricht der Laufzeit des Hauptvertrags zwischen dem
          Verantwortlichen und dem Auftragsverarbeiter.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">2. Art und Zweck der Verarbeitung</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">2.1 Art der Verarbeitung</h3>
        <p className="text-gray-600 leading-relaxed">Der Auftragsverarbeiter führt folgende Verarbeitungstätigkeiten durch:</p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Erhebung, Erfassung und Speicherung</li>
          <li>Organisation und Strukturierung</li>
          <li>Aufbewahrung und Anpassung</li>
          <li>Auslesen, Abfragen und Verwendung</li>
          <li>Übermittlung durch Bereitstellung</li>
          <li>Abgleich und Verknüpfung</li>
          <li>Einschränkung und Löschung</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">2.2 Zweck der Verarbeitung</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Verarbeitung erfolgt ausschließlich zum Zweck der Verwaltung von Immobilien und Mietverhältnissen
          durch den Verantwortlichen sowie zur Erfüllung der vertraglichen Pflichten gegenüber dem
          Verantwortlichen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">3. Kategorien betroffener Personen und Daten</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">3.1 Kategorien betroffener Personen</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Mieter und Mietinteressenten</li>
          <li>Eigentümer von Immobilien</li>
          <li>Mitarbeiter des Verantwortlichen</li>
          <li>Dienstleister und Handwerker</li>
          <li>Kontaktpersonen bei Behörden und Versorgern</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">3.2 Kategorien personenbezogener Daten</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Stammdaten (Name, Adresse, Geburtsdatum)</li>
          <li>Kontaktdaten (E-Mail, Telefon)</li>
          <li>Vertragsdaten (Mietverträge, Vertragskonditionen)</li>
          <li>Zahlungsdaten (Bankverbindungen, Zahlungshistorie)</li>
          <li>Dokumente (Ausweise, Gehaltsnachweise, Schufa-Auskünfte)</li>
          <li>Kommunikationsdaten (Nachrichten, Tickets)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">4. Technische und organisatorische Maßnahmen</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter hat folgende technische und organisatorische Maßnahmen zur Gewährleistung
          eines dem Risiko angemessenen Schutzniveaus getroffen:
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">4.1 Vertraulichkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Zutrittskontrolle: Rechenzentren mit Zugangskontrollen und Überwachungssystemen</li>
          <li>Zugangskontrolle: Mehrfaktor-Authentifizierung für administrative Zugriffe</li>
          <li>Zugriffskontrolle: Rollenbasierte Zugriffsrechte und Berechtigungskonzepte</li>
          <li>Trennungskontrolle: Logische Trennung von Kundendaten</li>
          <li>Pseudonymisierung: Wo möglich werden Daten pseudonymisiert verarbeitet</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">4.2 Integrität (Art. 32 Abs. 1 lit. b DSGVO)</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Weitergabekontrolle: Verschlüsselte Datenübertragung (TLS 1.3)</li>
          <li>Eingabekontrolle: Protokollierung von Datenänderungen</li>
          <li>Transportkontrolle: Verschlüsselte Backups</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">4.3 Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Verfügbarkeitskontrolle: Redundante Systeme und automatisches Failover</li>
          <li>Rasche Wiederherstellbarkeit: Tägliche Backups mit verschlüsselter Speicherung</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">4.4 Verfahren zur regelmäßigen Überprüfung (Art. 32 Abs. 1 lit. d DSGVO)</h3>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Datenschutz-Management: Regelmäßige Überprüfung und Aktualisierung der Maßnahmen</li>
          <li>Incident-Response: Notfallpläne für Datenschutzverletzungen</li>
          <li>Datenschutzfreundliche Voreinstellungen: Privacy by Design und by Default</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">5. Berichtigung, Löschung und Sperrung von Daten</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter darf die zur Verarbeitung überlassenen Daten nicht eigenständig
          berichtigen, löschen oder sperren. Dies erfolgt ausschließlich auf dokumentierte Weisung des
          Verantwortlichen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Der Verantwortliche kann über die Benutzeroberfläche der Software jederzeit selbständig
          Berichtigungen, Löschungen und Sperrungen vornehmen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">6. Unterauftragsverhältnisse</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Verantwortliche erteilt dem Auftragsverarbeiter mit Unterzeichnung dieser Vereinbarung seine
          generelle Genehmigung zur Beauftragung von Subunternehmern (Unterauftragsverarbeiter).
        </p>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter nutzt folgende Unterauftragsverarbeiter:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed mt-2">
          <li>
            <strong className="text-gray-900">Supabase Inc.</strong> — Datenbankhosting und Backend-Services<br/>
            <span className="text-sm text-gray-500 ml-6">Standort: USA (Standardvertragsklauseln gemäß Art. 46 DSGVO)</span>
          </li>
          <li>
            <strong className="text-gray-900">Vercel Inc.</strong> — Hosting der Webanwendung<br/>
            <span className="text-sm text-gray-500 ml-6">Standort: USA (Standardvertragsklauseln gemäß Art. 46 DSGVO)</span>
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-4">
          Der Auftragsverarbeiter verpflichtet sich, den Verantwortlichen über beabsichtigte Änderungen in
          Bezug auf die Hinzuziehung oder die Ersetzung von Unterauftragsverarbeitern zu informieren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">7. Pflichten des Verantwortlichen</h2>
        <p className="text-gray-600 leading-relaxed">Der Verantwortliche ist verpflichtet:</p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Nur rechtmäßig erhobene Daten an den Auftragsverarbeiter zu übermitteln</li>
          <li>Die betroffenen Personen über die Datenverarbeitung zu informieren</li>
          <li>Die Rechtmäßigkeit der Datenverarbeitung sicherzustellen</li>
          <li>Erforderliche Einwilligungen einzuholen, soweit erforderlich</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">8. Mitwirkungspflichten</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter unterstützt den Verantwortlichen mit geeigneten technischen und
          organisatorischen Maßnahmen dabei, seinen Pflichten gemäß Art. 32 bis 36 DSGVO nachzukommen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Soweit der Verantwortliche hierzu verpflichtet ist, unterstützt der Auftragsverarbeiter diesen bei
          der Durchführung von Datenschutz-Folgenabschätzungen und der vorherigen Konsultation der
          Aufsichtsbehörde.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">9. Kontrollrechte des Verantwortlichen</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Verantwortliche hat das Recht, beim Auftragsverarbeiter Kontrollen durchzuführen oder durch
          einen unabhängigen und zur Verschwiegenheit verpflichteten Dritten durchführen zu lassen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter stellt dem Verantwortlichen auf Anfrage alle Informationen zur Verfügung,
          die zum Nachweis der Einhaltung der in diesem Vertrag niedergelegten Pflichten erforderlich sind.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">10. Mitteilung bei Verstößen</h2>
        <p className="text-gray-600 leading-relaxed">
          Der Auftragsverarbeiter benachrichtigt den Verantwortlichen unverzüglich, wenn ihm eine Verletzung
          des Schutzes personenbezogener Daten bekannt wird.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Die Meldung muss mindestens folgende Informationen enthalten:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Beschreibung der Art der Verletzung</li>
          <li>Kategorien und ungefähre Anzahl betroffener Personen und Datensätze</li>
          <li>Name und Kontaktdaten des Datenschutzbeauftragten</li>
          <li>Beschreibung der wahrscheinlichen Folgen</li>
          <li>Beschreibung der ergriffenen oder vorgeschlagenen Maßnahmen</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">11. Löschung und Rückgabe von Daten</h2>
        <p className="text-gray-600 leading-relaxed">
          Nach Beendigung der Vertragsbeziehung löscht der Auftragsverarbeiter alle im Auftrag verarbeiteten
          personenbezogenen Daten und vorhandene Kopien, soweit nicht gesetzliche Aufbewahrungspflichten
          einer Löschung entgegenstehen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Auf Wunsch des Verantwortlichen werden die Daten vor der Löschung in einem gängigen,
          maschinenlesbaren Format zur Verfügung gestellt.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">12. Haftung und Schadensersatz</h2>
        <p className="text-gray-600 leading-relaxed">
          Für Schäden, die der Verantwortliche aufgrund der Auftragsverarbeitung erleidet, haftet der
          Auftragsverarbeiter gemäß den im Hauptvertrag geregelten Haftungsbestimmungen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Bei datenschutzrechtlichen Verstößen haftet der Auftragsverarbeiter gegenüber dem Verantwortlichen
          gemäß Art. 82 DSGVO.
        </p>
      </section>
    </div>
  );
}
