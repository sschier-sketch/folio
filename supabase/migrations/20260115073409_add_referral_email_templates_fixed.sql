/*
  # Email Templates für Empfehlungsprogramm (korrigiert)

  1. Neue Templates
    - referral_invitation: Email zum Einladen von Freunden
    - referral_reward_earned: Benachrichtigung über verdiente Belohnung
    
  2. Sprachen
    - Deutsch (de)
    - Englisch (en)
*/

INSERT INTO email_templates (template_key, template_name, subject, body_html, body_text, language, variables) VALUES
('referral_invitation', 'Empfehlungseinladung', 'Entdecke rentab.ly - Deine Immobilienverwaltung', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">rentab.ly</h1>
      <p style="color: #666; font-size: 14px;">Professionelle Immobilienverwaltung</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hallo!</p>
      
      <p style="margin-bottom: 20px;">{{inviter_name}} hat dir rentab.ly empfohlen - die professionelle Lösung für deine Immobilienverwaltung.</p>
      
      <p style="margin-bottom: 20px;"><strong>Deine Vorteile:</strong></p>
      <ul style="margin-bottom: 20px;">
        <li>2 Monate rentab.ly PRO gratis</li>
        <li>Vollständige Übersicht über alle Immobilien</li>
        <li>Automatische Mietzahlungsverfolgung</li>
        <li>Professionelles Dokumentenmanagement</li>
        <li>Mieterportal für einfache Kommunikation</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{registration_link}}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Jetzt kostenlos registrieren
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Dein persönlicher Empfehlungscode: <strong style="color: #2563eb;">{{referral_code}}</strong>
      </p>
    </div>
    
    <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
      <p>© 2026 rentab.ly. Alle Rechte vorbehalten.</p>
    </div>
  </div>
</body>
</html>',
'Hallo!

{{inviter_name}} hat dir rentab.ly empfohlen - die professionelle Lösung für deine Immobilienverwaltung.

Deine Vorteile:
- 2 Monate rentab.ly PRO gratis
- Vollständige Übersicht über alle Immobilien
- Automatische Mietzahlungsverfolgung

Registriere dich jetzt: {{registration_link}}
Dein Empfehlungscode: {{referral_code}}',
'de',
'{"inviter_name": "Name des Einladenden", "registration_link": "Link zur Registrierung", "referral_code": "Empfehlungscode"}'::jsonb),

('referral_invitation', 'Referral Invitation', 'Discover rentab.ly - Your Property Management Solution', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">rentab.ly</h1>
      <p style="color: #666; font-size: 14px;">Professional Property Management</p>
    </div>
    
    <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">Hello!</p>
      
      <p style="margin-bottom: 20px;">{{inviter_name}} has recommended rentab.ly to you - the professional solution for your property management.</p>
      
      <p style="margin-bottom: 20px;"><strong>Your Benefits:</strong></p>
      <ul style="margin-bottom: 20px;">
        <li>2 months rentab.ly PRO free</li>
        <li>Complete overview of all properties</li>
        <li>Automatic rent payment tracking</li>
        <li>Professional document management</li>
        <li>Tenant portal for easy communication</li>
      </ul>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{registration_link}}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Register Now for Free
        </a>
      </div>
      
      <p style="font-size: 14px; color: #666; margin-top: 20px;">
        Your personal referral code: <strong style="color: #2563eb;">{{referral_code}}</strong>
      </p>
    </div>
    
    <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
      <p>© 2026 rentab.ly. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Hello!

{{inviter_name}} has recommended rentab.ly to you - the professional solution for your property management.

Your Benefits:
- 2 months rentab.ly PRO free
- Complete overview of all properties
- Automatic rent payment tracking

Register now: {{registration_link}}
Your referral code: {{referral_code}}',
'en',
'{"inviter_name": "Inviter name", "registration_link": "Registration link", "referral_code": "Referral code"}'::jsonb),

('referral_reward_earned', 'Belohnung verdient', 'Belohnung verdient! 2 Monate PRO gratis', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">🎉 Glückwunsch!</h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px; color: white;">
      <h2 style="margin-top: 0; font-size: 24px;">Du hast eine Belohnung verdient!</h2>
      
      <p style="font-size: 18px; margin-bottom: 20px;">
        Ein neuer Kunde hat sich über deinen Empfehlungscode registriert.
      </p>
      
      <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 28px; font-weight: bold; margin: 0; text-align: center;">
          2 Monate PRO
        </p>
        <p style="font-size: 16px; margin: 10px 0 0 0; text-align: center;">
          {{reward_details}}
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_link}}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Zum Dashboard
      </a>
    </div>
    
    <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
      <p>© 2026 rentab.ly. Alle Rechte vorbehalten.</p>
    </div>
  </div>
</body>
</html>',
'Glückwunsch! Du hast eine Belohnung verdient!

Ein neuer Kunde hat sich über deinen Empfehlungscode registriert.

Du erhältst: 2 Monate PRO
{{reward_details}}

Zum Dashboard: {{dashboard_link}}',
'de',
'{"reward_details": "Details zur Belohnung", "dashboard_link": "Link zum Dashboard"}'::jsonb),

('referral_reward_earned', 'Reward Earned', 'Reward Earned! 2 Months PRO Free', 
'<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #2563eb; margin: 0;">🎉 Congratulations!</h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px; color: white;">
      <h2 style="margin-top: 0; font-size: 24px;">You have earned a reward!</h2>
      
      <p style="font-size: 18px; margin-bottom: 20px;">
        A new customer has registered using your referral code.
      </p>
      
      <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 28px; font-weight: bold; margin: 0; text-align: center;">
          2 Months PRO
        </p>
        <p style="font-size: 16px; margin: 10px 0 0 0; text-align: center;">
          {{reward_details}}
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{dashboard_link}}" style="display: inline-block; background: #2563eb; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Go to Dashboard
      </a>
    </div>
    
    <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
      <p>© 2026 rentab.ly. All rights reserved.</p>
    </div>
  </div>
</body>
</html>',
'Congratulations! You have earned a reward!

A new customer has registered using your referral code.

You receive: 2 Months PRO
{{reward_details}}

Go to Dashboard: {{dashboard_link}}',
'en',
'{"reward_details": "Reward details", "dashboard_link": "Dashboard link"}'::jsonb)

ON CONFLICT (template_key, language) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables,
  updated_at = now();
