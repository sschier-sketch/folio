import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import SeoHead from "../components/SeoHead";

export function Datenschutz() {
  return (
    <>
      <SeoHead />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-dark">Datenschutzerklärung</h1>
                <p className="text-sm text-gray-500">Stand: {new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">1. Datenschutz auf einen Blick</h2>

                <h3 className="text-xl font-semibold text-dark mb-3">Allgemeine Hinweise</h3>
                <p>
                  Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen
                  Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit
                  denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz
                  entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Datenerfassung auf unserer Website</h3>
                <p className="font-semibold">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</p>
                <p>
                  Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten
                  können Sie dem Impressum dieser Website entnehmen.
                </p>

                <p className="font-semibold mt-4">Wie erfassen wir Ihre Daten?</p>
                <p>
                  Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich
                  z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
                </p>
                <p>
                  Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind
                  vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
                  Die Erfassung dieser Daten erfolgt automatisch, sobald Sie unsere Website betreten.
                </p>

                <p className="font-semibold mt-4">Wofür nutzen wir Ihre Daten?</p>
                <p>
                  Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten.
                  Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden.
                </p>

                <p className="font-semibold mt-4">Welche Rechte haben Sie bezüglich Ihrer Daten?</p>
                <p>
                  Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer
                  gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung,
                  Sperrung oder Löschung dieser Daten zu verlangen. Hierzu sowie zu weiteren Fragen zum Thema
                  Datenschutz können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
                  Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen Aufsichtsbehörde zu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">2. Allgemeine Hinweise und Pflichtinformationen</h2>

                <h3 className="text-xl font-semibold text-dark mb-3">Datenschutz</h3>
                <p>
                  Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln
                  Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften
                  sowie dieser Datenschutzerklärung.
                </p>
                <p>
                  Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
                  Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden können. Die
                  vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und wofür wir sie nutzen.
                  Sie erläutert auch, wie und zu welchem Zweck das geschieht.
                </p>
                <p>
                  Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der Kommunikation per
                  E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der Daten vor dem Zugriff durch
                  Dritte ist nicht möglich.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Hinweis zur verantwortlichen Stelle</h3>
                <p>
                  Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
                </p>
                <p className="bg-gray-50 p-4 rounded-lg mt-2">
                  [Firmenname]<br />
                  [Straße und Hausnummer]<br />
                  [PLZ und Ort]<br />
                  <br />
                  E-Mail: [E-Mail-Adresse]
                </p>
                <p className="mt-4">
                  Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit
                  anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen,
                  E-Mail-Adressen o. Ä.) entscheidet.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
                <p>
                  Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie
                  können eine bereits erteilte Einwilligung jederzeit widerrufen. Dazu reicht eine formlose
                  Mitteilung per E-Mail an uns. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung
                  bleibt vom Widerruf unberührt.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Beschwerderecht bei der zuständigen Aufsichtsbehörde</h3>
                <p>
                  Im Falle datenschutzrechtlicher Verstöße steht dem Betroffenen ein Beschwerderecht bei der
                  zuständigen Aufsichtsbehörde zu. Zuständige Aufsichtsbehörde in datenschutzrechtlichen Fragen ist
                  der Landesdatenschutzbeauftragte des Bundeslandes, in dem unser Unternehmen seinen Sitz hat.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Recht auf Datenübertragbarkeit</h3>
                <p>
                  Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung eines
                  Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem gängigen,
                  maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte Übertragung der Daten an
                  einen anderen Verantwortlichen verlangen, erfolgt dies nur, soweit es technisch machbar ist.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Auskunft, Sperrung, Löschung</h3>
                <p>
                  Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche
                  Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den
                  Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung, Sperrung oder Löschung dieser
                  Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit
                  unter der im Impressum angegebenen Adresse an uns wenden.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">3. Datenerfassung auf unserer Website</h2>

                <h3 className="text-xl font-semibold text-dark mb-3">Cookies</h3>
                <p>
                  Die Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner
                  keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher,
                  effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt
                  werden und die Ihr Browser speichert.
                </p>
                <p>
                  Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach
                  Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis
                  Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim nächsten Besuch
                  wiederzuerkennen.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Server-Log-Dateien</h3>
                <p>
                  Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
                  Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Browsertyp und Browserversion</li>
                  <li>verwendetes Betriebssystem</li>
                  <li>Referrer URL</li>
                  <li>Hostname des zugreifenden Rechners</li>
                  <li>Uhrzeit der Serveranfrage</li>
                  <li>IP-Adresse</li>
                </ul>
                <p className="mt-4">
                  Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
                </p>
                <p>
                  Grundlage für die Datenverarbeitung ist Art. 6 Abs. 1 lit. f DSGVO, der die Verarbeitung von Daten
                  zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Kontaktformular</h3>
                <p>
                  Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
                  Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der
                  Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht ohne
                  Ihre Einwilligung weiter.
                </p>

                <h3 className="text-xl font-semibold text-dark mb-3 mt-6">Registrierung auf dieser Website</h3>
                <p>
                  Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu
                  nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen
                  Angebotes oder Dienstes, für den Sie sich registriert haben. Die bei der Registrierung abgefragten
                  Pflichtangaben müssen vollständig angegeben werden. Anderenfalls werden wir die Registrierung
                  ablehnen.
                </p>
                <p>
                  Für wichtige Änderungen etwa beim Angebotsumfang oder bei technisch notwendigen Änderungen nutzen
                  wir die bei der Registrierung angegebene E-Mail-Adresse, um Sie auf diesem Wege zu informieren.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">4. Analyse Tools und Werbung</h2>

                <h3 className="text-xl font-semibold text-dark mb-3">Google Analytics</h3>
                <p>
                  Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google
                  Inc., 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.
                </p>
                <p>
                  Google Analytics verwendet so genannte "Cookies". Das sind Textdateien, die auf Ihrem Computer
                  gespeichert werden und die eine Analyse der Benutzung der Website durch Sie ermöglichen. Die durch
                  den Cookie erzeugten Informationen über Ihre Benutzung dieser Website werden in der Regel an einen
                  Server von Google in den USA übertragen und dort gespeichert.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">5. Newsletter</h2>
                <p>
                  Wenn Sie den auf der Website angebotenen Newsletter beziehen möchten, benötigen wir von Ihnen eine
                  E-Mail-Adresse sowie Informationen, welche uns die Überprüfung gestatten, dass Sie der Inhaber der
                  angegebenen E-Mail-Adresse sind und mit dem Empfang des Newsletters einverstanden sind. Weitere
                  Daten werden nicht bzw. nur auf freiwilliger Basis erhoben. Diese Daten verwenden wir ausschließlich
                  für den Versand der angeforderten Informationen und geben diese nicht an Dritte weiter.
                </p>
                <p>
                  Die erteilte Einwilligung zur Speicherung der Daten, der E-Mail-Adresse sowie deren Nutzung zum
                  Versand des Newsletters können Sie jederzeit widerrufen, etwa über den "Austragen"-Link im
                  Newsletter.
                </p>
              </section>
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
