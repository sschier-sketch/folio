/*
  # Fix referral invitation email template variable names and links

  1. Changes
    - Fix variable names in HTML body: `{{referrerName}}` -> `{{inviter_name}}`, `{{referralLink}}` -> `{{registration_link}}`
    - Replace hardcoded `https://rentab.ly` links with `{{registration_link}}` so the user's referral link is used everywhere
    - Both German (de) and English (en) templates updated

  2. Important Notes
    - The edge function uses `{{inviter_name}}`, `{{registration_link}}`, and `{{referral_code}}` as variable names
    - The HTML templates previously used different variable names causing them to not be replaced
    - All clickable links (logo, button, footer) now use the user's referral link
*/

UPDATE email_templates
SET body_html = '<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}</style></head><body><table width="100%" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%"><tr><td align="center" style="padding-bottom:30px"><a href="{{registration_link}}"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Entdecke rentab.ly</h1><div style="color:#141719;font-size:14px;line-height:1.6">{{body_content}}</div><table width="100%" cellpadding="20"><tr><td><a href="{{registration_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Jetzt registrieren</a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">&copy; 2026 <a href="{{registration_link}}">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>'
WHERE template_key = 'referral_invitation' AND language = 'de';

UPDATE email_templates
SET body_html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}</style></head><body><table width="100%" style="background:#fff"><tr><td align="center" style="padding:20px 0"><table width="600" style="background:#faf8f8;border-radius:8px"><tr><td style="padding:30px"><table width="100%"><tr><td align="center" style="padding-bottom:30px"><a href="{{registration_link}}"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Discover rentab.ly</h1><div style="color:#141719;font-size:14px;line-height:1.6">{{body_content}}</div><table width="100%" cellpadding="20"><tr><td><a href="{{registration_link}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Register Now</a></td></tr></table><table width="100%"><tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table><p style="color:#666;font-size:12px;text-align:center;margin:0">&copy; 2026 <a href="{{registration_link}}">rentab.ly</a></p></td></tr></table></td></tr></table></body></html>'
WHERE template_key = 'referral_invitation' AND language = 'en';
