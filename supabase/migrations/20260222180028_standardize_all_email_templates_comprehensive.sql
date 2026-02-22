/*
  # Standardize all email templates to comprehensive HTML design

  1. Changes
    - Delete `referral_reward_earned` template (de + en)
    - Update ALL email templates to use the comprehensive HTML design
      based on the `user_invitation` / `new-email_clean.html` format
    - Buttons now use square corners (no border-radius) matching the app design
    - All templates use Manrope font, MSO conditionals for Outlook compatibility,
      mobile-responsive CSS
    - Missing `magic_link` template added for Supabase Auth magic link login (de + en)

  2. Templates affected
    - All existing templates updated to consistent design
    - NEW: magic_link (de + en)

  3. Deleted
    - referral_reward_earned (de + en)

  4. Notes
    - Button style: #3c8af7 background, NO border-radius (square corners)
    - All templates follow same structure: logo, divider, heading, body, button, divider, footer
*/

-- Step 1: Delete referral_reward_earned
DELETE FROM email_templates WHERE template_key = 'referral_reward_earned';

-- Step 2: Create a function to generate the comprehensive HTML template
CREATE OR REPLACE FUNCTION pg_temp.build_email_html(
  p_lang text,
  p_heading text,
  p_body_html text,
  p_button_text text,
  p_button_url text
) RETURNS text AS $$
DECLARE
  v_footer_text text;
  v_footer_tagline text;
