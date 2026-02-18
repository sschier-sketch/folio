import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import CmsPageWrapper from "../components/CmsPageWrapper";

export function AGB() {
  return (
    <>
      <SeoHead />
      <div>
        <section className="pt-24 pb-16 sm:pt-32 sm:pb-20 px-6">
          <div className="max-w-[800px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3c8af7]/5 border border-[#3c8af7]/15 mb-6">
              <FileText className="w-3.5 h-3.5 text-[#3c8af7]" />
              <span className="text-sm font-medium text-[#3c8af7]">
                Rechtliches
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Allgemeine Geschäftsbedingungen
            </h1>
            <p className="mt-4 text-gray-500 text-lg">
              sober care GmbH fur &bdquo;rentably&ldquo; &mdash; Stand: Februar 2026
            </p>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-[800px] mx-auto">
            <CmsPageWrapper slug="agb" fallback={<AGBFallbackContent />} />

            <div className="mt-16 pt-8 border-t border-gray-200">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#3c8af7] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Zuruck zur Startseite
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function AGBFallbackContent() {
  return (
    <div className="space-y-12">
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
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">
      {children}
    </h2>
  );
}

function Paragraph({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-gray-600 leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

function OrderedList({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
      {children}
    </ol>
  );
}

function UnorderedList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
      {children}
    </ul>
  );
}

function AGBSection1() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 1 Allgemeines, Geltungsbereich, Begriffsbestimmungen</SectionHeading>
      <Paragraph>
        (1) Diese Allgemeinen Geschaftsbedingungen (&bdquo;AGB&ldquo;) gelten fur samtliche Vertrage uber
        die Nutzung der Software-as-a-Service-Plattform &bdquo;rentably&ldquo; sowie aller hiermit
        zusammenhangenden Leistungen der
      </Paragraph>
      <Paragraph className="font-semibold text-gray-900">
        sober care GmbH, Pappelallee 78/79, 10437 Berlin
      </Paragraph>
      <Paragraph>(nachfolgend &bdquo;rentably&ldquo;)</Paragraph>
      <Paragraph>gegenuber ihren Kunden.</Paragraph>
      <Paragraph>
        (2) <strong>Kunde</strong> im Sinne dieser AGB ist ausschlie&szlig;lich der <strong>Vermieter</strong> (naturliche oder juristische
        Person), der die Plattform zur Verwaltung eigener oder verwalteter Mietobjekte nutzt. Eine
        Nutzung durch Mieter ist &ndash; soweit rentably entsprechende Funktionen bereitstellt (z. B.
        Portal-/Kommunikationszugang) &ndash; ausschlie&szlig;lich im Rahmen der vom Kunden veranlassten
        Einbindung und nach Ma&szlig;gabe dieser AGB zulassig; Mieter werden dadurch nicht
        Vertragspartner von rentably, sofern nicht ausdrucklich ein eigenes Vertragsverhaltnis
        begrundet wird.
      </Paragraph>
      <Paragraph>
        (3) Diese AGB gelten ausschlie&szlig;lich. Abweichende, entgegenstehende oder erganzende
        Geschaftsbedingungen des Kunden werden nur dann und insoweit Vertragsbestandteil, als
        rentably ihrer Geltung ausdrucklich in Textform zugestimmt hat. Dieses
        Zustimmungserfordernis gilt auch dann, wenn rentably in Kenntnis solcher Bedingungen
        Leistungen vorbehaltlos erbringt.
      </Paragraph>
      <Paragraph>
        (4) Diese AGB gelten auch fur zukunftige Vertragsbeziehungen zwischen rentably und dem
        Kunden, ohne dass es eines erneuten Hinweises bedarf, sofern rentably den Kunden im
        Rahmen der Vertragsbeziehung auf die jeweils aktuelle Fassung hinweist (z. B. im
        Kundenkonto oder per E-Mail).
      </Paragraph>
      <Paragraph>
        (5) Soweit in diesen AGB Schriftform verlangt wird, genugt &ndash; soweit gesetzlich zulassig &ndash;
        Textform (z. B. E-Mail), sofern nicht ausdrucklich &bdquo;Schriftform&ldquo; im Sinne des &sect; 126 BGB
        gefordert ist.
      </Paragraph>
      <Paragraph>
        (6) rentably erbringt Leistungen grundsatzlich <strong>gegen Entgelt</strong> entsprechend dem vom Kunden
        gewahlten Paket. Alle Preisangaben verstehen sich &ndash; sofern nicht ausdrucklich anders
        dargestellt &ndash; <strong>netto zuzuglich gesetzlicher Umsatzsteuer</strong>, da das Angebot primar an
        Vermieter als Unternehmer gerichtet ist. Ist der Kunde Verbraucher, werden Preise brutto
        einschlie&szlig;lich Umsatzsteuer ausgewiesen.
      </Paragraph>
      <Paragraph>
        (7) rentably ist berechtigt, zur Leistungserbringung verbundene Unternehmen, Subunternehmer
        oder Erfullungsgehilfen einzusetzen.
      </Paragraph>
    </section>
  );
}

