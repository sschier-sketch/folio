import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import SeoHead from "../components/SeoHead";

export function AGB() {
  return (
    <>
      <SeoHead />
      <div>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-dark">Allgemeine Geschäftsbedingungen (AGB)</h1>
                <p className="text-sm text-gray-500">sober care GmbH für „rentably"</p>
                <p className="text-sm text-gray-500">Stand: Februar 2026</p>
              </div>
            </div>

            <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
              <AGBSection1 />
              <AGBSection2 />
              <AGBSection3 />
              <AGBSection4 />
              <AGBSection5 />
              <AGBSection6 />
              <AGBSection7 />
              <AGBSection8 />
              <AGBSection9 />
              <AGBSection10 />
              <AGBSection11 />
              <AGBSection12 />
              <AGBSection13 />
              <AGBSection14 />
              <AGBSection15 />
              <AGBSection16 />
              <AGBSection17 />
              <AGBSection18 />
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <Link
                to="/"
                className="inline-flex items-center text-primary-blue hover:text-blue-700 transition-colors"
              >
                ← Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AGBSection1() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 1 Allgemeines, Geltungsbereich, Begriffsbestimmungen</h2>
      <p>
        (1) Diese Allgemeinen Geschäftsbedingungen („AGB") gelten für sämtliche Verträge über
        die Nutzung der Software-as-a-Service-Plattform „rentably" sowie aller hiermit
        zusammenhängenden Leistungen der
      </p>
      <p className="font-semibold">
        sober care GmbH, Pappelallee 78/79, 10437 Berlin
      </p>
      <p>(nachfolgend „rentably")</p>
      <p>gegenüber ihren Kunden.</p>
      <p>
        (2) <strong>Kunde</strong> im Sinne dieser AGB ist ausschließlich der <strong>Vermieter</strong> (natürliche oder juristische
        Person), der die Plattform zur Verwaltung eigener oder verwalteter Mietobjekte nutzt. Eine
        Nutzung durch Mieter ist – soweit rentably entsprechende Funktionen bereitstellt (z. B.
        Portal-/Kommunikationszugang) – ausschließlich im Rahmen der vom Kunden veranlassten
        Einbindung und nach Maßgabe dieser AGB zulässig; Mieter werden dadurch nicht
        Vertragspartner von rentably, sofern nicht ausdrücklich ein eigenes Vertragsverhältnis
        begründet wird.
      </p>
      <p>
        (3) Diese AGB gelten ausschließlich. Abweichende, entgegenstehende oder ergänzende
        Geschäftsbedingungen des Kunden werden nur dann und insoweit Vertragsbestandteil, als
        rentably ihrer Geltung ausdrücklich in Textform zugestimmt hat. Dieses
        Zustimmungserfordernis gilt auch dann, wenn rentably in Kenntnis solcher Bedingungen
        Leistungen vorbehaltlos erbringt.
      </p>
      <p>
        (4) Diese AGB gelten auch für zukünftige Vertragsbeziehungen zwischen rentably und dem
        Kunden, ohne dass es eines erneuten Hinweises bedarf, sofern rentably den Kunden im
        Rahmen der Vertragsbeziehung auf die jeweils aktuelle Fassung hinweist (z. B. im
        Kundenkonto oder per E-Mail).
      </p>
      <p>
        (5) Soweit in diesen AGB Schriftform verlangt wird, genügt – soweit gesetzlich zulässig –
        Textform (z. B. E-Mail), sofern nicht ausdrücklich „Schriftform" im Sinne des § 126 BGB
        gefordert ist.
      </p>
      <p>
        (6) rentably erbringt Leistungen grundsätzlich <strong>gegen Entgelt</strong> entsprechend dem vom Kunden
        gewählten Paket. Alle Preisangaben verstehen sich – sofern nicht ausdrücklich anders
        dargestellt – <strong>netto zuzüglich gesetzlicher Umsatzsteuer</strong>, da das Angebot primär an
        Vermieter als Unternehmer gerichtet ist. Ist der Kunde Verbraucher, werden Preise brutto
        einschließlich Umsatzsteuer ausgewiesen.
      </p>
      <p>
        (7) rentably ist berechtigt, zur Leistungserbringung verbundene Unternehmen, Subunternehmer
        oder Erfüllungsgehilfen einzusetzen.
      </p>
    </section>
  );
}

function AGBSection2() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 2 Leistungsbeschreibung, Leistungsumfang, Änderungen</h2>
      <p>
        (1) rentably stellt dem Kunden eine webbasierte Plattform zur Verfügung, mit der der Kunde
        insbesondere:
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Immobilien, Einheiten, Mietverhältnisse und Stammdaten erfassen und verwalten kann,</li>
        <li>Dokumente speichern, organisieren und abrufen kann,</li>
        <li>Auswertungen, Übersichten und Kennzahlen (z. B. Cashflow) nutzen kann,</li>
        <li>Kommunikation und Prozesse (z. B. Nachrichten, Aufgaben, Vorlagen) abbilden kann,</li>
        <li>je nach Paket weitere Module oder Zusatzleistungen nutzen kann.</li>
      </ol>
      <p>
        (2) Der konkrete Leistungsumfang richtet sich nach:
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>dem bei Vertragsschluss gewählten Paket bzw. der Leistungsbeschreibung im Buchungsprozess,</li>
        <li>ggf. gebuchten Zusatzleistungen,</li>
        <li>der jeweils aktuellen Dokumentation/Produktbeschreibung innerhalb der Plattform.</li>
      </ol>
      <p>
        (3) rentably schuldet die Bereitstellung der Plattform im vereinbarten Umfang, nicht jedoch
        einen bestimmten wirtschaftlichen Erfolg (z. B. bestimmte Renditen, Steuerersparnisse oder
        bestimmte Vermietungsergebnisse).
      </p>
      <p>
        (4) rentably ist berechtigt, Leistungen anzupassen, weiterzuentwickeln, zu erweitern oder
        Funktionen zu ändern, wenn und soweit:
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>dies aus technischen Gründen erforderlich ist (z. B. Sicherheit, Stabilität, Missbrauchsprävention),</li>
        <li>gesetzliche oder behördliche Vorgaben eine Anpassung erforderlich machen, oder</li>
        <li>die Änderung für den Kunden zumutbar ist und der Vertragszweck nicht wesentlich beeinträchtigt wird.</li>
      </ol>
      <p>
        (5) rentably kann einzelne Funktionen als Beta-/Testfunktionen bereitstellen. Beta-Funktionen
        können in der Verfügbarkeit, Qualität oder Kompatibilität eingeschränkt sein; dies stellt
        keinen Mangel dar, sofern rentably die Beta-Eigenschaft kenntlich macht.
      </p>
      <p>
        (6) Der Kunde ist verantwortlich für die technischen Voraussetzungen auf seiner Seite
        (insbesondere Endgerät, Browser, Internetzugang). Kosten für Datenverbindungen oder
        Providerleistungen sind nicht Bestandteil der Leistung.
      </p>
    </section>
  );
}