BEGIN
  IF p_lang = 'de' THEN
    v_footer_text := '© 2026 <a href="https://rentab.ly/" style="text-decoration: underline; color: #141719;">rentab.ly</a>';
    v_footer_tagline := 'Die moderne Lösung für professionelle Immobilienverwaltung';
  ELSE
    v_footer_text := '© 2026 <a href="https://rentab.ly/" style="text-decoration: underline; color: #141719;">rentab.ly</a>';
    v_footer_tagline := 'The modern solution for professional property management';
  END IF;

  RETURN '<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="' || p_lang || '">
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]><xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]--><!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Manrope:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css"><!--<![endif]-->
<style>* { box-sizing: border-box; } body { margin: 0; padding: 0; } a[x-apple-data-detectors] { color: inherit !important; text-decoration: inherit !important; } #MessageViewBody a { color: inherit; text-decoration: none; } p { line-height: inherit } .desktop_hide, .desktop_hide table { mso-hide: all; display: none; max-height: 0px; overflow: hidden; } .image_block img+div { display: none; } sup, sub { font-size: 75%; line-height: 0; } @media (max-width:620px) { .desktop_hide table.icons-inner, .row-1 .column-1 .block-5.button_block .alignment .button { display: inline-block !important; } .icons-inner { text-align: center; } .icons-inner td { margin: 0 auto; } .mobile_hide { display: none; } .row-content { width: 100% !important; } .stack .column { width: 100%; display: block; } .mobile_hide { min-height: 0; max-height: 0; max-width: 0; overflow: hidden; font-size: 0px; } .desktop_hide, .desktop_hide table { display: table !important; max-height: none !important; } .row-1 .column-1 .block-4.paragraph_block td.pad>div { text-align: left !important; font-size: 16px !important; } .row-1 .column-1 .block-2.divider_block td.pad, .row-1 .column-1 .block-4.paragraph_block td.pad, .row-1 .column-1 .block-5.button_block td.pad, .row-1 .column-1 .block-6.divider_block td.pad, .row-1 .column-1 .block-7.paragraph_block td.pad { padding: 10px !important; } .row-1 .column-1 .block-2.divider_block .alignment table, .row-1 .column-1 .block-6.divider_block .alignment table { display: inline-table; } .row-1 .column-1 .block-2.divider_block .alignment, .row-1 .column-1 .block-6.divider_block .alignment { text-align: center !important; font-size: 1px; } .row-1 .column-1 .block-3.heading_block h1, .row-1 .column-1 .block-5.button_block .alignment { text-align: center !important; } .row-1 .column-1 .block-7.paragraph_block td.pad>div { text-align: center !important; font-size: 16px !important; } .row-1 .column-1 .block-5.button_block span { font-size: 16px !important; line-height: 32px !important; } }</style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>
<body class="body" style="background-color: #ffffff; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;">
<tbody><tr><td>
<table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #faf8f8;">
<tbody><tr><td>
<table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; background-color: #faf8f8; width: 600px; margin: 0 auto;" width="600">
<tbody><tr>
<td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
<table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<tr><td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
<div class="alignment" align="center"><div style="max-width: 300px;"><a href="https://rentab.ly" target="_blank"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" style="display: block; height: auto; border: 0; width: 100%;" width="300" alt="rentably logo" title="rentably logo" height="auto"></a></div></div>
</td></tr>
</table>
<table class="divider_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<tr><td class="pad"><div class="alignment" align="center"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"><tr><td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span style="word-break: break-word;">&#8202;</span></td></tr></table></div></td></tr>
</table>
<table class="heading_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<tr><td class="pad"><h1 style="margin: 0; color: #3c8af7; direction: ltr; font-family: ' || chr(39) || 'Manrope' || chr(39) || ', Arial, ' || chr(39) || 'Helvetica Neue' || chr(39) || ', Helvetica, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: normal; line-height: 2; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 40px;"><span style="word-break: break-word;">' || p_heading || '</span></h1></td></tr>
</table>
<table class="paragraph_block block-4" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
<tr><td class="pad">
<div style="color:#141719;direction:ltr;font-family:' || chr(39) || 'Manrope' || chr(39) || ', Arial;font-size:14px;font-weight:400;letter-spacing:0px;line-height:1.6;text-align:left;mso-line-height-alt:22px;">
' || p_body_html || '
</div>
</td></tr>
</table>
<table class="button_block block-5" width="100%" border="0" cellpadding="25" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<tr><td class="pad">
<div class="alignment" align="left"><a href="' || p_button_url || '" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="' || p_button_url || '" style="height:40px;width:auto;v-text-anchor:middle;" arcsize="0%" fillcolor="#3c8af7"><v:stroke dashstyle="Solid" weight="0px" color="#3c8af7"/><w:anchorlock/><v:textbox inset="5px,0px,5px,0px"><center dir="false" style="color:#ffffff;font-family:Arial;font-size:15px"><![endif]--><span class="button" style="background-color: #3c8af7; border-bottom: 0px solid transparent; border-left: 0px solid transparent; border-radius: 0px; border-right: 0px solid transparent; border-top: 0px solid transparent; color: #ffffff; display: inline-block; font-family: ' || chr(39) || 'Manrope' || chr(39) || ', Arial; font-size: 15px; font-weight: 400; mso-border-alt: none; padding-bottom: 5px; padding-top: 5px; padding-left: 20px; padding-right: 20px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word; line-height: 30px;">' || p_button_text || '</span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
</td></tr>
</table>
<table class="divider_block block-6" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
<tr><td class="pad"><div class="alignment" align="center"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;"><tr><td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #dddddd;"><span style="word-break: break-word;">&#8202;</span></td></tr></table></div></td></tr>
</table>
<table class="paragraph_block block-7" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
<tr><td class="pad">
<div style="color:#141719;direction:ltr;font-family:' || chr(39) || 'Manrope' || chr(39) || ', Arial;font-size:12px;font-weight:400;letter-spacing:0px;line-height:1.2;text-align:center;mso-line-height-alt:14px;">
<p style="margin: 0; margin-bottom: 16px;">' || v_footer_text || '</p>
<p style="margin: 0;">' || v_footer_tagline || '</p>
</div>
</td></tr>
</table>
</td>
</tr></tbody>
</table>
</td></tr></tbody>
</table>
</td></tr></tbody>
</table>
</body>
</html>';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- registration (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Willkommen bei rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">vielen Dank für Ihre Registrierung bei rentab.ly! Wir freuen uns, Sie als neues Mitglied begrüßen zu dürfen.</p>
<p style="margin: 0;">Viel Erfolg mit Ihrer Immobilienverwaltung!</p>',
  'Zur Anmeldung',
  'https://rentab.ly/login'
) WHERE template_key = 'registration' AND language = 'de';

-- registration (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Welcome to rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Thank you for registering at rentab.ly! We are happy to welcome you as a new member.</p>
<p style="margin: 0;">Good luck with your property management!</p>',
  'Go to Login',
  'https://rentab.ly/login'
) WHERE template_key = 'registration' AND language = 'en';