function AGBSection2() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 2 Leistungsbeschreibung, Leistungsumfang, Anderungen</SectionHeading>
      <Paragraph>
        (1) rentably stellt dem Kunden eine webbasierte Plattform zur Verfugung, mit der der Kunde
        insbesondere:
      </Paragraph>
      <OrderedList>
        <li>Immobilien, Einheiten, Mietverhaltnisse und Stammdaten erfassen und verwalten kann,</li>
        <li>Dokumente speichern, organisieren und abrufen kann,</li>
        <li>Auswertungen, Ubersichten und Kennzahlen (z. B. Cashflow) nutzen kann,</li>
        <li>Kommunikation und Prozesse (z. B. Nachrichten, Aufgaben, Vorlagen) abbilden kann,</li>
        <li>je nach Paket weitere Module oder Zusatzleistungen nutzen kann.</li>
      </OrderedList>
      <Paragraph>
        (2) Der konkrete Leistungsumfang richtet sich nach:
      </Paragraph>
      <OrderedList>
        <li>dem bei Vertragsschluss gewahlten Paket bzw. der Leistungsbeschreibung im Buchungsprozess,</li>
        <li>ggf. gebuchten Zusatzleistungen,</li>
        <li>der jeweils aktuellen Dokumentation/Produktbeschreibung innerhalb der Plattform.</li>
      </OrderedList>
      <Paragraph>
        (3) rentably schuldet die Bereitstellung der Plattform im vereinbarten Umfang, nicht jedoch
        einen bestimmten wirtschaftlichen Erfolg (z. B. bestimmte Renditen, Steuerersparnisse oder
        bestimmte Vermietungsergebnisse).
      </Paragraph>
      <Paragraph>
        (4) rentably ist berechtigt, Leistungen anzupassen, weiterzuentwickeln, zu erweitern oder
        Funktionen zu andern, wenn und soweit:
      </Paragraph>
      <OrderedList>
        <li>dies aus technischen Grunden erforderlich ist (z. B. Sicherheit, Stabilitat, Missbrauchspravention),</li>
        <li>gesetzliche oder behordliche Vorgaben eine Anpassung erforderlich machen, oder</li>
        <li>die Anderung fur den Kunden zumutbar ist und der Vertragszweck nicht wesentlich beeintrachtigt wird.</li>
      </OrderedList>
      <Paragraph>
        (5) rentably kann einzelne Funktionen als Beta-/Testfunktionen bereitstellen. Beta-Funktionen
        konnen in der Verfugbarkeit, Qualitat oder Kompatibilitat eingeschrankt sein; dies stellt
        keinen Mangel dar, sofern rentably die Beta-Eigenschaft kenntlich macht.
      </Paragraph>
      <Paragraph>
        (6) Der Kunde ist verantwortlich fur die technischen Voraussetzungen auf seiner Seite
        (insbesondere Endgerat, Browser, Internetzugang). Kosten fur Datenverbindungen oder
        Providerleistungen sind nicht Bestandteil der Leistung.
      </Paragraph>
    </section>
  );
}