function AGBSection3() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 3 Registrierung, Zugangsdaten, Vertragsschluss</h2>
      <p>
        (1) Voraussetzung für die Nutzung ist eine Registrierung durch den Kunden und die Einrichtung
        eines Nutzerkontos. Der Kunde hat im Rahmen der Registrierung vollständige und
        wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
      </p>
      <p>
        (2) Der Kunde ist verpflichtet, Zugangsdaten (Passwörter, API-Keys, Tokens) geheim zu halten,
        sorgfältig zu verwahren und vor dem Zugriff Dritter zu schützen. Der Kunde hat Passwörter
        in angemessenen Abständen zu ändern und bei Verdacht eines Missbrauchs unverzüglich
        Maßnahmen zur Sperrung/Änderung zu ergreifen.
      </p>
      <p>
        (3) Der Kunde darf Zugangsdaten nicht an unberechtigte Dritte weitergeben. Soweit rentably
        Mehrbenutzerkonten anbietet, sind Nutzerrollen und Berechtigungen innerhalb des
        Kundenkontos vom Kunden so zu verwalten, dass nur befugte Personen Zugriff erhalten.
      </p>
      <p>
        (4) Der Vertrag kommt zustande, indem der Kunde:
      </p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>im Online-Buchungsprozess eine Buchung abschließt und diese AGB akzeptiert, oder</li>
        <li>rentably ein Angebot des Kunden ausdrücklich annimmt (z. B. per E-Mail), oder</li>
        <li>rentably dem Kunden den Account freischaltet und die Nutzung ermöglicht.</li>
      </ol>
      <p>
        (5) rentably kann den Vertragsschluss von einer angemessenen Prüfung abhängig machen,
        insbesondere bei Auffälligkeiten, Missbrauchsverdacht oder Zahlungsausfallrisiko. In solchen
        Fällen kann rentably zusätzliche Informationen oder Sicherheiten verlangen.
      </p>
      <p>
        (6) Bonitäts-/Zahlungsrisikoprüfung (optional): Soweit rentably dem Kunden bestimmte
        Zahlungsarten (z. B. Lastschrift/Kreditkarte auf Rechnung, höhere Limits) einräumt, kann
        rentably zur Risikoprüfung Auskünfte bei Wirtschaftsauskunfteien einholen und – soweit
        rechtlich zulässig – negative Zahlungserfahrungen melden, sofern der Kunde hierüber vorab
        informiert wird.
      </p>
    </section>
  );
}

