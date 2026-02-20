import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import SeoHead from "../components/SeoHead";
import CmsPageWrapper from "../components/CmsPageWrapper";

export function Datenschutz() {
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
              Datenschutzerklärung
            </h1>
            <p className="mt-4 text-gray-500 text-lg">
              Stand: Februar 2026
            </p>
          </div>
        </section>

        <section className="pb-24 px-6">
          <div className="max-w-[800px] mx-auto">
            <CmsPageWrapper slug="datenschutz" fallback={<DatenschutzFallbackContent />} />

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

function DatenschutzFallbackContent() {
  return (
    <div className="space-y-12">
      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">1. Datenschutz auf einen Blick</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Allgemeine Hinweise</h3>
        <p className="text-gray-600 leading-relaxed">
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
          Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit
          denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz
          entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Datenerfassung auf unserer Website</h3>
        <p className="text-gray-600 leading-relaxed font-semibold">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</p>
        <p className="text-gray-600 leading-relaxed">
          Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten
          können Sie dem Impressum dieser Website entnehmen.
        </p>

        <p className="text-gray-600 leading-relaxed font-semibold mt-4">Wie erfassen wir Ihre Daten?</p>
        <p className="text-gray-600 leading-relaxed">
          Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich
          z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind
          vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
          Die Erfassung dieser Daten erfolgt automatisch, sobald Sie unsere Website betreten.
        </p>

        <p className="text-gray-600 leading-relaxed font-semibold mt-4">Wofür nutzen wir Ihre Daten?</p>
        <p className="text-gray-600 leading-relaxed">
          Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten.
          Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
        </p>

        <p className="text-gray-600 leading-relaxed font-semibold mt-4">Welche Rechte haben Sie bezüglich Ihrer Daten?</p>
        <p className="text-gray-600 leading-relaxed">
          Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer
          gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung,
          Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema
          Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
          Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">2. Allgemeine Hinweise und Pflichtinformationen</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Datenschutz</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln
          Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften
          sowie dieser Datenschutzerklärung.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
          Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die
          vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen.
          Sie erläutert auch, wie und zu welchem Zweck das geschieht.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per
          E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch
          Dritte ist nicht möglich.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Hinweis zur verantwortlichen Stelle</h3>
        <p className="text-gray-600 leading-relaxed">
          Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-2 text-gray-600 leading-relaxed">
          sober care GmbH<br />
          Pappelallee 78/79<br />
          10437 Berlin<br />
          <br />
          E-Mail: hallo@rentab.ly
        </div>
        <p className="text-gray-600 leading-relaxed mt-4">
          Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit
          anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen,
          E-Mail-Adressen o. Ä.) entscheidet.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
        <p className="text-gray-600 leading-relaxed">
          Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie
          können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose
          Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung
          bleibt vom Widerruf unberührt.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
        <p className="text-gray-600 leading-relaxed">
          Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der
          zuständigen Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in datenschutzrechtlichen Fragen ist
          der Landesdatenschutzbeauftragte des Bundeslandes, in dem unser Unternehmen seinen Sitz hat.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Recht auf Datenübertragbarkeit</h3>
        <p className="text-gray-600 leading-relaxed">
          Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines
          Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen,
          maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an
          einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Auskunft, Sperrung, Löschung</h3>
        <p className="text-gray-600 leading-relaxed">
          Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche
          Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den
          Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser
          Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit
          unter der im Impressum angegebenen Adresse an uns wenden.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">3. Datenerfassung auf unserer Website</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookies</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner
          keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher,
          effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt
          werden und die Ihr Browser speichert.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach
          Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis
          Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch
          wiederzuerkennen.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Server-Log-Dateien</h3>
        <p className="text-gray-600 leading-relaxed">
          Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
          Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Browsertyp und Browserversion</li>
          <li>verwendetes Betriebssystem</li>
          <li>Referrer URL</li>
          <li>Hostname des zugreifenden Rechners</li>
          <li>Uhrzeit der Serveranfrage</li>
          <li>IP-Adresse</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-4">
          Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO, der die Verarbeitung von Daten
          zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Kontaktformular</h3>
        <p className="text-gray-600 leading-relaxed">
          Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
          Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der
          Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne
          Ihre Einwilligung weiter.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Registrierung auf dieser Website</h3>
        <p className="text-gray-600 leading-relaxed">
          Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu
          nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen
          Angebotes oder Dienstes, für den Sie sich registriert haben. Die bei der Registrierung abgefragten
          Pflichtangaben müssen vollständig angegeben werden. Anderenfalls werden wir die Registrierung
          ablehnen.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen
          wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">4. Analyse Tools und Werbung</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Google Analytics</h3>
        <p className="text-gray-600 leading-relaxed">
          Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google
          Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Google Analytics verwendet so genannte "Cookies". Das sind Textdateien, die auf Ihrem Computer
          gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch
          den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen
          Server von Google in den USA übertragen und dort gespeichert.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">5. Einsatz von Meta-Technologien (Facebook)</h2>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">Meta Pixel (ehemals Facebook Pixel)</h3>
        <p className="text-gray-600 leading-relaxed">
          Wir nutzen auf unserer Website das Meta Pixel (ehemals Facebook Pixel) der Meta Platforms Ireland Limited,
          4 Grand Canal Square, Grand Canal Harbour, Dublin 2, Irland ("Meta"). Das Meta Pixel ist ein
          JavaScript-Code-Snippet, das auf unserer Website eingebunden ist.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Das Meta Pixel ermöglicht es uns, das Verhalten von Nutzern nachzuverfolgen, nachdem diese durch Klicken
          auf eine Meta-Werbeanzeige (Facebook oder Instagram) auf unsere Website weitergeleitet wurden. Dadurch
          können wir die Wirksamkeit der Meta-Werbeanzeigen für statistische und Marktforschungszwecke erfassen
          und zukünftige Werbemaßnahmen optimieren.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Die erhobenen Daten sind für uns als Betreiber dieser Website anonym, wir können keine Rückschlüsse auf
          die Identität der Nutzer ziehen. Die Daten werden jedoch von Meta gespeichert und verarbeitet, sodass eine
          Verbindung zum jeweiligen Nutzerprofil möglich ist und Meta die Daten für eigene Werbezwecke, entsprechend
          der Meta-Datenverwendungsrichtlinie, verwenden kann.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Cookies durch Meta-Technologien</h3>
        <p className="text-gray-600 leading-relaxed">
          Im Rahmen der Nutzung des Meta Pixels werden Cookies auf Ihrem Endgerät gesetzt. Diese Cookies dienen
          dazu, Ihren Webbrowser wiederzuerkennen, die Nutzung unserer Website zu erfassen und unsere
          Werbeanzeigen auf den Plattformen von Meta (Facebook, Instagram, Messenger, Audience Network) zu
          optimieren. Folgende Cookies können gesetzt werden:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li><strong>_fbp</strong> &ndash; Cookie zur Identifikation von Browsern, die unsere Website besuchen. Speicherdauer: 90 Tage.</li>
          <li><strong>_fbc</strong> &ndash; Cookie zur Speicherung des letzten Klicks auf eine Meta-Werbeanzeige. Speicherdauer: 90 Tage.</li>
          <li><strong>fr</strong> &ndash; Cookie von Meta zur Bereitstellung und Messung von Werbeanzeigen. Speicherdauer: 90 Tage.</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Conversions API</h3>
        <p className="text-gray-600 leading-relaxed">
          Ergänzend zum Meta Pixel nutzen wir ggf. die Meta Conversions API. Hierbei werden bestimmte
          Nutzerinteraktionen (z.B. Registrierung, Kontaktanfrage) serverseitig an Meta übermittelt, um die
          Messgenauigkeit zu verbessern und unsere Werbeanzeigen effektiver auszusteuern.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Custom Audiences und Lookalike Audiences</h3>
        <p className="text-gray-600 leading-relaxed">
          Wir nutzen die Meta-Funktion "Custom Audiences", um unsere Werbeanzeigen gezielt an bestehende
          Nutzer oder Websitebesucher auszurichten. Zudem nutzen wir ggf. "Lookalike Audiences", um
          Werbeanzeigen Personen anzuzeigen, die ähnliche Merkmale wie unsere bestehenden Nutzer aufweisen.
          Diese Datenverarbeitung erfolgt ausschließlich auf Basis gehashter Daten, sodass Meta keinen
          Zugriff auf Klartext-Daten erhält.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Zwecke der Verarbeitung</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Nutzung der Meta-Technologien erfolgt zu folgenden Zwecken:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Auswertung und Optimierung unserer Werbeanzeigen auf Meta-Plattformen</li>
          <li>Erstellung von Zielgruppen für Werbeanzeigen (Custom Audiences und Lookalike Audiences)</li>
          <li>Messung von Conversions (z.B. Registrierungen, Kontaktanfragen)</li>
          <li>Remarketing und Retargeting von Websitebesuchern</li>
          <li>Statistische Auswertung der Nutzung unserer Website</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Rechtsgrundlage</h3>
        <p className="text-gray-600 leading-relaxed">
          Die Nutzung des Meta Pixels und der zugehörigen Cookies erfolgt auf Grundlage Ihrer Einwilligung
          gemäß Art. 6 Abs. 1 lit. a DSGVO. Sie können Ihre Einwilligung jederzeit mit Wirkung für die
          Zukunft widerrufen, indem Sie die Cookie-Einstellungen in Ihrem Browser ändern oder die
          Werbepräferenzen in Ihrem Meta-Konto anpassen.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Datenübermittlung in die USA</h3>
        <p className="text-gray-600 leading-relaxed">
          Meta verarbeitet Ihre Daten auch in den USA. Wir weisen darauf hin, dass nach Auffassung des EuGH
          derzeit kein angemessenes Schutzniveau für die Datenübermittlung in die USA besteht. Die USA
          verfügen seit dem 10. Juli 2023 über einen Angemessenheitsbeschluss der EU-Kommission (EU-U.S. Data
          Privacy Framework). Meta Platforms Inc. ist unter dem EU-U.S. Data Privacy Framework zertifiziert
          und hat sich damit verpflichtet, die europäischen Datenschutzstandards einzuhalten.
        </p>

        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-6">Widerspruch und Opt-out</h3>
        <p className="text-gray-600 leading-relaxed">
          Sie können der Erfassung durch das Meta Pixel wie folgt widersprechen:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-1 text-gray-600 leading-relaxed">
          <li>Durch Anpassung Ihrer Cookie-Einstellungen in Ihrem Browser (Blockieren von Drittanbieter-Cookies)</li>
          <li>Über die Werbeeinstellungen Ihres Meta-Kontos: <a href="https://www.facebook.com/ads/preferences/" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:underline">https://www.facebook.com/ads/preferences/</a></li>
          <li>Über die Opt-out-Seite der Digital Advertising Alliance: <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:underline">https://optout.aboutads.info/</a></li>
          <li>Über die Opt-out-Seite der European Interactive Digital Advertising Alliance: <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:underline">https://www.youronlinechoices.com/</a></li>
        </ul>
        <p className="text-gray-600 leading-relaxed mt-4">
          Weitere Informationen zum Datenschutz bei Meta finden Sie in der Datenschutzrichtlinie von Meta
          unter: <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-[#3c8af7] hover:underline">https://www.facebook.com/privacy/policy/</a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">6. Newsletter</h2>
        <p className="text-gray-600 leading-relaxed">
          Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine
          E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der
          angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind. Weitere
          Daten werden nicht bzw. nur auf freiwilliger Basis erhoben. Diese Daten verwenden wir ausschließlich
          für den Versand der angeforderten Informationen und geben diese nicht an Dritte weiter.
        </p>
        <p className="text-gray-600 leading-relaxed">
          Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung zum
          Versand des Newsletters können Sie jederzeit widerrufen, etwa über den "Austragen"-Link im
          Newsletter.
        </p>
      </section>
    </div>
  );
}