function AGBSection3() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 3 Registrierung, Zugangsdaten, Vertragsschluss</SectionHeading>
      <Paragraph>
        (1) Voraussetzung fur die Nutzung ist eine Registrierung durch den Kunden und die Einrichtung
        eines Nutzerkontos. Der Kunde hat im Rahmen der Registrierung vollstandige und
        wahrheitsgema&szlig;e Angaben zu machen und diese aktuell zu halten.
      </Paragraph>
      <Paragraph>
        (2) Der Kunde ist verpflichtet, Zugangsdaten (Passworter, API-Keys, Tokens) geheim zu halten,
        sorgfaltig zu verwahren und vor dem Zugriff Dritter zu schutzen. Der Kunde hat Passworter
        in angemessenen Abstanden zu andern und bei Verdacht eines Missbrauchs unverzuglich
        Ma&szlig;nahmen zur Sperrung/Anderung zu ergreifen.
      </Paragraph>
      <Paragraph>
        (3) Der Kunde darf Zugangsdaten nicht an unberechtigte Dritte weitergeben. Soweit rentably
        Mehrbenutzerkonten anbietet, sind Nutzerrollen und Berechtigungen innerhalb des
        Kundenkontos vom Kunden so zu verwalten, dass nur befugte Personen Zugriff erhalten.
      </Paragraph>
      <Paragraph>
        (4) Der Vertrag kommt zustande, indem der Kunde:
      </Paragraph>
      <OrderedList>
        <li>im Online-Buchungsprozess eine Buchung abschlie&szlig;t und diese AGB akzeptiert, oder</li>
        <li>rentably ein Angebot des Kunden ausdrucklich annimmt (z. B. per E-Mail), oder</li>
        <li>rentably dem Kunden den Account freischaltet und die Nutzung ermoglicht.</li>
      </OrderedList>
      <Paragraph>
        (5) rentably kann den Vertragsschluss von einer angemessenen Prufung abhangig machen,
        insbesondere bei Auffalligkeiten, Missbrauchsverdacht oder Zahlungsausfallrisiko. In solchen
        Fallen kann rentably zusatzliche Informationen oder Sicherheiten verlangen.
      </Paragraph>
      <Paragraph>
        (6) Bonitats-/Zahlungsrisikoproufung (optional): Soweit rentably dem Kunden bestimmte
        Zahlungsarten (z. B. Lastschrift/Kreditkarte auf Rechnung, hohere Limits) einraumt, kann
        rentably zur Risikoproufung Auskunfte bei Wirtschaftsauskunfteien einholen und &ndash; soweit
        rechtlich zulassig &ndash; negative Zahlungserfahrungen melden, sofern der Kunde hieruber vorab
        informiert wird.
      </Paragraph>
    </section>
  );
}

function AGBSection4() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 4 Preise, Zahlungsmodalitaten, Rechnungsstellung, Verzug</SectionHeading>
      <Paragraph>
        (1) Es gelten die im Buchungsprozess bzw. im jeweiligen Angebot ausgewiesenen Preise.
        Zusatzleistungen, Add-ons oder nutzungsabhangige Leistungen werden &ndash; sofern angeboten &ndash;
        gesondert berechnet.
      </Paragraph>
      <Paragraph>
        (2) Soweit nicht anders vereinbart, sind Entgelte im Voraus zu Beginn des jeweiligen
        Abrechnungszeitraums fallig. Nutzungsabhangige Entgelte werden &ndash; je nach Ausgestaltung &ndash;
        nachtraglich abgerechnet.
      </Paragraph>
      <Paragraph>
        (3) Der Kunde kann nur mit den von rentably angebotenen Zahlungsmethoden zahlen (z. B.
        SEPA-Lastschrift, Kreditkarte, weitere im Checkout angezeigte Methoden). Rentably ist
        berechtigt, einzelne Zahlungsarten ohne Angabe von Grunden auszuschlie&szlig;en oder von
        Voraussetzungen abhangig zu machen.
      </Paragraph>
      <Paragraph>
        (4) Rechnungen werden dem Kunden elektronisch zur Verfugung gestellt (z. B. im Kundenkonto
        oder per E-Mail). Der Kunde stimmt der elektronischen Rechnungsstellung zu.
      </Paragraph>
      <Paragraph>
        (5) Der Kunde kommt spatestens 14 Tage nach Zugang der Rechnung bzw. nach Mitteilung der
        Rechnungsbereitstellung in Verzug, ohne dass es einer Mahnung bedarf.
      </Paragraph>
      <Paragraph>(6) Im Verzugsfall ist rentably berechtigt:</Paragraph>
      <OrderedList>
        <li>Verzugszinsen nach &sect; 288 BGB zu verlangen,</li>
        <li>Mahnkosten bzw. angemessene Aufwande in Rechnung zu stellen,</li>
        <li>den Zugang zu sperren oder einzelne Funktionen zu suspendieren (vgl. &sect; 5),</li>
        <li>bei wiederholtem oder erheblichem Verzug au&szlig;erordentlich zu kundigen.</li>
      </OrderedList>
      <Paragraph>
        (7) Rucklastschriften / Chargebacks: Bei vom Kunden zu vertretenden Rucklastschriften,
        Ruckbuchungen oder abgelehnten Kreditkartenzahlungen kann rentably die dadurch entstehenden
        Bank-/Providerkosten sowie eine angemessene Bearbeitungspauschale verlangen, sofern der
        Nachweis eines geringeren Schadens dem Kunden moglich bleibt.
      </Paragraph>
      <Paragraph>
        (8) Einwendungen gegen Rechnungen sind innerhalb von 6 Wochen nach Zugang in Textform und
        substantiiert geltend zu machen. Unberuhrt bleiben zwingende gesetzliche Rechte
        (insbesondere bei Verbrauchern). Bei berechtigten Einwendungen wird rentably eine Korrektur
        vornehmen.
      </Paragraph>
      <Paragraph>
        (9) Aufrechnungs- und Zuruckbehaltungsrechte stehen dem Kunden nur zu, sofern seine
        Gegenanspruche rechtskraftig festgestellt, unbestritten oder von rentably anerkannt sind.
      </Paragraph>
    </section>
  );
}