function AGBSection4() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 4 Preise, Zahlungsmodalitäten, Rechnungsstellung, Verzug</h2>
      <p>
        (1) Es gelten die im Buchungsprozess bzw. im jeweiligen Angebot ausgewiesenen Preise.
        Zusatzleistungen, Add-ons oder nutzungsabhängige Leistungen werden – sofern angeboten –
        gesondert berechnet.
      </p>
      <p>
        (2) Soweit nicht anders vereinbart, sind Entgelte im Voraus zu Beginn des jeweiligen
        Abrechnungszeitraums fällig. Nutzungsabhängige Entgelte werden – je nach Ausgestaltung –
        nachträglich abgerechnet.
      </p>
      <p>
        (3) Der Kunde kann nur mit den von rentably angebotenen Zahlungsmethoden zahlen (z. B.
        SEPA-Lastschrift, Kreditkarte, weitere im Checkout angezeigte Methoden). rentably ist
        berechtigt, einzelne Zahlungsarten ohne Angabe von Gründen auszuschließen oder von
        Voraussetzungen abhängig zu machen.
      </p>
      <p>
        (4) Rechnungen werden dem Kunden elektronisch zur Verfügung gestellt (z. B. im Kundenkonto
        oder per E-Mail). Der Kunde stimmt der elektronischen Rechnungsstellung zu.
      </p>
      <p>
        (5) Der Kunde kommt spätestens 14 Tage nach Zugang der Rechnung bzw. nach Mitteilung der
        Rechnungsbereitstellung in Verzug, ohne dass es einer Mahnung bedarf.
      </p>
      <p>(6) Im Verzugsfall ist rentably berechtigt:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Verzugszinsen nach § 288 BGB zu verlangen,</li>
        <li>Mahnkosten bzw. angemessene Aufwände in Rechnung zu stellen,</li>
        <li>den Zugang zu sperren oder einzelne Funktionen zu suspendieren (vgl. § 5),</li>
        <li>bei wiederholtem oder erheblichem Verzug außerordentlich zu kündigen.</li>
      </ol>
      <p>
        (7) Rücklastschriften / Chargebacks: Bei vom Kunden zu vertretenden Rücklastschriften,
        Rückbuchungen oder abgelehnten Kreditkartenzahlungen kann rentably die dadurch entstehenden
        Bank-/Providerkosten sowie eine angemessene Bearbeitungspauschale verlangen, sofern der
        Nachweis eines geringeren Schadens dem Kunden möglich bleibt.
      </p>
      <p>
        (8) Einwendungen gegen Rechnungen sind innerhalb von 6 Wochen nach Zugang in Textform und
        substantiiert geltend zu machen. Unberührt bleiben zwingende gesetzliche Rechte
        (insbesondere bei Verbrauchern). Bei berechtigten Einwendungen wird rentably eine Korrektur
        vornehmen.
      </p>
      <p>
        (9) Aufrechnungs- und Zurückbehaltungsrechte stehen dem Kunden nur zu, sofern seine
        Gegenansprüche rechtskräftig festgestellt, unbestritten oder von rentably anerkannt sind.
      </p>
    </section>
  );
}

