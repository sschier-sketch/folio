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
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">5. Newsletter</h2>
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