function AGBSection5() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 5 Sperrung, Suspendierung, Missbrauch, Sicherheitsma&szlig;nahmen</SectionHeading>
      <Paragraph>(1) rentably ist berechtigt, den Zugang des Kunden vorubergehend zu sperren oder einzelne Leistungen zu suspendieren, wenn:</Paragraph>
      <OrderedList>
        <li>der Kunde mit Zahlungen in Verzug ist (insbesondere wenn der Ruckstand mindestens zwei periodischen Grundentgelten entspricht),</li>
        <li>ein erheblicher Versto&szlig; gegen diese AGB vorliegt (z. B. rechtswidrige Inhalte, Missbrauch, Angriffe auf die Plattform),</li>
        <li>begrundeter Verdacht auf Kompromittierung von Zugangsdaten oder unberechtigten Zugriff besteht,</li>
        <li>rentably aufgrund gesetzlicher Verpflichtungen, behordlicher Anordnung oder zur Abwehr von Sicherheitsrisiken handeln muss.</li>
      </OrderedList>
      <Paragraph>
        (2) Eine Sperrung/Suspendierung lasst die Zahlungspflichten fur laufzeitbezogene Entgelte
        unberuhrt, sofern die Sperrung auf einem vom Kunden zu vertretenden Umstand beruht.
      </Paragraph>
      <Paragraph>
        (3) rentably wird &ndash; soweit zumutbar &ndash; den Kunden vor einer Sperrung informieren und ihm
        Gelegenheit zur Abhilfe geben. Dies gilt nicht, wenn eine sofortige Ma&szlig;nahme erforderlich
        ist (z. B. Sicherheitsvorfall, rechtswidrige Nutzung, Gefahr im Verzug).
      </Paragraph>
      <Paragraph>
        (4) Der Kunde bleibt verpflichtet, rentably alle Schaden zu ersetzen, die rentably durch eine
        vom Kunden zu vertretende missbrauchliche Nutzung oder durch Verletzung wesentlicher
        Pflichten entstehen (einschlie&szlig;lich angemessener Rechtsverfolgungskosten), sofern gesetzlich
        zulassig.
      </Paragraph>
    </section>
  );
}

function AGBSection6() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 6 Nutzungsrechte, Urheberrechte, Systemnutzung</SectionHeading>
      <Paragraph>
        (1) Mit Vertragsschluss erhalt der Kunde ein einfaches, nicht ausschlie&szlig;liches, nicht
        ubertragbares und auf die Dauer des Vertrags beschranktes Recht, die Plattform &bdquo;rentably&ldquo;
        im vertraglich vereinbarten Umfang zu nutzen.
      </Paragraph>
      <Paragraph>
        (2) Eine Uberlassung der Plattform an Dritte au&szlig;erhalb des eigenen Unternehmens bzw.
        au&szlig;erhalb der eigenen Vermietungstatigkeit ist unzulassig, soweit dies nicht ausdrucklich
        im jeweiligen Paket vorgesehen ist.
      </Paragraph>
      <Paragraph>(3) Der Kunde ist insbesondere nicht berechtigt:</Paragraph>
      <OrderedList>
        <li>die Software oder Teile hiervon zu vervielfaltigen, zu verbreiten oder offentlich zuganglich zu machen,</li>
        <li>Quellcode zu dekompilieren, zu disassemblieren oder anderweitig zuruckzuentwickeln,</li>
        <li>die Plattform zu vermieten, weiterzuverkaufen oder als eigene Softwarelosung anzubieten,</li>
        <li>automatisierte Massenzugriffe (z. B. Scraping, Bots) vorzunehmen, sofern dies nicht ausdrucklich freigegeben ist.</li>
      </OrderedList>
      <Paragraph>
        (4) Samtliche Rechte an der Plattform, insbesondere Urheberrechte, Markenrechte,
        Datenbankrechte und sonstige gewerbliche Schutzrechte verbleiben ausschlie&szlig;lich bei rentably.
      </Paragraph>
      <Paragraph>
        (5) Der Kunde raumt rentably ein einfaches, zeitlich auf die Vertragslaufzeit beschranktes
        Recht ein, die vom Kunden eingegebenen Daten technisch zu verarbeiten, zu speichern und im
        Rahmen der Vertragserfullung zu nutzen.
      </Paragraph>
    </section>
  );
}

