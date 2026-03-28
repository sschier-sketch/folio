/*
  # Fix Registration Email Import Section

  1. Changes
    - Updated the "Schnell Immobilien & Einheiten importieren" section in the registration email
    - Removed incorrect CSV mention (only Excel import is supported)
    - Added mention that tenants/Mietverhältnisse can also be imported via Excel
    - Updated both HTML and plaintext versions for the German template

  2. Notes
    - Only the German (de) template is affected
    - The import hint box now correctly reflects the actual feature capabilities
*/

UPDATE email_templates
SET
  body_html = REPLACE(
    REPLACE(
      body_html,
      '<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; font-weight: 700; line-height: 1.3;">Schnell Immobilien &amp; Einheiten importieren</p>
<p style="margin: 0 0 10px; color: #666; font-size: 13px; line-height: 1.6;">Je schneller Ihre Daten in rentably hinterlegt sind, desto effizienter wird Ihre Verwaltung.</p>
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EEF4FF; border-radius: 6px; border-left: 4px solid #3c8af7;">
<tr><td style="padding: 10px 14px;">
<p style="margin: 0; color: #555; font-size: 12px; line-height: 1.55;"><strong style="color: #1E1E24;">Tipp:</strong> Falls Sie bereits bestehende Daten haben, k&ouml;nnen Sie diese einfach per <strong style="color: #1E1E24;">CSV- oder Excel-Upload</strong> importieren &ndash; kein manuelles Eintippen n&ouml;tig.</p>
</td></tr>
</table>',
      '<p style="margin: 0 0 6px; color: #1E1E24; font-size: 14px; font-weight: 700; line-height: 1.3;">Schnell Immobilien, Einheiten &amp; Mieter importieren</p>
<p style="margin: 0 0 10px; color: #666; font-size: 13px; line-height: 1.6;">Je schneller Ihre Daten in rentably hinterlegt sind, desto effizienter wird Ihre Verwaltung.</p>
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #EEF4FF; border-radius: 6px; border-left: 4px solid #3c8af7;">
<tr><td style="padding: 10px 14px;">
<p style="margin: 0; color: #555; font-size: 12px; line-height: 1.55;"><strong style="color: #1E1E24;">Tipp:</strong> Falls Sie bereits bestehende Daten haben, k&ouml;nnen Sie Immobilien, Einheiten und Mietverh&auml;ltnisse einfach per <strong style="color: #1E1E24;">Excel-Upload</strong> importieren &ndash; kein manuelles Eintippen n&ouml;tig. Eine Vorlage wird direkt im Import-Assistenten bereitgestellt.</p>
</td></tr>
</table>'
    ),
    'dummy_no_match', 'dummy_no_match'
  ),
  body_text = REPLACE(
    body_text,
    E'SCHNELL IMMOBILIEN & EINHEITEN IMPORTIEREN\n-------------------------------------------\nJe schneller Ihre Daten in rentably hinterlegt sind, desto effizienter wird Ihre Verwaltung.\n\nTipp: Falls Sie bereits bestehende Daten haben, können Sie diese einfach per CSV- oder Excel-Upload importieren -- kein manuelles Eintippen nötig.',
    E'SCHNELL IMMOBILIEN, EINHEITEN & MIETER IMPORTIEREN\n----------------------------------------------------\nJe schneller Ihre Daten in rentably hinterlegt sind, desto effizienter wird Ihre Verwaltung.\n\nTipp: Falls Sie bereits bestehende Daten haben, können Sie Immobilien, Einheiten und Mietverhältnisse einfach per Excel-Upload importieren -- kein manuelles Eintippen nötig. Eine Vorlage wird direkt im Import-Assistenten bereitgestellt.'
  ),
  updated_at = now()
WHERE template_key = 'registration'
  AND language = 'de';