function AGBSection5() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 5 Sperrung, Suspendierung, Missbrauch, Sicherheitsmaßnahmen</h2>
      <p>(1) rentably ist berechtigt, den Zugang des Kunden vorübergehend zu sperren oder einzelne Leistungen zu suspendieren, wenn:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>der Kunde mit Zahlungen in Verzug ist (insbesondere wenn der Rückstand mindestens zwei periodischen Grundentgelten entspricht),</li>
        <li>ein erheblicher Verstoß gegen diese AGB vorliegt (z. B. rechtswidrige Inhalte, Missbrauch, Angriffe auf die Plattform),</li>
        <li>begründeter Verdacht auf Kompromittierung von Zugangsdaten oder unberechtigten Zugriff besteht,</li>
        <li>rentably aufgrund gesetzlicher Verpflichtungen, behördlicher Anordnung oder zur Abwehr von Sicherheitsrisiken handeln muss.</li>
      </ol>
      <p>
        (2) Eine Sperrung/Suspendierung lässt die Zahlungspflichten für laufzeitbezogene Entgelte
        unberührt, sofern die Sperrung auf einem vom Kunden zu vertretenden Umstand beruht.
      </p>
      <p>
        (3) rentably wird – soweit zumutbar – den Kunden vor einer Sperrung informieren und ihm
        Gelegenheit zur Abhilfe geben. Dies gilt nicht, wenn eine sofortige Maßnahme erforderlich
        ist (z. B. Sicherheitsvorfall, rechtswidrige Nutzung, Gefahr im Verzug).
      </p>
      <p>
        (4) Der Kunde bleibt verpflichtet, rentably alle Schäden zu ersetzen, die rentably durch eine
        vom Kunden zu vertretende missbräuchliche Nutzung oder durch Verletzung wesentlicher
        Pflichten entstehen (einschließlich angemessener Rechtsverfolgungskosten), sofern gesetzlich
        zulässig.
      </p>
    </section>
  );
}

function AGBSection6() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 6 Nutzungsrechte, Urheberrechte, Systemnutzung</h2>
      <p>
        (1) Mit Vertragsschluss erhält der Kunde ein einfaches, nicht ausschließliches, nicht
        übertragbares und auf die Dauer des Vertrags beschränktes Recht, die Plattform „rentably"
        im vertraglich vereinbarten Umfang zu nutzen.
      </p>
      <p>
        (2) Eine Überlassung der Plattform an Dritte außerhalb des eigenen Unternehmens bzw.
        außerhalb der eigenen Vermietungstätigkeit ist unzulässig, soweit dies nicht ausdrücklich
        im jeweiligen Paket vorgesehen ist.
      </p>
      <p>(3) Der Kunde ist insbesondere nicht berechtigt:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>die Software oder Teile hiervon zu vervielfältigen, zu verbreiten oder öffentlich zugänglich zu machen,</li>
        <li>Quellcode zu dekompilieren, zu disassemblieren oder anderweitig zurückzuentwickeln,</li>
        <li>die Plattform zu vermieten, weiterzuverkaufen oder als eigene Softwarelösung anzubieten,</li>
        <li>automatisierte Massenzugriffe (z. B. Scraping, Bots) vorzunehmen, sofern dies nicht ausdrücklich freigegeben ist.</li>
      </ol>
      <p>
        (4) Sämtliche Rechte an der Plattform, insbesondere Urheberrechte, Markenrechte,
        Datenbankrechte und sonstige gewerbliche Schutzrechte verbleiben ausschließlich bei rentably.
      </p>
      <p>
        (5) Der Kunde räumt rentably ein einfaches, zeitlich auf die Vertragslaufzeit beschränktes
        Recht ein, die vom Kunden eingegebenen Daten technisch zu verarbeiten, zu speichern und im
        Rahmen der Vertragserfüllung zu nutzen.
      </p>
    </section>
  );
}

function AGBSection7() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 7 Mieterzugang, Rollen- und Rechteverwaltung</h2>
      <p>
        (1) rentably stellt dem Kunden – je nach gebuchtem Leistungsumfang – die Möglichkeit zur
        Verfügung, Mieter oder sonstige Nutzer (z. B. Dienstleister) in das System einzuladen.
      </p>
      <p>
        (2) Zwischen rentably und dem Mieter kommt grundsätzlich kein eigenständiger entgeltlicher
        Vertrag zustande, sofern nicht ausdrücklich anders geregelt.
      </p>
      <p>(3) Der Kunde ist allein verantwortlich für:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>die Auswahl und Einladung von Mietern,</li>
        <li>die Vergabe und Verwaltung von Rollen und Zugriffsrechten,</li>
        <li>die Rechtmäßigkeit der Datenübermittlung an Mieter.</li>
      </ol>
      <p>
        (4) rentably ist nicht verpflichtet, die vom Kunden freigegebenen Inhalte oder Zugriffe zu
        überprüfen.
      </p>
      <p>
        (5) Verstößt ein Mieter gegen gesetzliche Vorschriften oder diese AGB, ist rentably
        berechtigt, den entsprechenden Zugang zu sperren.
      </p>
    </section>
  );
}