function AGBSection7() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 7 Mieterzugang, Rollen- und Rechteverwaltung</SectionHeading>
      <Paragraph>
        (1) rentably stellt dem Kunden &ndash; je nach gebuchtem Leistungsumfang &ndash; die Moglichkeit zur
        Verfugung, Mieter oder sonstige Nutzer (z. B. Dienstleister) in das System einzuladen.
      </Paragraph>
      <Paragraph>
        (2) Zwischen rentably und dem Mieter kommt grundsatzlich kein eigenstandiger entgeltlicher
        Vertrag zustande, sofern nicht ausdrucklich anders geregelt.
      </Paragraph>
      <Paragraph>(3) Der Kunde ist allein verantwortlich fur:</Paragraph>
      <OrderedList>
        <li>die Auswahl und Einladung von Mietern,</li>
        <li>die Vergabe und Verwaltung von Rollen und Zugriffsrechten,</li>
        <li>die Rechtma&szlig;igkeit der Datenubermittlung an Mieter.</li>
      </OrderedList>
      <Paragraph>
        (4) rentably ist nicht verpflichtet, die vom Kunden freigegebenen Inhalte oder Zugriffe zu
        uberprufen.
      </Paragraph>
      <Paragraph>
        (5) Versto&szlig;t ein Mieter gegen gesetzliche Vorschriften oder diese AGB, ist rentably
        berechtigt, den entsprechenden Zugang zu sperren.
      </Paragraph>
    </section>
  );
}

function AGBSection8() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 8 Pflichten des Kunden, zulassige Nutzung</SectionHeading>
      <Paragraph>
        (1) Der Kunde verpflichtet sich, die Plattform ausschlie&szlig;lich im Rahmen der gesetzlichen
        Vorschriften sowie dieser AGB zu nutzen.
      </Paragraph>
      <Paragraph>(2) Es ist insbesondere untersagt:</Paragraph>
      <OrderedList>
        <li>rechtswidrige Inhalte einzustellen oder zu verbreiten,</li>
        <li>Inhalte einzustellen, die Rechte Dritter verletzen (z. B. Urheberrechte, Markenrechte, Personlichkeitsrechte),</li>
        <li>die Plattform fur betrugerische oder sittenwidrige Zwecke zu verwenden,</li>
        <li>technische Angriffe oder Manipulationen vorzunehmen,</li>
        <li>Sicherheitsmechanismen zu umgehen.</li>
      </OrderedList>
      <Paragraph>
        (3) Der Kunde ist allein verantwortlich fur die Richtigkeit, Vollstandigkeit und
        Rechtma&szlig;igkeit der von ihm eingegebenen Daten.
      </Paragraph>
      <Paragraph>
        (4) Der Kunde stellt rentably von samtlichen Anspruchen Dritter frei, die aufgrund einer
        rechtswidrigen Nutzung durch den Kunden entstehen, sofern der Kunde die Rechtsverletzung
        zu vertreten hat.
      </Paragraph>
    </section>
  );
}

