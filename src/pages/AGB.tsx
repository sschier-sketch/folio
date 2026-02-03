import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import SeoHead from "../components/SeoHead";
import { Header } from "../components/Header";
import Footer from "../components/Footer";

export function AGB() {
  return (
    <>
      <SeoHead />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-blue" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-dark">Allgemeine Geschäftsbedingungen</h1>
                <p className="text-sm text-gray-500">Stand: {new Date().toLocaleDateString('de-DE')}</p>
              </div>
            </div>

            <div className="prose prose-blue max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">1. Geltungsbereich</h2>
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen [Firmenname]
                  (nachfolgend "Anbieter") und den Nutzern der Software-Plattform rentably (nachfolgend "Nutzer" oder "Kunde").
                </p>
                <p>
                  Abweichende, entgegenstehende oder ergänzende Allgemeine Geschäftsbedingungen werden, selbst bei
                  Kenntnis, nicht Vertragsbestandteil, es sei denn, ihrer Geltung wird ausdrücklich schriftlich
                  zugestimmt.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">2. Vertragsgegenstand</h2>
                <p>
                  Der Anbieter stellt dem Nutzer eine webbasierte Software zur Verwaltung von Immobilien als
                  Software-as-a-Service (SaaS) zur Verfügung. Die konkrete Leistungsbeschreibung und der
                  Funktionsumfang ergeben sich aus der Leistungsbeschreibung auf der Website des Anbieters.
                </p>
                <p>
                  Der Anbieter ist berechtigt, die vertragsgegenständliche Software weiterzuentwickeln und zu
                  verändern, soweit dies dem Kunden unter Berücksichtigung der Interessen des Anbieters zumutbar
                  ist.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">3. Vertragsschluss</h2>
                <p>
                  Der Vertrag kommt durch die Registrierung des Nutzers auf der Plattform und die Bestätigung durch
                  den Anbieter zustande. Die Darstellung der Leistungen auf der Website stellt kein rechtlich
                  bindendes Angebot, sondern eine Aufforderung zur Abgabe eines Angebots durch den Nutzer dar.
                </p>
                <p>
                  Mit der Registrierung gibt der Nutzer ein verbindliches Angebot zum Abschluss eines Nutzungsvertrags
                  ab. Der Anbieter kann dieses Angebot durch Zusendung einer Auftragsbestätigung per E-Mail oder
                  durch Freischaltung des Zugangs annehmen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">4. Leistungen und Verfügbarkeit</h2>
                <p>
                  Der Anbieter stellt die Software über das Internet zur Verfügung. Der Anbieter bemüht sich um
                  eine möglichst unterbrechungsfreie Verfügbarkeit der Software. Eine Verfügbarkeit von 100% ist
                  technisch jedoch nicht zu realisieren.
                </p>
                <p>
                  Der Anbieter gewährleistet eine durchschnittliche Verfügbarkeit der Software von 99% im
                  Jahresmittel. Hiervon ausgenommen sind Zeiten, in denen der Server aufgrund von technischen oder
                  sonstigen Problemen, die nicht im Einflussbereich des Anbieters liegen (höhere Gewalt, Verschulden
                  Dritter etc.), nicht erreichbar ist.
                </p>
                <p>
                  Der Anbieter kann die Verfügbarkeit der Software einschränken, wenn dies im Hinblick auf
                  Kapazitätsgrenzen, die Sicherheit oder Integrität der Server oder zur Durchführung technischer
                  Maßnahmen erforderlich ist und dies der ordnungsgemäßen oder verbesserten Erbringung der
                  Leistungen dient (Wartungsarbeiten).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">5. Nutzungsrechte</h2>
                <p>
                  Der Anbieter räumt dem Nutzer für die Dauer des Vertrags ein nicht ausschließliches, nicht
                  übertragbares und nicht unterlizenzierbares Recht ein, die Software über das Internet zu nutzen.
                </p>
                <p>
                  Der Nutzer ist nicht berechtigt, die Software zu vervielfältigen, zu verkaufen, zu vermieten oder
                  zu verleihen. Er ist insbesondere nicht berechtigt, die Software zu dekompilieren, zurückzuentwickeln
                  oder zu disassemblieren.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">6. Pflichten des Nutzers</h2>
                <p>
                  Der Nutzer ist verpflichtet, die Software nur im Rahmen der gesetzlichen Bestimmungen und der
                  vertraglichen Vereinbarungen zu nutzen. Der Nutzer ist insbesondere verpflichtet:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>keine rechtswidrigen oder betrügerischen Inhalte über die Software zu verbreiten</li>
                  <li>keine Viren, Trojaner oder sonstige schädliche Programme hochzuladen</li>
                  <li>keine Maßnahmen zu ergreifen, die die Funktionsfähigkeit der Software beeinträchtigen können</li>
                  <li>die Zugangsdaten vertraulich zu behandeln und vor dem Zugriff Dritter zu schützen</li>
                  <li>den Anbieter unverzüglich zu informieren, wenn Anhaltspunkte dafür bestehen, dass ein Dritter
                      von den Zugangsdaten Kenntnis erlangt hat</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">7. Preise und Zahlungsbedingungen</h2>
                <p>
                  Es gelten die zum Zeitpunkt der Bestellung auf der Website angegebenen Preise. Alle Preise
                  verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <p>
                  Die Abrechnung erfolgt je nach gewähltem Tarif monatlich oder jährlich im Voraus. Die Zahlung
                  erfolgt per Lastschrift, Kreditkarte oder einem anderen vom Anbieter angebotenen Zahlungsmittel.
                </p>
                <p>
                  Bei einem Zahlungsverzug ist der Anbieter berechtigt, den Zugang zur Software zu sperren, bis die
                  ausstehenden Beträge beglichen sind.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">8. Vertragslaufzeit und Kündigung</h2>
                <p>
                  Der Vertrag wird auf unbestimmte Zeit geschlossen. Die Kündigungsfrist beträgt einen Monat zum
                  Monatsende bei monatlicher Abrechnung bzw. drei Monate zum Vertragsende bei jährlicher Abrechnung.
                </p>
                <p>
                  Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Ein wichtiger
                  Grund für den Anbieter liegt insbesondere vor, wenn der Nutzer gegen wesentliche Vertragspflichten
                  verstößt und nach Abmahnung nicht innerhalb einer angemessenen Frist Abhilfe schafft.
                </p>
                <p>
                  Die Kündigung bedarf der Textform (z.B. E-Mail, Fax, Brief).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">9. Datensicherung und Datenschutz</h2>
                <p>
                  Der Anbieter führt regelmäßige Datensicherungen durch. Der Nutzer ist jedoch selbst für die
                  Sicherung seiner Daten verantwortlich und sollte in angemessenen Abständen Sicherungskopien
                  erstellen.
                </p>
                <p>
                  Der Schutz personenbezogener Daten erfolgt gemäß der Datenschutzerklärung des Anbieters und den
                  gesetzlichen Bestimmungen, insbesondere der DSGVO.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">10. Haftung</h2>
                <p>
                  Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den Vorschriften
                  des Produkthaftungsgesetzes. Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung
                  einer wesentlichen Vertragspflicht (Kardinalpflicht), deren Erfüllung die ordnungsgemäße
                  Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung der Vertragspartner
                  regelmäßig vertrauen darf.
                </p>
                <p>
                  Bei leicht fahrlässiger Verletzung von Kardinalpflichten ist die Haftung auf den vertragstypischen,
                  vorhersehbaren Schaden begrenzt. Im Übrigen ist die Haftung ausgeschlossen.
                </p>
                <p>
                  Die vorstehenden Haftungsbeschränkungen gelten nicht bei der Verletzung von Leben, Körper und
                  Gesundheit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">11. Änderungen der AGB</h2>
                <p>
                  Der Anbieter behält sich das Recht vor, diese AGB jederzeit mit Wirkung für die Zukunft zu ändern.
                  Die Änderungen werden dem Nutzer per E-Mail mitgeteilt. Die Änderungen gelten als genehmigt, wenn
                  der Nutzer nicht innerhalb von sechs Wochen nach Zugang der Änderungsmitteilung widerspricht. Der
                  Anbieter wird den Nutzer in der Änderungsmitteilung auf die Bedeutung der Sechswochenfrist und die
                  Folgen eines unterlassenen Widerspruchs hinweisen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-dark mb-4">12. Schlussbestimmungen</h2>
                <p>
                  Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
                </p>
                <p>
                  Erfüllungsort und ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist
                  der Sitz des Anbieters, sofern der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder
                  öffentlich-rechtliches Sondervermögen ist.
                </p>
                <p>
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, berührt dies die Wirksamkeit
                  der übrigen Bestimmungen nicht. An die Stelle der unwirksamen Bestimmung tritt eine wirksame
                  Bestimmung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung möglichst nahe kommt.
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
        <Footer />
      </div>
    </>
  );
}