function AGBSection8() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 8 Pflichten des Kunden, zulässige Nutzung</h2>
      <p>
        (1) Der Kunde verpflichtet sich, die Plattform ausschließlich im Rahmen der gesetzlichen
        Vorschriften sowie dieser AGB zu nutzen.
      </p>
      <p>(2) Es ist insbesondere untersagt:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>rechtswidrige Inhalte einzustellen oder zu verbreiten,</li>
        <li>Inhalte einzustellen, die Rechte Dritter verletzen (z. B. Urheberrechte, Markenrechte, Persönlichkeitsrechte),</li>
        <li>die Plattform für betrügerische oder sittenwidrige Zwecke zu verwenden,</li>
        <li>technische Angriffe oder Manipulationen vorzunehmen,</li>
        <li>Sicherheitsmechanismen zu umgehen.</li>
      </ol>
      <p>
        (3) Der Kunde ist allein verantwortlich für die Richtigkeit, Vollständigkeit und
        Rechtmäßigkeit der von ihm eingegebenen Daten.
      </p>
      <p>
        (4) Der Kunde stellt rentably von sämtlichen Ansprüchen Dritter frei, die aufgrund einer
        rechtswidrigen Nutzung durch den Kunden entstehen, sofern der Kunde die Rechtsverletzung
        zu vertreten hat.
      </p>
    </section>
  );
}

function AGBSection9() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 9 Formulare, Vorlagen, automatisiert generierte Inhalte</h2>
      <p>
        (1) rentably kann dem Kunden Vorlagen oder automatisiert generierte Dokumente (z. B.
        Mietverträge, Nebenkostenabrechnungen, Anschreiben, Berechnungen) zur Verfügung stellen.
      </p>
      <p>(2) Diese Dokumente stellen ausschließlich unverbindliche Muster dar.</p>
      <p>(3) Sie ersetzen keine anwaltliche oder steuerliche Beratung.</p>
      <p>(4) rentably übernimmt keine Gewähr dafür, dass generierte Dokumente:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>rechtlich wirksam,</li>
        <li>vollständig,</li>
        <li>individuell geeignet oder</li>
        <li>frei von Fehlern sind.</li>
      </ul>
      <p>(5) Die Nutzung erfolgt auf eigene Verantwortung des Kunden.</p>
      <p>
        (6) Soweit Berechnungen oder Kennzahlen angezeigt werden (z. B. Cashflow, Renditen), handelt
        es sich um rein rechnerische Darstellungen auf Grundlage der vom Kunden eingegebenen Daten.
        Eine Haftung für wirtschaftliche Entscheidungen wird ausgeschlossen, soweit gesetzlich
        zulässig.
      </p>
    </section>
  );
}

function AGBSection10() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 10 Verfügbarkeit, Wartung, höhere Gewalt</h2>
      <p>
        (1) rentably gewährleistet eine durchschnittliche Systemverfügbarkeit von 95 % im Jahresmittel.
      </p>
      <p>(2) Nicht als Ausfallzeiten gelten insbesondere:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Wartungsarbeiten,</li>
        <li>Updates und Sicherheitsmaßnahmen,</li>
        <li>Störungen außerhalb des Einflussbereichs von rentably,</li>
        <li>höhere Gewalt (z. B. Streik, Naturereignisse, behördliche Maßnahmen),</li>
        <li>Ausfälle von Internet- oder Telekommunikationsanbietern.</li>
      </ol>
      <p>
        (3) Wartungsarbeiten werden – soweit möglich – vorab im Kundenportal angekündigt.
      </p>
      <p>
        (4) rentably schuldet keine unterbrechungsfreie oder fehlerfreie Verfügbarkeit.
      </p>
    </section>
  );
}