function AGBSection9() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 9 Formulare, Vorlagen, automatisiert generierte Inhalte</SectionHeading>
      <Paragraph>
        (1) rentably kann dem Kunden Vorlagen oder automatisiert generierte Dokumente (z. B.
        Mietvertrage, Nebenkostenabrechnungen, Anschreiben, Berechnungen) zur Verfugung stellen.
      </Paragraph>
      <Paragraph>(2) Diese Dokumente stellen ausschlie&szlig;lich unverbindliche Muster dar.</Paragraph>
      <Paragraph>(3) Sie ersetzen keine anwaltliche oder steuerliche Beratung.</Paragraph>
      <Paragraph>(4) rentably ubernimmt keine Gewahr dafur, dass generierte Dokumente:</Paragraph>
      <UnorderedList>
        <li>rechtlich wirksam,</li>
        <li>vollstandig,</li>
        <li>individuell geeignet oder</li>
        <li>frei von Fehlern sind.</li>
      </UnorderedList>
      <Paragraph>(5) Die Nutzung erfolgt auf eigene Verantwortung des Kunden.</Paragraph>
      <Paragraph>
        (6) Soweit Berechnungen oder Kennzahlen angezeigt werden (z. B. Cashflow, Renditen), handelt
        es sich um rein rechnerische Darstellungen auf Grundlage der vom Kunden eingegebenen Daten.
        Eine Haftung fur wirtschaftliche Entscheidungen wird ausgeschlossen, soweit gesetzlich
        zulassig.
      </Paragraph>
    </section>
  );
}

function AGBSection10() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 10 Verfugbarkeit, Wartung, hohere Gewalt</SectionHeading>
      <Paragraph>
        (1) rentably gewahrleistet eine durchschnittliche Systemverfugbarkeit von 95 % im Jahresmittel.
      </Paragraph>
      <Paragraph>(2) Nicht als Ausfallzeiten gelten insbesondere:</Paragraph>
      <OrderedList>
        <li>Wartungsarbeiten,</li>
        <li>Updates und Sicherheitsma&szlig;nahmen,</li>
        <li>Storungen au&szlig;erhalb des Einflussbereichs von rentably,</li>
        <li>hohere Gewalt (z. B. Streik, Naturereignisse, behordliche Ma&szlig;nahmen),</li>
        <li>Ausfalle von Internet- oder Telekommunikationsanbietern.</li>
      </OrderedList>
      <Paragraph>
        (3) Wartungsarbeiten werden &ndash; soweit moglich &ndash; vorab im Kundenportal angekundigt.
      </Paragraph>
      <Paragraph>
        (4) rentably schuldet keine unterbrechungsfreie oder fehlerfreie Verfugbarkeit.
      </Paragraph>
    </section>
  );
}

function AGBSection11() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 11 Datenschutz und Auftragsverarbeitung</SectionHeading>
      <Paragraph>
        (1) rentably verarbeitet personenbezogene Daten im Einklang mit der DSGVO.
      </Paragraph>
      <Paragraph>
        (2) Soweit rentably personenbezogene Daten im Auftrag des Kunden verarbeitet (insbesondere
        Mieterdaten), handeln die Parteien als Verantwortlicher (Kunde) und Auftragsverarbeiter
        (rentably).
      </Paragraph>
      <Paragraph>
        (3) Eine gesonderte Vereinbarung zur Auftragsverarbeitung (AVV) wird Bestandteil des Vertrages.
      </Paragraph>
      <Paragraph>(4) Der Kunde ist verantwortlich fur:</Paragraph>
      <OrderedList>
        <li>die Rechtma&szlig;igkeit der Datenerhebung,</li>
        <li>die Erfullung von Informationspflichten,</li>
        <li>die Einholung erforderlicher Einwilligungen.</li>
      </OrderedList>
      <Paragraph>
        (5) rentably haftet nicht fur Datenschutzversto&szlig;e, die auf einer rechtswidrigen Nutzung
        durch den Kunden beruhen.
      </Paragraph>
    </section>
  );
}

