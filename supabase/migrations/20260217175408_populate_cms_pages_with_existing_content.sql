/*
  # Populate CMS pages with existing website content

  This migration fills the previously empty CMS page entries with the actual
  legal-page content that was hardcoded in the React fallback components.
  After this migration, admins can view and edit the real content in the CMS.

  1. Modified Tables
    - `cms_pages` – updates the `content` column for slugs:
      impressum, agb, datenschutz, avv

  2. Important Notes
    - Uses dollar-quoting to avoid SQL escaping issues with HTML
    - Content is plain semantic HTML (h2, h3, p, ul, ol, li, strong, a)
    - The CmsPageWrapper component applies Tailwind prose styling automatically
*/

-- ============================================================
-- AGB
-- ============================================================
UPDATE cms_pages SET content = $agb$
<section>
  <h2>§ 1 Allgemeines, Geltungsbereich, Begriffsbestimmungen</h2>
  <p>(1) Diese Allgemeinen Geschäftsbedingungen („AGB") gelten für sämtliche Verträge über die Nutzung der Software-as-a-Service-Plattform „rentably" sowie aller hiermit zusammenhängenden Leistungen der</p>
  <p><strong>sober care GmbH, Pappelallee 78/79, 10437 Berlin</strong></p>
  <p>(nachfolgend „rentably")</p>
  <p>gegenüber ihren Kunden.</p>
  <p>(2) <strong>Kunde</strong> im Sinne dieser AGB ist ausschließlich der <strong>Vermieter</strong> (natürliche oder juristische Person), der die Plattform zur Verwaltung eigener oder verwalteter Mietobjekte nutzt. Eine Nutzung durch Mieter ist – soweit rentably entsprechende Funktionen bereitstellt (z. B. Portal-/Kommunikationszugang) – ausschließlich im Rahmen der vom Kunden veranlassten Einbindung und nach Maßgabe dieser AGB zulässig; Mieter werden dadurch nicht Vertragspartner von rentably, sofern nicht ausdrücklich ein eigenes Vertragsverhältnis begründet wird.</p>
  <p>(3) Diese AGB gelten ausschließlich. Abweichende, entgegenstehende oder ergänzende Geschäftsbedingungen des Kunden werden nur dann und insoweit Vertragsbestandteil, als rentably ihrer Geltung ausdrücklich in Textform zugestimmt hat. Dieses Zustimmungserfordernis gilt auch dann, wenn rentably in Kenntnis solcher Bedingungen Leistungen vorbehaltlos erbringt.</p>
  <p>(4) Diese AGB gelten auch für zukünftige Vertragsbeziehungen zwischen rentably und dem Kunden, ohne dass es eines erneuten Hinweises bedarf, sofern rentably den Kunden im Rahmen der Vertragsbeziehung auf die jeweils aktuelle Fassung hinweist (z. B. im Kundenkonto oder per E-Mail).</p>
  <p>(5) Soweit in diesen AGB Schriftform verlangt wird, genügt – soweit gesetzlich zulässig – Textform (z. B. E-Mail), sofern nicht ausdrücklich „Schriftform" im Sinne des § 126 BGB gefordert ist.</p>
  <p>(6) rentably erbringt Leistungen grundsätzlich <strong>gegen Entgelt</strong> entsprechend dem vom Kunden gewählten Paket. Alle Preisangaben verstehen sich – sofern nicht ausdrücklich anders dargestellt – <strong>netto zuzüglich gesetzlicher Umsatzsteuer</strong>, da das Angebot primär an Vermieter als Unternehmer gerichtet ist. Ist der Kunde Verbraucher, werden Preise brutto einschließlich Umsatzsteuer ausgewiesen.</p>
  <p>(7) rentably ist berechtigt, zur Leistungserbringung verbundene Unternehmen, Subunternehmer oder Erfüllungsgehilfen einzusetzen.</p>
</section>

<section>
  <h2>§ 2 Leistungsbeschreibung, Leistungsumfang, Änderungen</h2>
  <p>(1) rentably stellt dem Kunden eine webbasierte Plattform zur Verfügung, mit der der Kunde insbesondere:</p>
  <ol>
    <li>Immobilien, Einheiten, Mietverhältnisse und Stammdaten erfassen und verwalten kann,</li>
    <li>Dokumente speichern, organisieren und abrufen kann,</li>
    <li>Auswertungen, Übersichten und Kennzahlen (z. B. Cashflow) nutzen kann,</li>
    <li>Kommunikation und Prozesse (z. B. Nachrichten, Aufgaben, Vorlagen) abbilden kann,</li>
    <li>je nach Paket weitere Module oder Zusatzleistungen nutzen kann.</li>
  </ol>
  <p>(2) Der konkrete Leistungsumfang richtet sich nach:</p>
  <ol>
    <li>dem bei Vertragsschluss gewählten Paket bzw. der Leistungsbeschreibung im Buchungsprozess,</li>
    <li>ggf. gebuchten Zusatzleistungen,</li>
    <li>der jeweils aktuellen Dokumentation/Produktbeschreibung innerhalb der Plattform.</li>
  </ol>
  <p>(3) rentably schuldet die Bereitstellung der Plattform im vereinbarten Umfang, nicht jedoch einen bestimmten wirtschaftlichen Erfolg (z. B. bestimmte Renditen, Steuerersparnisse oder bestimmte Vermietungsergebnisse).</p>
  <p>(4) rentably ist berechtigt, Leistungen anzupassen, weiterzuentwickeln, zu erweitern oder Funktionen zu ändern, wenn und soweit:</p>
  <ol>
    <li>dies aus technischen Gründen erforderlich ist (z. B. Sicherheit, Stabilität, Missbrauchsprävention),</li>
    <li>gesetzliche oder behördliche Vorgaben eine Anpassung erforderlich machen, oder</li>
    <li>die Änderung für den Kunden zumutbar ist und der Vertragszweck nicht wesentlich beeinträchtigt wird.</li>
  </ol>
  <p>(5) rentably kann einzelne Funktionen als Beta-/Testfunktionen bereitstellen. Beta-Funktionen können in der Verfügbarkeit, Qualität oder Kompatibilität eingeschränkt sein; dies stellt keinen Mangel dar, sofern rentably die Beta-Eigenschaft kenntlich macht.</p>
  <p>(6) Der Kunde ist verantwortlich für die technischen Voraussetzungen auf seiner Seite (insbesondere Endgerät, Browser, Internetzugang). Kosten für Datenverbindungen oder Providerleistungen sind nicht Bestandteil der Leistung.</p>
</section>

<section>
  <h2>§ 3 Registrierung, Zugangsdaten, Vertragsschluss</h2>
  <p>(1) Voraussetzung für die Nutzung ist eine Registrierung durch den Kunden und die Einrichtung eines Nutzerkontos. Der Kunde hat im Rahmen der Registrierung vollständige und wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.</p>
  <p>(2) Der Kunde ist verpflichtet, Zugangsdaten (Passwörter, API-Keys, Tokens) geheim zu halten, sorgfältig zu verwahren und vor dem Zugriff Dritter zu schützen. Der Kunde hat Passwörter in angemessenen Abständen zu ändern und bei Verdacht eines Missbrauchs unverzüglich Maßnahmen zur Sperrung/Änderung zu ergreifen.</p>
  <p>(3) Der Kunde darf Zugangsdaten nicht an unberechtigte Dritte weitergeben. Soweit rentably Mehrbenutzerkonten anbietet, sind Nutzerrollen und Berechtigungen innerhalb des Kundenkontos vom Kunden so zu verwalten, dass nur befugte Personen Zugriff erhalten.</p>
  <p>(4) Der Vertrag kommt zustande, indem der Kunde:</p>
  <ol>
    <li>im Online-Buchungsprozess eine Buchung abschließt und diese AGB akzeptiert, oder</li>
    <li>rentably ein Angebot des Kunden ausdrücklich annimmt (z. B. per E-Mail), oder</li>
    <li>rentably dem Kunden den Account freischaltet und die Nutzung ermöglicht.</li>
  </ol>
  <p>(5) rentably kann den Vertragsschluss von einer angemessenen Prüfung abhängig machen, insbesondere bei Auffälligkeiten, Missbrauchsverdacht oder Zahlungsausfallrisiko. In solchen Fällen kann rentably zusätzliche Informationen oder Sicherheiten verlangen.</p>
  <p>(6) Bonitäts-/Zahlungsrisikoprüfung (optional): Soweit rentably dem Kunden bestimmte Zahlungsarten (z. B. Lastschrift/Kreditkarte auf Rechnung, höhere Limits) einräumt, kann rentably zur Risikoprüfung Auskünfte bei Wirtschaftsauskunfteien einholen und – soweit rechtlich zulässig – negative Zahlungserfahrungen melden, sofern der Kunde hierüber vorab informiert wird.</p>
</section>

<section>
  <h2>§ 4 Preise, Zahlungsmodalitäten, Rechnungsstellung, Verzug</h2>
  <p>(1) Es gelten die im Buchungsprozess bzw. im jeweiligen Angebot ausgewiesenen Preise. Zusatzleistungen, Add-ons oder nutzungsabhängige Leistungen werden – sofern angeboten – gesondert berechnet.</p>
  <p>(2) Soweit nicht anders vereinbart, sind Entgelte im Voraus zu Beginn des jeweiligen Abrechnungszeitraums fällig. Nutzungsabhängige Entgelte werden – je nach Ausgestaltung – nachträglich abgerechnet.</p>
  <p>(3) Der Kunde kann nur mit den von rentably angebotenen Zahlungsmethoden zahlen (z. B. SEPA-Lastschrift, Kreditkarte, weitere im Checkout angezeigte Methoden). rentably ist berechtigt, einzelne Zahlungsarten ohne Angabe von Gründen auszuschließen oder von Voraussetzungen abhängig zu machen.</p>
  <p>(4) Rechnungen werden dem Kunden elektronisch zur Verfügung gestellt (z. B. im Kundenkonto oder per E-Mail). Der Kunde stimmt der elektronischen Rechnungsstellung zu.</p>
  <p>(5) Der Kunde kommt spätestens 14 Tage nach Zugang der Rechnung bzw. nach Mitteilung der Rechnungsbereitstellung in Verzug, ohne dass es einer Mahnung bedarf.</p>
  <p>(6) Im Verzugsfall ist rentably berechtigt:</p>
  <ol>
    <li>Verzugszinsen nach § 288 BGB zu verlangen,</li>
    <li>Mahnkosten bzw. angemessene Aufwände in Rechnung zu stellen,</li>
    <li>den Zugang zu sperren oder einzelne Funktionen zu suspendieren (vgl. § 5),</li>
    <li>bei wiederholtem oder erheblichem Verzug außerordentlich zu kündigen.</li>
  </ol>
  <p>(7) Rücklastschriften / Chargebacks: Bei vom Kunden zu vertretenden Rücklastschriften, Rückbuchungen oder abgelehnten Kreditkartenzahlungen kann rentably die dadurch entstehenden Bank-/Providerkosten sowie eine angemessene Bearbeitungspauschale verlangen, sofern der Nachweis eines geringeren Schadens dem Kunden möglich bleibt.</p>
  <p>(8) Einwendungen gegen Rechnungen sind innerhalb von 6 Wochen nach Zugang in Textform und substantiiert geltend zu machen. Unberührt bleiben zwingende gesetzliche Rechte (insbesondere bei Verbrauchern). Bei berechtigten Einwendungen wird rentably eine Korrektur vornehmen.</p>
  <p>(9) Aufrechnungs- und Zurückbehaltungsrechte stehen dem Kunden nur zu, sofern seine Gegenansprüche rechtskräftig festgestellt, unbestritten oder von rentably anerkannt sind.</p>
</section>

<section>
  <h2>§ 5 Sperrung, Suspendierung, Missbrauch, Sicherheitsmaßnahmen</h2>
  <p>(1) rentably ist berechtigt, den Zugang des Kunden vorübergehend zu sperren oder einzelne Leistungen zu suspendieren, wenn:</p>
  <ol>
    <li>der Kunde mit Zahlungen in Verzug ist (insbesondere wenn der Rückstand mindestens zwei periodischen Grundentgelten entspricht),</li>
    <li>ein erheblicher Verstoß gegen diese AGB vorliegt (z. B. rechtswidrige Inhalte, Missbrauch, Angriffe auf die Plattform),</li>
    <li>begründeter Verdacht auf Kompromittierung von Zugangsdaten oder unberechtigten Zugriff besteht,</li>
    <li>rentably aufgrund gesetzlicher Verpflichtungen, behördlicher Anordnung oder zur Abwehr von Sicherheitsrisiken handeln muss.</li>
  </ol>
  <p>(2) Eine Sperrung/Suspendierung lässt die Zahlungspflichten für laufzeitbezogene Entgelte unberührt, sofern die Sperrung auf einem vom Kunden zu vertretenden Umstand beruht.</p>
  <p>(3) rentably wird – soweit zumutbar – den Kunden vor einer Sperrung informieren und ihm Gelegenheit zur Abhilfe geben. Dies gilt nicht, wenn eine sofortige Maßnahme erforderlich ist (z. B. Sicherheitsvorfall, rechtswidrige Nutzung, Gefahr im Verzug).</p>
  <p>(4) Der Kunde bleibt verpflichtet, rentably alle Schäden zu ersetzen, die rentably durch eine vom Kunden zu vertretende missbräuchliche Nutzung oder durch Verletzung wesentlicher Pflichten entstehen (einschließlich angemessener Rechtsverfolgungskosten), sofern gesetzlich zulässig.</p>
</section>

<section>
  <h2>§ 6 Nutzungsrechte, Urheberrechte, Systemnutzung</h2>
  <p>(1) Mit Vertragsschluss erhält der Kunde ein einfaches, nicht ausschließliches, nicht übertragbares und auf die Dauer des Vertrags beschränktes Recht, die Plattform „rentably" im vertraglich vereinbarten Umfang zu nutzen.</p>
  <p>(2) Eine Überlassung der Plattform an Dritte außerhalb des eigenen Unternehmens bzw. außerhalb der eigenen Vermietungstätigkeit ist unzulässig, soweit dies nicht ausdrücklich im jeweiligen Paket vorgesehen ist.</p>
  <p>(3) Der Kunde ist insbesondere nicht berechtigt:</p>
  <ol>
    <li>die Software oder Teile hiervon zu vervielfältigen, zu verbreiten oder öffentlich zugänglich zu machen,</li>
    <li>Quellcode zu dekompilieren, zu disassemblieren oder anderweitig zurückzuentwickeln,</li>
    <li>die Plattform zu vermieten, weiterzuverkaufen oder als eigene Softwarelösung anzubieten,</li>
    <li>automatisierte Massenzugriffe (z. B. Scraping, Bots) vorzunehmen, sofern dies nicht ausdrücklich freigegeben ist.</li>
  </ol>
  <p>(4) Sämtliche Rechte an der Plattform, insbesondere Urheberrechte, Markenrechte, Datenbankrechte und sonstige gewerbliche Schutzrechte verbleiben ausschließlich bei rentably.</p>
  <p>(5) Der Kunde räumt rentably ein einfaches, zeitlich auf die Vertragslaufzeit beschränktes Recht ein, die vom Kunden eingegebenen Daten technisch zu verarbeiten, zu speichern und im Rahmen der Vertragserfüllung zu nutzen.</p>
</section>

<section>
  <h2>§ 7 Mieterzugang, Rollen- und Rechteverwaltung</h2>
  <p>(1) rentably stellt dem Kunden – je nach gebuchtem Leistungsumfang – die Möglichkeit zur Verfügung, Mieter oder sonstige Nutzer (z. B. Dienstleister) in das System einzuladen.</p>
  <p>(2) Zwischen rentably und dem Mieter kommt grundsätzlich kein eigenständiger entgeltlicher Vertrag zustande, sofern nicht ausdrücklich anders geregelt.</p>
  <p>(3) Der Kunde ist allein verantwortlich für:</p>
  <ol>
    <li>die Auswahl und Einladung von Mietern,</li>
    <li>die Vergabe und Verwaltung von Rollen und Zugriffsrechten,</li>
    <li>die Rechtmäßigkeit der Datenübermittlung an Mieter.</li>
  </ol>
  <p>(4) rentably ist nicht verpflichtet, die vom Kunden freigegebenen Inhalte oder Zugriffe zu überprüfen.</p>
  <p>(5) Verstößt ein Mieter gegen gesetzliche Vorschriften oder diese AGB, ist rentably berechtigt, den entsprechenden Zugang zu sperren.</p>
</section>

<section>
  <h2>§ 8 Pflichten des Kunden, zulässige Nutzung</h2>
  <p>(1) Der Kunde verpflichtet sich, die Plattform ausschließlich im Rahmen der gesetzlichen Vorschriften sowie dieser AGB zu nutzen.</p>
  <p>(2) Es ist insbesondere untersagt:</p>
  <ol>
    <li>rechtswidrige Inhalte einzustellen oder zu verbreiten,</li>
    <li>Inhalte einzustellen, die Rechte Dritter verletzen (z. B. Urheberrechte, Markenrechte, Persönlichkeitsrechte),</li>
    <li>die Plattform für betrügerische oder sittenwidrige Zwecke zu verwenden,</li>
    <li>technische Angriffe oder Manipulationen vorzunehmen,</li>
    <li>Sicherheitsmechanismen zu umgehen.</li>
  </ol>
  <p>(3) Der Kunde ist allein verantwortlich für die Richtigkeit, Vollständigkeit und Rechtmäßigkeit der von ihm eingegebenen Daten.</p>
  <p>(4) Der Kunde stellt rentably von sämtlichen Ansprüchen Dritter frei, die aufgrund einer rechtswidrigen Nutzung durch den Kunden entstehen, sofern der Kunde die Rechtsverletzung zu vertreten hat.</p>
</section>

<section>
  <h2>§ 9 Formulare, Vorlagen, automatisiert generierte Inhalte</h2>
  <p>(1) rentably kann dem Kunden Vorlagen oder automatisiert generierte Dokumente (z. B. Mietverträge, Nebenkostenabrechnungen, Anschreiben, Berechnungen) zur Verfügung stellen.</p>
  <p>(2) Diese Dokumente stellen ausschließlich unverbindliche Muster dar.</p>
  <p>(3) Sie ersetzen keine anwaltliche oder steuerliche Beratung.</p>
  <p>(4) rentably übernimmt keine Gewähr dafür, dass generierte Dokumente:</p>
  <ul>
    <li>rechtlich wirksam,</li>
    <li>vollständig,</li>
    <li>individuell geeignet oder</li>
    <li>frei von Fehlern sind.</li>
  </ul>
  <p>(5) Die Nutzung erfolgt auf eigene Verantwortung des Kunden.</p>
  <p>(6) Soweit Berechnungen oder Kennzahlen angezeigt werden (z. B. Cashflow, Renditen), handelt es sich um rein rechnerische Darstellungen auf Grundlage der vom Kunden eingegebenen Daten. Eine Haftung für wirtschaftliche Entscheidungen wird ausgeschlossen, soweit gesetzlich zulässig.</p>
</section>

<section>
  <h2>§ 10 Verfügbarkeit, Wartung, höhere Gewalt</h2>
  <p>(1) rentably gewährleistet eine durchschnittliche Systemverfügbarkeit von 95 % im Jahresmittel.</p>
  <p>(2) Nicht als Ausfallzeiten gelten insbesondere:</p>
  <ol>
    <li>Wartungsarbeiten,</li>
    <li>Updates und Sicherheitsmaßnahmen,</li>
    <li>Störungen außerhalb des Einflussbereichs von rentably,</li>
    <li>höhere Gewalt (z. B. Streik, Naturereignisse, behördliche Maßnahmen),</li>
    <li>Ausfälle von Internet- oder Telekommunikationsanbietern.</li>
  </ol>
  <p>(3) Wartungsarbeiten werden – soweit möglich – vorab im Kundenportal angekündigt.</p>
  <p>(4) rentably schuldet keine unterbrechungsfreie oder fehlerfreie Verfügbarkeit.</p>
</section>

<section>
  <h2>§ 11 Datenschutz und Auftragsverarbeitung</h2>
  <p>(1) rentably verarbeitet personenbezogene Daten im Einklang mit der DSGVO.</p>
  <p>(2) Soweit rentably personenbezogene Daten im Auftrag des Kunden verarbeitet (insbesondere Mieterdaten), handeln die Parteien als Verantwortlicher (Kunde) und Auftragsverarbeiter (rentably).</p>
  <p>(3) Eine gesonderte Vereinbarung zur Auftragsverarbeitung (AVV) wird Bestandteil des Vertrages.</p>
  <p>(4) Der Kunde ist verantwortlich für:</p>
  <ol>
    <li>die Rechtmäßigkeit der Datenerhebung,</li>
    <li>die Erfüllung von Informationspflichten,</li>
    <li>die Einholung erforderlicher Einwilligungen.</li>
  </ol>
  <p>(5) rentably haftet nicht für Datenschutzverstöße, die auf einer rechtswidrigen Nutzung durch den Kunden beruhen.</p>
</section>

<section>
  <h2>§ 12 Änderungen der AGB, Leistungsänderungen, Preisänderungen, Mitteilungen über das Kundenportal</h2>
  <p>(1) rentably ist berechtigt, diese AGB sowie Leistungsbeschreibungen und Preise mit Wirkung für die Zukunft zu ändern. Sachliche Gründe könnten insbesondere hierfür sein:</p>
  <ul>
    <li>technische Weiterentwicklungen,</li>
    <li>Anpassung an gesetzliche Änderungen,</li>
    <li>Sicherheitsanforderungen,</li>
    <li>Kostenentwicklungen,</li>
    <li>Erweiterung oder Reduzierung von Funktionen.</li>
  </ul>
  <p>(2) Änderungen werden dem Kunden mindestens 14 Tage vor Inkrafttreten in Textform mitgeteilt. Die Mitteilung kann erfolgen:</p>
  <ul>
    <li>per E-Mail,</li>
    <li>durch Nachricht im Kundenportal,</li>
    <li>durch Einstellung im Kundenkonto.</li>
  </ul>
  <p>(3) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde. Sie gilt spätestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom Kunden nicht abgerufen wurde.</p>
  <p>(4) Der Kunde ist verpflichtet, sein Kundenkonto regelmäßig auf Mitteilungen zu überprüfen.</p>
  <p>(5) Widerspricht der Kunde einer Änderung nicht innerhalb von 14 Tagen nach Zugang in Textform, gelten die Änderungen als genehmigt.</p>
  <p>(6) Widerspricht der Kunde fristgerecht, gelten die bisherigen AGB bzw. Preise unverändert fort.</p>
  <p>(7) Das allgemeine vertragliche Kündigungsrecht der Parteien bleibt unberührt.</p>
</section>

<section>
  <h2>§ 13 Haftung</h2>
  <p>(1) rentably haftet – gleich aus welchem Rechtsgrund – im Rahmen der gesetzlichen Vorschriften nur nach Maßgabe der folgenden Bestimmungen.</p>
  <p>(2) Unbeschränkte Haftung besteht bei:</p>
  <ol>
    <li>Vorsatz oder grober Fahrlässigkeit,</li>
    <li>Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit,</li>
    <li>Ansprüchen nach dem Produkthaftungsgesetz,</li>
    <li>Übernahme einer ausdrücklichen Garantie.</li>
  </ol>
  <p>(3) Bei leichter Fahrlässigkeit haftet rentably nur bei Verletzung einer wesentlichen Vertragspflicht (sog. Kardinalpflicht).</p>
  <p>Wesentliche Vertragspflichten sind solche, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Kunde regelmäßig vertrauen darf.</p>
  <p>(4) In diesen Fällen ist die Haftung auf den bei Vertragsschluss vorhersehbaren, vertragstypischen Schaden begrenzt.</p>
  <p>(5) Eine Haftung für:</p>
  <ul>
    <li>entgangenen Gewinn,</li>
    <li>mittelbare Schäden,</li>
    <li>Folgeschäden,</li>
    <li>Datenverlust, soweit der Kunde keine angemessene Datensicherung vorgenommen hat,</li>
    <li>wirtschaftliche Fehlentscheidungen des Kunden,</li>
  </ul>
  <p>ist bei leichter Fahrlässigkeit ausgeschlossen.</p>
  <p>(6) rentably haftet nicht für:</p>
  <ol>
    <li>Inhalte des Kunden oder von Mietern,</li>
    <li>rechtliche Wirksamkeit von Musterdokumenten,</li>
    <li>Unterbrechungen durch höhere Gewalt,</li>
    <li>Ausfälle von Telekommunikations- oder Hosting-Dienstleistern außerhalb des Einflussbereichs von rentably,</li>
    <li>missbräuchliche Verwendung von Zugangsdaten durch Dritte, sofern rentably kein Verschulden trifft.</li>
  </ol>
  <p>(7) Soweit die Haftung von rentably ausgeschlossen oder beschränkt ist, gilt dies auch zugunsten der gesetzlichen Vertreter, Mitarbeiter und Erfüllungsgehilfen.</p>
  <p>(8) Schadensersatzansprüche verjähren innerhalb der gesetzlichen Fristen.</p>
</section>

<section>
  <h2>§ 14 Vertragslaufzeit, Verlängerung und Kündigung</h2>
  <p>(1) Die Vertragslaufzeit ergibt sich aus dem vom Kunden gewählten Abrechnungszeitraum (monatlich oder jährlich).</p>
  <p>(2) Der Vertrag verlängert sich automatisch um die jeweils vereinbarte Laufzeit, sofern er nicht mit einer Frist von 14 Tagen zum Ende der jeweiligen Laufzeit gekündigt wird.</p>
  <p>(3) Kündigungen bedürfen mindestens der Textform (z. B. E-Mail oder Kündigungsfunktion im Kundenkonto).</p>
  <p>(4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.</p>
  <p>(5) Ein wichtiger Grund liegt insbesondere vor, wenn:</p>
  <ol>
    <li>der Kunde mit zwei periodischen Entgelten in Verzug ist,</li>
    <li>der Kunde trotz Abmahnung gegen wesentliche Vertragspflichten verstößt,</li>
    <li>der Kunde die Plattform rechtswidrig nutzt,</li>
    <li>über das Vermögen des Kunden ein Insolvenzverfahren eröffnet oder mangels Masse abgelehnt wird,</li>
    <li>erhebliche und nachvollziehbare Anhaltspunkte für strafbare oder sittenwidrige Nutzung bestehen.</li>
  </ol>
  <p>(6) Im Falle einer wirksamen Kündigung wird der Zugang des Kunden zum Vertragsende deaktiviert.</p>
  <p>(7) rentably ist berechtigt, nach Vertragsende die gespeicherten Daten des Kunden nach Ablauf einer angemessenen Übergangsfrist zu löschen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>
  <p>(8) Der Kunde ist selbst verantwortlich, seine Daten rechtzeitig vor Vertragsende zu exportieren oder zu sichern.</p>
</section>

<section>
  <h2>§ 15 Referenznennung</h2>
  <p>(1) rentably ist berechtigt, den Kunden als Referenzkunden zu benennen, insbesondere unter Verwendung des Firmennamens und Logos auf der Website oder in Präsentationen.</p>
  <p>(2) Der Kunde kann dieser Nutzung jederzeit in Textform widersprechen.</p>
</section>

<section>
  <h2>§ 16 Mitteilungen über das Kundenportal</h2>
  <p>(1) Sämtliche vertragsrelevanten Mitteilungen können von rentably über das Kundenportal übermittelt werden.</p>
  <p>(2) Eine Mitteilung gilt als zugegangen, sobald sie im Kundenkonto eingestellt wurde.</p>
  <p>(3) Sie gilt spätestens zwei Wochen nach Einstellung als zugegangen, auch wenn sie vom Kunden nicht abgerufen wurde.</p>
  <p>(4) Der Kunde verpflichtet sich, sein Kundenkonto regelmäßig auf neue Mitteilungen zu überprüfen.</p>
</section>

<section>
  <h2>§ 17 Gerichtsstand, Rechtswahl</h2>
  <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
  <p>(2) Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand Berlin.</p>
</section>

<section>
  <h2>§ 18 Salvatorische Klausel</h2>
  <p>(1) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
  <p>(2) Anstelle der unwirksamen Regelung tritt eine solche, die dem wirtschaftlichen Zweck der ursprünglichen Regelung möglichst nahekommt.</p>
</section>
$agb$
WHERE slug = 'agb';

-- ============================================================
-- Datenschutz
-- ============================================================
UPDATE cms_pages SET content = $ds$
<section>
  <h2>1. Datenschutz auf einen Blick</h2>
  <h3>Allgemeine Hinweise</h3>
  <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.</p>
  <h3>Datenerfassung auf unserer Website</h3>
  <p><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
  <p>Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.</p>
  <p><strong>Wie erfassen wir Ihre Daten?</strong></p>
  <p>Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.</p>
  <p>Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt automatisch, sobald Sie unsere Website betreten.</p>
  <p><strong>Wofür nutzen wir Ihre Daten?</strong></p>
  <p>Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.</p>
  <p><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong></p>
  <p>Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.</p>
</section>

<section>
  <h2>2. Allgemeine Hinweise und Pflichtinformationen</h2>
  <h3>Datenschutz</h3>
  <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
  <p>Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben. Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.</p>
  <p>Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch Dritte ist nicht möglich.</p>
  <h3>Hinweis zur verantwortlichen Stelle</h3>
  <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
  <p>sober care GmbH<br>Pappelallee 78/79<br>10437 Berlin<br><br>E-Mail: hallo@rentab.ly</p>
  <p>Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o. Ä.) entscheidet.</p>
  <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
  <p>Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.</p>
  <h3>Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
  <p>Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in datenschutzrechtlichen Fragen ist der Landesdatenschutzbeauftragte des Bundeslandes, in dem unser Unternehmen seinen Sitz hat.</p>
  <h3>Recht auf Datenübertragbarkeit</h3>
  <p>Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.</p>
  <h3>Auskunft, Sperrung, Löschung</h3>
  <p>Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.</p>
</section>

<section>
  <h2>3. Datenerfassung auf unserer Website</h2>
  <h3>Cookies</h3>
  <p>Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.</p>
  <p>Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch wiederzuerkennen.</p>
  <h3>Server-Log-Dateien</h3>
  <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:</p>
  <ul>
    <li>Browsertyp und Browserversion</li>
    <li>verwendetes Betriebssystem</li>
    <li>Referrer URL</li>
    <li>Hostname des zugreifenden Rechners</li>
    <li>Uhrzeit der Serveranfrage</li>
    <li>IP-Adresse</li>
  </ul>
  <p>Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.</p>
  <p>Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.</p>
  <h3>Kontaktformular</h3>
  <p>Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.</p>
  <h3>Registrierung auf dieser Website</h3>
  <p>Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes, für den Sie sich registriert haben. Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. Anderenfalls werden wir die Registrierung ablehnen.</p>
  <p>Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.</p>
</section>

<section>
  <h2>4. Analyse Tools und Werbung</h2>
  <h3>Google Analytics</h3>
  <p>Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.</p>
  <p>Google Analytics verwendet so genannte "Cookies". Das sind Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert.</p>
</section>

<section>
  <h2>5. Newsletter</h2>
  <p>Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind. Weitere Daten werden nicht bzw. nur auf freiwilliger Basis erhoben. Diese Daten verwenden wir ausschließlich für den Versand der angeforderten Informationen und geben diese nicht an Dritte weiter.</p>
  <p>Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung zum Versand des Newsletters können Sie jederzeit widerrufen, etwa über den "Austragen"-Link im Newsletter.</p>
</section>
$ds$
WHERE slug = 'datenschutz';

-- ============================================================
-- AVV
-- ============================================================
UPDATE cms_pages SET content = $avv$
<section>
  <h2>Präambel</h2>
  <p>Diese Vereinbarung regelt die Auftragsverarbeitung personenbezogener Daten durch die sober care GmbH (nachfolgend "Auftragsverarbeiter") im Auftrag des Kunden (nachfolgend "Verantwortlicher") gemäß Art. 28 der Datenschutz-Grundverordnung (DSGVO).</p>
  <p>Der Auftragsverarbeiter verarbeitet personenbezogene Daten nur im Rahmen der dokumentierten Weisungen des Verantwortlichen, es sei denn, er ist durch das Recht der Union oder der Mitgliedstaaten, dem der Auftragsverarbeiter unterliegt, hierzu verpflichtet.</p>
</section>

<section>
  <h2>1. Gegenstand und Dauer der Auftragsverarbeitung</h2>
  <h3>1.1 Gegenstand</h3>
  <p>Gegenstand der Auftragsverarbeitung ist die Bereitstellung einer cloudbasierten Immobilienverwaltungssoftware (Software-as-a-Service). Der Auftragsverarbeiter erbringt für den Verantwortlichen folgende Leistungen:</p>
  <ul>
    <li>Hosting und Betrieb der Softwareplattform</li>
    <li>Speicherung und Verarbeitung von Immobilien- und Mieterdaten</li>
    <li>Bereitstellung von Analyse- und Reporting-Funktionen</li>
    <li>Technischer Support und Wartung</li>
    <li>Datensicherung und -wiederherstellung</li>
  </ul>
  <h3>1.2 Dauer</h3>
  <p>Die Laufzeit dieser Vereinbarung entspricht der Laufzeit des Hauptvertrags zwischen dem Verantwortlichen und dem Auftragsverarbeiter.</p>
</section>

<section>
  <h2>2. Art und Zweck der Verarbeitung</h2>
  <h3>2.1 Art der Verarbeitung</h3>
  <p>Der Auftragsverarbeiter führt folgende Verarbeitungstätigkeiten durch:</p>
  <ul>
    <li>Erhebung, Erfassung und Speicherung</li>
    <li>Organisation und Strukturierung</li>
    <li>Aufbewahrung und Anpassung</li>
    <li>Auslesen, Abfragen und Verwendung</li>
    <li>Übermittlung durch Bereitstellung</li>
    <li>Abgleich und Verknüpfung</li>
    <li>Einschränkung und Löschung</li>
  </ul>
  <h3>2.2 Zweck der Verarbeitung</h3>
  <p>Die Verarbeitung erfolgt ausschließlich zum Zweck der Verwaltung von Immobilien und Mietverhältnissen durch den Verantwortlichen sowie zur Erfüllung der vertraglichen Pflichten gegenüber dem Verantwortlichen.</p>
</section>

<section>
  <h2>3. Kategorien betroffener Personen und Daten</h2>
  <h3>3.1 Kategorien betroffener Personen</h3>
  <ul>
    <li>Mieter und Mietinteressenten</li>
    <li>Eigentümer von Immobilien</li>
    <li>Mitarbeiter des Verantwortlichen</li>
    <li>Dienstleister und Handwerker</li>
    <li>Kontaktpersonen bei Behörden und Versorgern</li>
  </ul>
  <h3>3.2 Kategorien personenbezogener Daten</h3>
  <ul>
    <li>Stammdaten (Name, Adresse, Geburtsdatum)</li>
    <li>Kontaktdaten (E-Mail, Telefon)</li>
    <li>Vertragsdaten (Mietverträge, Vertragskonditionen)</li>
    <li>Zahlungsdaten (Bankverbindungen, Zahlungshistorie)</li>
    <li>Dokumente (Ausweise, Gehaltsnachweise, Schufa-Auskünfte)</li>
    <li>Kommunikationsdaten (Nachrichten, Tickets)</li>
  </ul>
</section>

<section>
  <h2>4. Technische und organisatorische Maßnahmen</h2>
  <p>Der Auftragsverarbeiter hat folgende technische und organisatorische Maßnahmen zur Gewährleistung eines dem Risiko angemessenen Schutzniveaus getroffen:</p>
  <h3>4.1 Vertraulichkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
  <ul>
    <li>Zutrittskontrolle: Rechenzentren mit Zugangskontrollen und Überwachungssystemen</li>
    <li>Zugangskontrolle: Mehrfaktor-Authentifizierung für administrative Zugriffe</li>
    <li>Zugriffskontrolle: Rollenbasierte Zugriffsrechte und Berechtigungskonzepte</li>
    <li>Trennungskontrolle: Logische Trennung von Kundendaten</li>
    <li>Pseudonymisierung: Wo möglich werden Daten pseudonymisiert verarbeitet</li>
  </ul>
  <h3>4.2 Integrität (Art. 32 Abs. 1 lit. b DSGVO)</h3>
  <ul>
    <li>Weitergabekontrolle: Verschlüsselte Datenübertragung (TLS 1.3)</li>
    <li>Eingabekontrolle: Protokollierung von Datenänderungen</li>
    <li>Transportkontrolle: Verschlüsselte Backups</li>
  </ul>
  <h3>4.3 Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b DSGVO)</h3>
  <ul>
    <li>Verfügbarkeitskontrolle: Redundante Systeme und automatisches Failover</li>
    <li>Rasche Wiederherstellbarkeit: Tägliche Backups mit verschlüsselter Speicherung</li>
  </ul>
  <h3>4.4 Verfahren zur regelmäßigen Überprüfung (Art. 32 Abs. 1 lit. d DSGVO)</h3>
  <ul>
    <li>Datenschutz-Management: Regelmäßige Überprüfung und Aktualisierung der Maßnahmen</li>
    <li>Incident-Response: Notfallpläne für Datenschutzverletzungen</li>
    <li>Datenschutzfreundliche Voreinstellungen: Privacy by Design und by Default</li>
  </ul>
</section>

<section>
  <h2>5. Berichtigung, Löschung und Sperrung von Daten</h2>
  <p>Der Auftragsverarbeiter darf die zur Verarbeitung überlassenen Daten nicht eigenständig berichtigen, löschen oder sperren. Dies erfolgt ausschließlich auf dokumentierte Weisung des Verantwortlichen.</p>
  <p>Der Verantwortliche kann über die Benutzeroberfläche der Software jederzeit selbständig Berichtigungen, Löschungen und Sperrungen vornehmen.</p>
</section>

<section>
  <h2>6. Unterauftragsverhältnisse</h2>
  <p>Der Verantwortliche erteilt dem Auftragsverarbeiter mit Unterzeichnung dieser Vereinbarung seine generelle Genehmigung zur Beauftragung von Subunternehmern (Unterauftragsverarbeiter).</p>
  <p>Der Auftragsverarbeiter nutzt folgende Unterauftragsverarbeiter:</p>
  <ul>
    <li><strong>Supabase Inc.</strong> – Datenbankhosting und Backend-Services (Standort: USA, Standardvertragsklauseln gemäß Art. 46 DSGVO)</li>
    <li><strong>Vercel Inc.</strong> – Hosting der Webanwendung (Standort: USA, Standardvertragsklauseln gemäß Art. 46 DSGVO)</li>
  </ul>
  <p>Der Auftragsverarbeiter verpflichtet sich, den Verantwortlichen über beabsichtigte Änderungen in Bezug auf die Hinzuziehung oder die Ersetzung von Unterauftragsverarbeitern zu informieren.</p>
</section>

<section>
  <h2>7. Pflichten des Verantwortlichen</h2>
  <p>Der Verantwortliche ist verpflichtet:</p>
  <ul>
    <li>Nur rechtmäßig erhobene Daten an den Auftragsverarbeiter zu übermitteln</li>
    <li>Die betroffenen Personen über die Datenverarbeitung zu informieren</li>
    <li>Die Rechtmäßigkeit der Datenverarbeitung sicherzustellen</li>
    <li>Erforderliche Einwilligungen einzuholen, soweit erforderlich</li>
  </ul>
</section>

<section>
  <h2>8. Mitwirkungspflichten</h2>
  <p>Der Auftragsverarbeiter unterstützt den Verantwortlichen mit geeigneten technischen und organisatorischen Maßnahmen dabei, seinen Pflichten gemäß Art. 32 bis 36 DSGVO nachzukommen.</p>
  <p>Soweit der Verantwortliche hierzu verpflichtet ist, unterstützt der Auftragsverarbeiter diesen bei der Durchführung von Datenschutz-Folgenabschätzungen und der vorherigen Konsultation der Aufsichtsbehörde.</p>
</section>

<section>
  <h2>9. Kontrollrechte des Verantwortlichen</h2>
  <p>Der Verantwortliche hat das Recht, beim Auftragsverarbeiter Kontrollen durchzuführen oder durch einen unabhängigen und zur Verschwiegenheit verpflichteten Dritten durchführen zu lassen.</p>
  <p>Der Auftragsverarbeiter stellt dem Verantwortlichen auf Anfrage alle Informationen zur Verfügung, die zum Nachweis der Einhaltung der in diesem Vertrag niedergelegten Pflichten erforderlich sind.</p>
</section>

<section>
  <h2>10. Mitteilung bei Verstößen</h2>
  <p>Der Auftragsverarbeiter benachrichtigt den Verantwortlichen unverzüglich, wenn ihm eine Verletzung des Schutzes personenbezogener Daten bekannt wird.</p>
  <p>Die Meldung muss mindestens folgende Informationen enthalten:</p>
  <ul>
    <li>Beschreibung der Art der Verletzung</li>
    <li>Kategorien und ungefähre Anzahl betroffener Personen und Datensätze</li>
    <li>Name und Kontaktdaten des Datenschutzbeauftragten</li>
    <li>Beschreibung der wahrscheinlichen Folgen</li>
    <li>Beschreibung der ergriffenen oder vorgeschlagenen Maßnahmen</li>
  </ul>
</section>

<section>
  <h2>11. Löschung und Rückgabe von Daten</h2>
  <p>Nach Beendigung der Vertragsbeziehung löscht der Auftragsverarbeiter alle im Auftrag verarbeiteten personenbezogenen Daten und vorhandene Kopien, soweit nicht gesetzliche Aufbewahrungspflichten einer Löschung entgegenstehen.</p>
  <p>Auf Wunsch des Verantwortlichen werden die Daten vor der Löschung in einem gängigen, maschinenlesbaren Format zur Verfügung gestellt.</p>
</section>

<section>
  <h2>12. Haftung und Schadensersatz</h2>
  <p>Für Schäden, die der Verantwortliche aufgrund der Auftragsverarbeitung erleidet, haftet der Auftragsverarbeiter gemäß den im Hauptvertrag geregelten Haftungsbestimmungen.</p>
  <p>Bei datenschutzrechtlichen Verstößen haftet der Auftragsverarbeiter gegenüber dem Verantwortlichen gemäß Art. 82 DSGVO.</p>
</section>
$avv$
WHERE slug = 'avv';

-- ============================================================
-- Impressum
-- ============================================================
UPDATE cms_pages SET content = $imp$
<div>
  <h2>Unternehmen</h2>
  <p><strong>sober care GmbH</strong></p>
  <p>Pappelallee 78/79</p>
  <p>10437 Berlin</p>
</div>

<div>
  <h2>Kontakt</h2>
  <p>E-Mail: <a href="mailto:hallo@rentab.ly">hallo@rentab.ly</a></p>
</div>

<div>
  <h2>Rechtliche Angaben</h2>
  <p><strong>Geschäftsführer:</strong> Simon Schier, Philipp Roth</p>
  <p><strong>Sitz der Gesellschaft:</strong> Berlin</p>
  <p><strong>Registereintrag:</strong> Amtsgericht Berlin, HRB 186868 B</p>
  <p><strong>Umsatzsteuer-Identifikationsnummer:</strong> DE 815698820</p>
</div>

<div>
  <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</h3>
  <p>Simon Schier, Philipp Roth</p>
  <p>Pappelallee 78/79, 10437 Berlin</p>
</div>

<div>
  <h3>Haftungsausschluss</h3>
  <h4>Haftung für Inhalte</h4>
  <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
  <h4>Haftung für Links</h4>
  <p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.</p>
  <h4>Urheberrecht</h4>
  <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
</div>
$imp$
WHERE slug = 'impressum';