function AGBSection11() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 11 Datenschutz und Auftragsverarbeitung</h2>
      <p>
        (1) rentably verarbeitet personenbezogene Daten im Einklang mit der DSGVO.
      </p>
      <p>
        (2) Soweit rentably personenbezogene Daten im Auftrag des Kunden verarbeitet (insbesondere
        Mieterdaten), handeln die Parteien als Verantwortlicher (Kunde) und Auftragsverarbeiter
        (rentably).
      </p>
      <p>
        (3) Eine gesonderte Vereinbarung zur Auftragsverarbeitung (AVV) wird Bestandteil des Vertrages.
      </p>
      <p>(4) Der Kunde ist verantwortlich für:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>die Rechtmäßigkeit der Datenerhebung,</li>
        <li>die Erfüllung von Informationspflichten,</li>
        <li>die Einholung erforderlicher Einwilligungen.</li>
      </ol>
      <p>
        (5) rentably haftet nicht für Datenschutzverstöße, die auf einer rechtswidrigen Nutzung
        durch den Kunden beruhen.
      </p>
    </section>
  );
}

function AGBSection12() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 12 Änderungen der AGB, Leistungsänderungen, Preisänderungen, Mitteilungen über das Kundenportal</h2>
      <p>
        (1) rentably ist berechtigt, diese AGB sowie Leistungsbeschreibungen und Preise mit Wirkung
        für die Zukunft zu ändern. Sachliche Gründe könnten insbesondere hierfür sein:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>technische Weiterentwicklungen,</li>
        <li>Anpassung an gesetzliche Änderungen,</li>
        <li>Sicherheitsanforderungen,</li>
        <li>Kostenentwicklungen,</li>
        <li>Erweiterung oder Reduzierung von Funktionen.</li>
      </ul>
      <p>
        (2) Änderungen werden dem Kunden mindestens 14 Tage vor Inkrafttreten in Textform mitgeteilt.
        Die Mitteilung kann erfolgen:
      </p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>per E-Mail,</li>
        <li>durch Nachricht im Kundenportal,</li>
        <li>durch Einstellung im Kundenkonto.</li>
      </ul>
      <p>
        (3) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde. Sie
        gilt spätestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom Kunden
        nicht abgerufen wurde.
      </p>
      <p>
        (4) Der Kunde ist verpflichtet, sein Kundenkonto regelmäßig auf Mitteilungen zu überprüfen.
      </p>
      <p>
        (5) Widerspricht der Kunde einer Änderung nicht innerhalb von 14 Tagen nach Zugang in
        Textform, gelten die Änderungen als genehmigt.
      </p>
      <p>
        (6) Widerspricht der Kunde fristgerecht, gelten die bisherigen AGB bzw. Preise unverändert fort.
      </p>
      <p>
        (7) Das allgemeine vertragliche Kündigungsrecht der Parteien bleibt unberührt.
      </p>
    </section>
  );
}

function AGBSection13() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 13 Haftung</h2>
      <p>
        (1) rentably haftet – gleich aus welchem Rechtsgrund – im Rahmen der gesetzlichen Vorschriften
        nur nach Maßgabe der folgenden Bestimmungen.
      </p>
      <p>(2) Unbeschränkte Haftung besteht bei:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Vorsatz oder grober Fahrlässigkeit,</li>
        <li>Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit,</li>
        <li>Ansprüchen nach dem Produkthaftungsgesetz,</li>
        <li>Übernahme einer ausdrücklichen Garantie.</li>
      </ol>
      <p>
        (3) Bei leichter Fahrlässigkeit haftet rentably nur bei Verletzung einer wesentlichen
        Vertragspflicht (sog. Kardinalpflicht).
      </p>
      <p>
        Wesentliche Vertragspflichten sind solche, deren Erfüllung die ordnungsgemäße Durchführung
        des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig
        vertrauen darf.
      </p>
      <p>
        (4) In diesen Fällen ist die Haftung auf den bei Vertragsschluss vorhersehbaren,
        vertragstypischen Schaden begrenzt.
      </p>
      <p>(5) Eine Haftung für:</p>
      <ul className="list-disc list-inside space-y-2 ml-4">
        <li>entgangenen Gewinn,</li>
        <li>mittelbare Schäden,</li>
        <li>Folgeschäden,</li>
        <li>Datenverlust, soweit der Kunde keine angemessene Datensicherung vorgenommen hat,</li>
        <li>wirtschaftliche Fehlentscheidungen des Kunden,</li>
      </ul>
      <p>ist bei leichter Fahrlässigkeit ausgeschlossen.</p>
      <p>(6) rentably haftet nicht für:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>Inhalte des Kunden oder von Mietern,</li>
        <li>rechtliche Wirksamkeit von Musterdokumenten,</li>
        <li>Unterbrechungen durch höhere Gewalt,</li>
        <li>Ausfälle von Telekommunikations- oder Hosting-Dienstleistern außerhalb des Einflussbereichs von rentably,</li>
        <li>missbräuchliche Verwendung von Zugangsdaten durch Dritte, sofern rentably kein Verschulden trifft.</li>
      </ol>
      <p>
        (7) Soweit die Haftung von rentably ausgeschlossen oder beschränkt ist, gilt dies auch
        zugunsten der gesetzlichen Vertreter, Mitarbeiter und Erfüllungsgehilfen.
      </p>
      <p>
        (8) Schadensersatzansprüche verjähren innerhalb der gesetzlichen Fristen.
      </p>
    </section>
  );
}