function AGBSection12() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 12 Anderungen der AGB, Leistungsanderungen, Preisanderungen, Mitteilungen uber das Kundenportal</SectionHeading>
      <Paragraph>
        (1) rentably ist berechtigt, diese AGB sowie Leistungsbeschreibungen und Preise mit Wirkung
        fur die Zukunft zu andern. Sachliche Grunde konnten insbesondere hierfur sein:
      </Paragraph>
      <UnorderedList>
        <li>technische Weiterentwicklungen,</li>
        <li>Anpassung an gesetzliche Anderungen,</li>
        <li>Sicherheitsanforderungen,</li>
        <li>Kostenentwicklungen,</li>
        <li>Erweiterung oder Reduzierung von Funktionen.</li>
      </UnorderedList>
      <Paragraph>
        (2) Anderungen werden dem Kunden mindestens 14 Tage vor Inkrafttreten in Textform mitgeteilt.
        Die Mitteilung kann erfolgen:
      </Paragraph>
      <UnorderedList>
        <li>per E-Mail,</li>
        <li>durch Nachricht im Kundenportal,</li>
        <li>durch Einstellung im Kundenkonto.</li>
      </UnorderedList>
      <Paragraph>
        (3) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde. Sie
        gilt spatestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom Kunden
        nicht abgerufen wurde.
      </Paragraph>
      <Paragraph>
        (4) Der Kunde ist verpflichtet, sein Kundenkonto regelma&szlig;ig auf Mitteilungen zu uberprufen.
      </Paragraph>
      <Paragraph>
        (5) Widerspricht der Kunde einer Anderung nicht innerhalb von 14 Tagen nach Zugang in
        Textform, gelten die Anderungen als genehmigt.
      </Paragraph>
      <Paragraph>
        (6) Widerspricht der Kunde fristgerecht, gelten die bisherigen AGB bzw. Preise unverandert fort.
      </Paragraph>
      <Paragraph>
        (7) Das allgemeine vertragliche Kundigungsrecht der Parteien bleibt unberuhrt.
      </Paragraph>
    </section>
  );
}

function AGBSection13() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 13 Haftung</SectionHeading>
      <Paragraph>
        (1) rentably haftet &ndash; gleich aus welchem Rechtsgrund &ndash; im Rahmen der gesetzlichen Vorschriften
        nur nach Ma&szlig;gabe der folgenden Bestimmungen.
      </Paragraph>
      <Paragraph>(2) Unbeschrankte Haftung besteht bei:</Paragraph>
      <OrderedList>
        <li>Vorsatz oder grober Fahrlassigkeit,</li>
        <li>Schaden aus der Verletzung des Lebens, des Korpers oder der Gesundheit,</li>
        <li>Anspruchen nach dem Produkthaftungsgesetz,</li>
        <li>Ubernahme einer ausdrucklichen Garantie.</li>
      </OrderedList>
      <Paragraph>
        (3) Bei leichter Fahrlassigkeit haftet rentably nur bei Verletzung einer wesentlichen
        Vertragspflicht (sog. Kardinalpflicht).
      </Paragraph>
      <Paragraph>
        Wesentliche Vertragspflichten sind solche, deren Erfullung die ordnungsgema&szlig;e Durchfuhrung
        des Vertrags uberhaupt erst ermoglicht und auf deren Einhaltung der Kunde regelma&szlig;ig
        vertrauen darf.
      </Paragraph>
      <Paragraph>
        (4) In diesen Fallen ist die Haftung auf den bei Vertragsschluss vorhersehbaren,
        vertragstypischen Schaden begrenzt.
      </Paragraph>
      <Paragraph>(5) Eine Haftung fur:</Paragraph>
      <UnorderedList>
        <li>entgangenen Gewinn,</li>
        <li>mittelbare Schaden,</li>
        <li>Folgeschaden,</li>
        <li>Datenverlust, soweit der Kunde keine angemessene Datensicherung vorgenommen hat,</li>
        <li>wirtschaftliche Fehlentscheidungen des Kunden,</li>
      </UnorderedList>
      <Paragraph>ist bei leichter Fahrlassigkeit ausgeschlossen.</Paragraph>
      <Paragraph>(6) rentably haftet nicht fur:</Paragraph>
      <OrderedList>
        <li>Inhalte des Kunden oder von Mietern,</li>
        <li>rechtliche Wirksamkeit von Musterdokumenten,</li>
        <li>Unterbrechungen durch hohere Gewalt,</li>
        <li>Ausfalle von Telekommunikations- oder Hosting-Dienstleistern au&szlig;erhalb des Einflussbereichs von rentably,</li>
        <li>missbrauchliche Verwendung von Zugangsdaten durch Dritte, sofern rentably kein Verschulden trifft.</li>
      </OrderedList>
      <Paragraph>
        (7) Soweit die Haftung von rentably ausgeschlossen oder beschrankt ist, gilt dies auch
        zugunsten der gesetzlichen Vertreter, Mitarbeiter und Erfullungsgehilfen.
      </Paragraph>
      <Paragraph>
        (8) Schadensersatzanspruche verjahren innerhalb der gesetzlichen Fristen.
      </Paragraph>
    </section>
  );
}