-- ============================================================
-- contract_signed (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Mietvertrag unterzeichnet',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Ihr Mietvertrag für <strong>{{propertyAddress}}</strong> wurde erfolgreich unterzeichnet.</p>
<p style="margin: 0;">Sie können die Details jederzeit in Ihrem Dashboard einsehen.</p>',
  'Zum Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'contract_signed' AND language = 'de';

-- contract_signed (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Rental Contract Signed',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Your rental contract for <strong>{{propertyAddress}}</strong> has been successfully signed.</p>
<p style="margin: 0;">You can view the details at any time in your dashboard.</p>',
  'Go to Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'contract_signed' AND language = 'en';

-- ============================================================
-- login_link (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Ihr Anmelde-Link',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Sie haben einen Anmelde-Link angefordert. Klicken Sie auf die Schaltfläche unten, um sich anzumelden.</p>
<p style="margin: 0;">Dieser Link ist aus Sicherheitsgründen nur 15 Minuten gültig.</p>',
  'Jetzt anmelden',
  '{{login_link}}'
) WHERE template_key = 'login_link' AND language = 'de';

-- login_link (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Your Login Link',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{user_name}}</strong>,</p>
<p style="margin: 0 0 16px 0;">You have requested a login link. Click the button below to log in.</p>
<p style="margin: 0;">For security reasons, this link is only valid for 15 minutes.</p>',
  'Log in now',
  '{{login_link}}'
) WHERE template_key = 'login_link' AND language = 'en';

-- ============================================================
-- password_reset (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Passwort zurücksetzen',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
<p style="margin: 0;">Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu vergeben. Der Link ist aus Sicherheitsgründen nur kurze Zeit gültig.</p>',
  'Passwort zurücksetzen',
  '{{resetLink}}'
) WHERE template_key = 'password_reset' AND language = 'de';

-- password_reset (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Reset your password',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">You have requested to reset your password.</p>
<p style="margin: 0;">Click the button below to set a new password. For security reasons, this link is only valid for a short time.</p>',
  'Reset Password',
  '{{resetLink}}'
) WHERE template_key = 'password_reset' AND language = 'en';

-- ============================================================
-- referral_invitation (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Entdecke rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;"><strong>{{referrer_name}}</strong> empfiehlt Ihnen rentab.ly – die moderne Lösung für professionelle Immobilienverwaltung.</p>
<p style="margin: 0;">Registrieren Sie sich jetzt und profitieren Sie von allen Vorteilen.</p>',
  'Jetzt registrieren',
  '{{referral_link}}'
) WHERE template_key = 'referral_invitation' AND language = 'de';

-- referral_invitation (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Discover rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hello,</p>
<p style="margin: 0 0 16px 0;"><strong>{{referrer_name}}</strong> recommends rentab.ly – the modern solution for professional property management.</p>
<p style="margin: 0;">Register now and benefit from all features.</p>',
  'Register now',
  '{{referral_link}}'
) WHERE template_key = 'referral_invitation' AND language = 'en';

-- ============================================================
-- rent_increase_notification (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Ankündigung Mieterhöhung',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">hiermit möchten wir Sie über eine Mieterhöhung für <strong>{{propertyAddress}}</strong> informieren.</p>
<p style="margin: 0;">Weitere Details finden Sie in Ihrem Dashboard.</p>',
  'Zum Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'rent_increase_notification' AND language = 'de';

-- rent_increase_notification (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Rent Increase Notification',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">we would like to inform you about a rent increase for <strong>{{propertyAddress}}</strong>.</p>
<p style="margin: 0;">Further details can be found in your dashboard.</p>',
  'Go to Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'rent_increase_notification' AND language = 'en';

-- ============================================================
-- rent_payment_reminder (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Erinnerung: Mietzahlung',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">wir möchten Sie freundlich an die ausstehende Mietzahlung für <strong>{{propertyAddress}}</strong> erinnern.</p>
<p style="margin: 0;">Bitte überweisen Sie den fälligen Betrag zeitnah.</p>',
  'Zum Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'rent_payment_reminder' AND language = 'de';

-- rent_payment_reminder (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Reminder: Rent Payment',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">we would like to kindly remind you of the outstanding rent payment for <strong>{{propertyAddress}}</strong>.</p>
<p style="margin: 0;">Please transfer the due amount promptly.</p>',
  'Go to Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'rent_payment_reminder' AND language = 'en';

-- ============================================================
-- subscription_cancelled (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Abonnement gekündigt',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Ihr Abonnement wurde gekündigt. Sie können die Premium-Funktionen noch bis zum Ende Ihres aktuellen Abrechnungszeitraums nutzen.</p>
<p style="margin: 0;">Wir würden uns freuen, Sie in Zukunft wieder begrüßen zu dürfen.</p>',
  'Zum Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'subscription_cancelled' AND language = 'de';

-- subscription_cancelled (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Subscription Cancelled',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Your subscription has been cancelled. You can continue to use the premium features until the end of your current billing period.</p>
<p style="margin: 0;">We would be happy to welcome you back in the future.</p>',
  'Go to Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'subscription_cancelled' AND language = 'en';

-- ============================================================
-- subscription_started (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Premium-Abonnement aktiviert',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Ihr Premium-Abonnement wurde erfolgreich aktiviert!</p>
<p style="margin: 0;"><strong>Plan:</strong> {{planName}}</p>',
  'Zum Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'subscription_started' AND language = 'de';

-- subscription_started (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Premium Subscription Activated',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{userName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Your premium subscription has been successfully activated!</p>
<p style="margin: 0;"><strong>Plan:</strong> {{planName}}</p>',
  'Go to Dashboard',
  'https://rentab.ly/dashboard'
) WHERE template_key = 'subscription_started' AND language = 'en';

-- ============================================================
-- tenant_password_reset (de)
-- ============================================================
UPDATE email_templates SET
  template_name = 'Mieterportal Passwort zurücksetzen',
  description = 'E-Mail zum Zurücksetzen des Passworts im Mieterportal',
  body_html = pg_temp.build_email_html(
  'de',
  'Passwort zurücksetzen - Mieterportal',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für das Mieterportal gestellt.</p>
<p style="margin: 0;">Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu vergeben. Der Link ist 1 Stunde gültig.</p>',
  'Passwort zurücksetzen',
  '{{resetLink}}'
) WHERE template_key = 'tenant_password_reset' AND language = 'de';

-- tenant_password_reset (en)
UPDATE email_templates SET
  template_name = 'Tenant Portal Password Reset',
  description = 'Email for resetting tenant portal password',
  body_html = pg_temp.build_email_html(
  'en',
  'Reset Password - Tenant Portal',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">You have requested to reset your password for the tenant portal.</p>
<p style="margin: 0;">Click the button below to set a new password. The link is valid for 1 hour.</p>',
  'Reset Password',
  '{{resetLink}}'
) WHERE template_key = 'tenant_password_reset' AND language = 'en';

-- ============================================================
-- tenant_portal_activation (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Ihr Zugang zum Mieterportal',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Ihr Vermieter hat Sie zum Mieterportal von rentab.ly eingeladen.</p>
<p style="margin: 0 0 16px 0;">Über das Mieterportal können Sie:</p>
<ul style="margin: 0 0 16px 0; padding-left: 20px; color: #141719;">
<li style="margin-bottom: 8px;">Ihre Vertragsdaten einsehen</li>
<li style="margin-bottom: 8px;">Dokumente herunterladen</li>
<li style="margin-bottom: 8px;">Zählerstände melden</li>
<li style="margin-bottom: 8px;">Mit Ihrem Vermieter kommunizieren</li>
</ul>
<p style="margin: 0;">Klicken Sie auf die Schaltfläche unten, um Ihr Konto einzurichten.</p>',
  'Konto einrichten',
  '{{setupLink}}'
) WHERE template_key = 'tenant_portal_activation' AND language = 'de';

-- tenant_portal_activation (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Your Access to the Tenant Portal',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Your landlord has invited you to the rentab.ly tenant portal.</p>
<p style="margin: 0 0 16px 0;">Through the tenant portal you can:</p>
<ul style="margin: 0 0 16px 0; padding-left: 20px; color: #141719;">
<li style="margin-bottom: 8px;">View your contract details</li>
<li style="margin-bottom: 8px;">Download documents</li>
<li style="margin-bottom: 8px;">Report meter readings</li>
<li style="margin-bottom: 8px;">Communicate with your landlord</li>
</ul>
<p style="margin: 0;">Click the button below to set up your account.</p>',
  'Set up account',
  '{{setupLink}}'
) WHERE template_key = 'tenant_portal_activation' AND language = 'en';

-- ============================================================
-- ticket_reply (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Neue Antwort auf Ihr Ticket',
  '<p style="margin: 0 0 16px 0;">Hallo <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">Es gibt eine neue Antwort auf Ihr Ticket <strong>{{ticketSubject}}</strong> (Ticket #{{ticketNumber}}).</p>
<p style="margin: 0 0 16px 0; padding: 12px; background: #f5f5f5;">{{messagePreview}}</p>
<p style="margin: 0;">Klicken Sie auf die Schaltfläche unten, um die vollständige Nachricht zu lesen.</p>',
  'Ticket ansehen',
  '{{ticketLink}}'
) WHERE template_key = 'ticket_reply' AND language = 'de';

-- ticket_reply (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'New Reply to Your Ticket',
  '<p style="margin: 0 0 16px 0;">Hello <strong>{{tenantName}}</strong>,</p>
<p style="margin: 0 0 16px 0;">There is a new reply to your ticket <strong>{{ticketSubject}}</strong> (Ticket #{{ticketNumber}}).</p>
<p style="margin: 0 0 16px 0; padding: 12px; background: #f5f5f5;">{{messagePreview}}</p>
<p style="margin: 0;">Click the button below to read the full message.</p>',
  'View Ticket',
  '{{ticketLink}}'
) WHERE template_key = 'ticket_reply' AND language = 'en';

-- ============================================================
-- welcome (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Willkommen bei Rentably!',
  '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;">willkommen bei Rentably! Wir freuen uns, dass Sie sich für unsere Immobilienverwaltungs-Software entschieden haben.</p>
<p style="margin: 0 0 16px 0;">Ihre 30-tägige kostenlose Testphase hat begonnen. Nutzen Sie alle Pro-Features ohne Einschränkungen!</p>
<p style="margin: 0 0 10px 0;"><strong>Ihre nächsten Schritte:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px; color: #141719;">
<li style="margin-bottom: 8px;">Erstellen Sie Ihre erste Immobilie</li>
<li style="margin-bottom: 8px;">Fügen Sie Ihre Mieter hinzu</li>
<li style="margin-bottom: 8px;">Verwalten Sie Mieteinnahmen und Ausgaben</li>
<li style="margin-bottom: 8px;">Nutzen Sie das Mieterportal</li>
</ul>
<p style="margin: 0;">Bei Fragen stehen wir Ihnen jederzeit gerne zur Verfügung!</p>',
  'Zum Dashboard',
  '{{dashboard_link}}'
) WHERE template_key = 'welcome' AND language = 'de';

-- ============================================================
-- trial_ending (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Ihre Testphase endet bald',
  '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;">Ihre 30-tägige Testphase endet in <strong>{{days_remaining}} Tagen</strong> am {{trial_end_date}}.</p>
<p style="margin: 0 0 16px 0;">Upgraden Sie jetzt auf Pro, um alle Features weiterhin ohne Unterbrechung nutzen zu können.</p>
<p style="margin: 0;"><strong>Nur 9 EUR/Monat</strong> für unbegrenzte Immobilien, Mieter und alle Pro-Features!</p>',
  'Jetzt auf Pro upgraden',
  '{{upgrade_link}}'
) WHERE template_key = 'trial_ending' AND language = 'de';

-- ============================================================
-- trial_ended (de)
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Testphase abgelaufen',
  '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;">Ihre 30-tägige Testphase ist am {{trial_end_date}} abgelaufen.</p>
<p style="margin: 0 0 16px 0;">Ihre Daten bleiben erhalten. Upgraden Sie auf Pro, um wieder vollen Zugriff auf alle Features zu erhalten.</p>
<p style="margin: 0 0 10px 0;"><strong>Pro-Features wieder freischalten:</strong></p>
<ul style="margin: 0 0 16px 0; padding-left: 20px; color: #141719;">
<li style="margin-bottom: 8px;">Unbegrenzte Immobilien und Mieter</li>
<li style="margin-bottom: 8px;">Erweiterte Finanzanalysen</li>
<li style="margin-bottom: 8px;">Mieterportal</li>
<li style="margin-bottom: 8px;">Dokument-Management</li>
<li style="margin-bottom: 8px;">Und vieles mehr...</li>
</ul>',
  'Jetzt upgraden',
  '{{upgrade_link}}'
) WHERE template_key = 'trial_ended' AND language = 'de';

-- ============================================================
-- user_invitation (de) - update button to square corners
-- ============================================================
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'de',
  'Einladung zu rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;"><strong>{{inviter_name}}</strong> hat Sie eingeladen, rentab.ly zu nutzen.</p>
<p style="margin: 0;">Für die E-Mail-Adresse <strong>{{invitee_email}}</strong> wurde ein Konto erstellt.</p>',
  'Einladung annehmen',
  '{{invitation_link}}'
) WHERE template_key = 'user_invitation' AND language = 'de';

-- user_invitation (en)
UPDATE email_templates SET body_html = pg_temp.build_email_html(
  'en',
  'Invitation to rentab.ly',
  '<p style="margin: 0 0 16px 0;">Hello,</p>
<p style="margin: 0 0 16px 0;"><strong>{{inviter_name}}</strong> has invited you to use rentab.ly.</p>
<p style="margin: 0;">An account has been created for the email address <strong>{{invitee_email}}</strong>.</p>',
  'Accept Invitation',
  '{{invitation_link}}'
) WHERE template_key = 'user_invitation' AND language = 'en';

-- ============================================================
-- NEW: magic_link (de + en) for Supabase Auth magic link login
-- ============================================================
INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables)
VALUES (
  'magic_link',
  'de',
  'Magic Link Login',
  'E-Mail mit Magic Link für die passwortlose Anmeldung',
  'Ihr Anmelde-Link - rentab.ly',
  pg_temp.build_email_html(
    'de',
    'Ihr Anmelde-Link',
    '<p style="margin: 0 0 16px 0;">Hallo,</p>
<p style="margin: 0 0 16px 0;">Sie haben einen Magic Link zur Anmeldung bei rentab.ly angefordert.</p>
<p style="margin: 0 0 16px 0;">Klicken Sie auf die Schaltfläche unten, um sich sicher anzumelden.</p>
<p style="margin: 0; color: #666;">Dieser Link ist aus Sicherheitsgründen nur 15 Minuten gültig. Falls Sie diesen Link nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>',
    'Jetzt anmelden',
    '{{magic_link}}'
  ),
  E'Ihr Anmelde-Link\n\nHallo,\n\nSie haben einen Magic Link zur Anmeldung bei rentab.ly angefordert.\n\nKlicken Sie auf den folgenden Link, um sich anzumelden:\n{{magic_link}}\n\nDieser Link ist aus Sicherheitsgründen nur 15 Minuten gültig.\n\nFalls Sie diesen Link nicht angefordert haben, ignorieren Sie diese E-Mail bitte.\n\n---\n© 2026 rentab.ly',
  '["magic_link"]'::jsonb
)
ON CONFLICT (template_key, language) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables;

INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables)
VALUES (
  'magic_link',
  'en',
  'Magic Link Login',
  'Email with magic link for passwordless login',
  'Your Login Link - rentab.ly',
  pg_temp.build_email_html(
    'en',
    'Your Login Link',
    '<p style="margin: 0 0 16px 0;">Hello,</p>
<p style="margin: 0 0 16px 0;">You have requested a magic link to log in to rentab.ly.</p>
<p style="margin: 0 0 16px 0;">Click the button below to log in securely.</p>
<p style="margin: 0; color: #666;">For security reasons, this link is only valid for 15 minutes. If you did not request this link, you can safely ignore this email.</p>',
    'Log in now',
    '{{magic_link}}'
  ),
  E'Your Login Link\n\nHello,\n\nYou have requested a magic link to log in to rentab.ly.\n\nClick the following link to log in:\n{{magic_link}}\n\nFor security reasons, this link is only valid for 15 minutes.\n\nIf you did not request this link, please ignore this email.\n\n---\n© 2026 rentab.ly',
  '["magic_link"]'::jsonb
)
ON CONFLICT (template_key, language) DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  body_text = EXCLUDED.body_text,
  variables = EXCLUDED.variables;