function AGBSection14() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 14 Vertragslaufzeit, Verlängerung und Kündigung</h2>
      <p>
        (1) Die Vertragslaufzeit ergibt sich aus dem vom Kunden gewählten Abrechnungszeitraum
        (monatlich oder jährlich).
      </p>
      <p>
        (2) Der Vertrag verlängert sich automatisch um die jeweils vereinbarte Laufzeit, sofern er
        nicht mit einer Frist von 14 Tagen zum Ende der jeweiligen Laufzeit gekündigt wird.
      </p>
      <p>
        (3) Kündigungen bedürfen mindestens der Textform (z. B. E-Mail oder Kündigungsfunktion im
        Kundenkonto).
      </p>
      <p>
        (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
      </p>
      <p>(5) Ein wichtiger Grund liegt insbesondere vor, wenn:</p>
      <ol className="list-decimal list-inside space-y-2 ml-4">
        <li>der Kunde mit zwei periodischen Entgelten in Verzug ist,</li>
        <li>der Kunde trotz Abmahnung gegen wesentliche Vertragspflichten verstößt,</li>
        <li>der Kunde die Plattform rechtswidrig nutzt,</li>
        <li>über das Vermögen des Kunden ein Insolvenzverfahren eröffnet oder mangels Masse abgelehnt wird,</li>
        <li>erhebliche und nachvollziehbare Anhaltspunkte für strafbare oder sittenwidrige Nutzung bestehen.</li>
      </ol>
      <p>
        (6) Im Falle einer wirksamen Kündigung wird der Zugang des Kunden zum Vertragsende deaktiviert.
      </p>
      <p>
        (7) rentably ist berechtigt, nach Vertragsende die gespeicherten Daten des Kunden nach Ablauf
        einer angemessenen Übergangsfrist zu löschen, sofern keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </p>
      <p>
        (8) Der Kunde ist selbst verantwortlich, seine Daten rechtzeitig vor Vertragsende zu
        exportieren oder zu sichern.
      </p>
    </section>
  );
}

function AGBSection15() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 15 Referenznennung</h2>
      <p>
        (1) rentably ist berechtigt, den Kunden als Referenzkunden zu benennen, insbesondere unter
        Verwendung des Firmennamens und Logos auf der Website oder in Präsentationen.
      </p>
      <p>
        (2) Der Kunde kann dieser Nutzung jederzeit in Textform widersprechen.
      </p>
    </section>
  );
}

function AGBSection16() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 16 Mitteilungen über das Kundenportal</h2>
      <p>
        (1) Sämtliche vertragsrelevanten Mitteilungen können von rentably über das Kundenportal
        übermittelt werden.
      </p>
      <p>
        (2) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde.
      </p>
      <p>
        (3) Sie gilt spätestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom
        Kunden nicht abgerufen wurde.
      </p>
      <p>
        (4) Der Kunde verpflichtet sich, sein Kundenkonto regelmäßig auf neue Mitteilungen zu
        überprüfen.
      </p>
    </section>
  );
}

function AGBSection17() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 17 Gerichtsstand, Rechtswahl</h2>
      <p>
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
      </p>
      <p>
        (2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder
        öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand Berlin.
      </p>
    </section>
  );
}

function AGBSection18() {
  return (
    <section>
      <h2 className="text-2xl font-semibold text-dark mb-4">§ 18 Salvatorische Klausel</h2>
      <p>
        (1) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden,
        bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
      </p>
      <p>
        (2) Anstelle der unwirksamen Regelung tritt eine solche, die dem wirtschaftlichen Zweck der
        ursprünglichen Regelung möglichst nahekommt.
      </p>
    </section>
  );
}