function AGBSection14() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 14 Vertragslaufzeit, Verlangerung und Kundigung</SectionHeading>
      <Paragraph>
        (1) Die Vertragslaufzeit ergibt sich aus dem vom Kunden gewahlten Abrechnungszeitraum
        (monatlich oder jahrlich).
      </Paragraph>
      <Paragraph>
        (2) Der Vertrag verlangert sich automatisch um die jeweils vereinbarte Laufzeit, sofern er
        nicht mit einer Frist von 14 Tagen zum Ende der jeweiligen Laufzeit gekundigt wird.
      </Paragraph>
      <Paragraph>
        (3) Kundigungen bedurfen mindestens der Textform (z. B. E-Mail oder Kundigungsfunktion im
        Kundenkonto).
      </Paragraph>
      <Paragraph>
        (4) Das Recht zur au&szlig;erordentlichen Kundigung aus wichtigem Grund bleibt unberuhrt.
      </Paragraph>
      <Paragraph>(5) Ein wichtiger Grund liegt insbesondere vor, wenn:</Paragraph>
      <OrderedList>
        <li>der Kunde mit zwei periodischen Entgelten in Verzug ist,</li>
        <li>der Kunde trotz Abmahnung gegen wesentliche Vertragspflichten versto&szlig;t,</li>
        <li>der Kunde die Plattform rechtswidrig nutzt,</li>
        <li>uber das Vermogen des Kunden ein Insolvenzverfahren eroffnet oder mangels Masse abgelehnt wird,</li>
        <li>erhebliche und nachvollziehbare Anhaltspunkte fur strafbare oder sittenwidrige Nutzung bestehen.</li>
      </OrderedList>
      <Paragraph>
        (6) Im Falle einer wirksamen Kundigung wird der Zugang des Kunden zum Vertragsende deaktiviert.
      </Paragraph>
      <Paragraph>
        (7) rentably ist berechtigt, nach Vertragsende die gespeicherten Daten des Kunden nach Ablauf
        einer angemessenen Ubergangsfrist zu loschen, sofern keine gesetzlichen
        Aufbewahrungspflichten entgegenstehen.
      </Paragraph>
      <Paragraph>
        (8) Der Kunde ist selbst verantwortlich, seine Daten rechtzeitig vor Vertragsende zu
        exportieren oder zu sichern.
      </Paragraph>
    </section>
  );
}

function AGBSection15() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 15 Referenznennung</SectionHeading>
      <Paragraph>
        (1) rentably ist berechtigt, den Kunden als Referenzkunden zu benennen, insbesondere unter
        Verwendung des Firmennamens und Logos auf der Website oder in Prasentationen.
      </Paragraph>
      <Paragraph>
        (2) Der Kunde kann dieser Nutzung jederzeit in Textform widersprechen.
      </Paragraph>
    </section>
  );
}

function AGBSection16() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 16 Mitteilungen uber das Kundenportal</SectionHeading>
      <Paragraph>
        (1) Samtliche vertragsrelevanten Mitteilungen konnen von rentably uber das Kundenportal
        ubermittelt werden.
      </Paragraph>
      <Paragraph>
        (2) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde.
      </Paragraph>
      <Paragraph>
        (3) Sie gilt spatestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom
        Kunden nicht abgerufen wurde.
      </Paragraph>
      <Paragraph>
        (4) Der Kunde verpflichtet sich, sein Kundenkonto regelma&szlig;ig auf neue Mitteilungen zu
        uberprufen.
      </Paragraph>
    </section>
  );
}

function AGBSection17() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 17 Gerichtsstand, Rechtswahl</SectionHeading>
      <Paragraph>
        (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
      </Paragraph>
      <Paragraph>
        (2) Ist der Kunde Kaufmann, juristische Person des offentlichen Rechts oder
        offentlich-rechtliches Sondervermogen, ist ausschlie&szlig;licher Gerichtsstand Berlin.
      </Paragraph>
    </section>
  );
}

function AGBSection18() {
  return (
    <section className="space-y-3">
      <SectionHeading>&sect; 18 Salvatorische Klausel</SectionHeading>
      <Paragraph>
        (1) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden,
        bleibt die Wirksamkeit der ubrigen Bestimmungen unberuhrt.
      </Paragraph>
      <Paragraph>
        (2) Anstelle der unwirksamen Regelung tritt eine solche, die dem wirtschaftlichen Zweck der
        ursprunglichen Regelung moglichst nahekommt.
      </Paragraph>
    </section>
  );
}
