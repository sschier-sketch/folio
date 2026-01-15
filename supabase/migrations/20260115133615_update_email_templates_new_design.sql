/*
  # Email Templates Design Update
  
  Updates all email templates with a new, modern HTML design featuring:
  - Clean, responsive layout
  - rentab.ly branding
  - Professional color scheme
  - Mobile-optimized styling
*/

-- Registration DE
UPDATE email_templates
SET body_html = '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}@media only screen and (max-width:600px){.container{width:100%!important}}</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff">
<tr><td align="center" style="padding:20px 0">
<table width="600" cellpadding="0" cellspacing="0" style="background:#faf8f8;border-radius:8px">
<tr><td style="padding:30px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding-bottom:30px">
<a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Willkommen bei rentab.ly</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{userName}}</strong>,</p>
<p style="margin:0 0 16px 0">vielen Dank für Ihre Registrierung bei rentab.ly! Wir freuen uns, Sie als neues Mitglied begrüßen zu dürfen.</p>
<p style="margin:0">Viel Erfolg mit Ihrer Immobilienverwaltung!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/login" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Zur Anmeldung</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>',
updated_at = NOW()
WHERE id = 'a76ce1ab-1f6e-4c8c-8087-8cd28e7bc031';

-- Registration EN
UPDATE email_templates
SET body_html = '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;font-family:Arial,sans-serif;background:#fff}table{border-collapse:collapse}@media only screen and (max-width:600px){.container{width:100%!important}}</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff">
<tr><td align="center" style="padding:20px 0">
<table width="600" cellpadding="0" cellspacing="0" style="background:#faf8f8;border-radius:8px">
<tr><td style="padding:30px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding-bottom:30px">
<a href="https://rentab.ly"><img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentab.ly" width="200"></a>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Welcome to rentab.ly</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{userName}}</strong>,</p>
<p style="margin:0 0 16px 0">Thank you for registering with rentab.ly! We are pleased to welcome you as a new member.</p>
<p style="margin:0">Good luck with your property management!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/login" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Go to Login</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>',
updated_at = NOW()
WHERE id = '85063981-1956-4cbe-b243-dfcd18199126';