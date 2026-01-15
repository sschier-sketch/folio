/*
  # Complete Email Templates Update

  Updates all remaining email templates with new design
*/

UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Passwort zurücksetzen</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p><p style="margin:0">Klicken Sie auf die Schaltfläche unten:</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{resetLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Passwort zurücksetzen</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '1c164f4d-8a22-4adf-883c-63b46997789e';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Reset Your Password</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">You have requested to reset your password.</p><p style="margin:0">Click the button below:</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{resetLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Reset Password</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '0fd739e2-9e89-41a2-96d5-43bca1537b18';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ihr Anmelde-Link</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Klicken Sie auf die Schaltfläche unten, um sich anzumelden:</p><p style="margin:0">Dieser Link ist 15 Minuten gültig.</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{loginLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Jetzt anmelden</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'd77974ab-13f3-46c2-90fb-3bf3fce4d4af';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Your Login Link</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Click the button below to sign in:</p><p style="margin:0">This link is valid for 15 minutes.</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{loginLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Sign In Now</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '68425da7-f06c-44c4-9243-92e09d9b863c';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ihr Zugang zum Mieterportal</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Ihr Vermieter hat Ihnen Zugang zum Mieterportal gewährt.</p><p style="margin:0 0 16px 0"><strong>Immobilie:</strong> {{propertyAddress}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{portalLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Zum Mieterportal</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'b0b8dbd2-82a7-4de8-9c31-9a6f2d7e5a95';

UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Your Access to the Tenant Portal</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Your landlord has granted you access to the tenant portal.</p><p style="margin:0 0 16px 0"><strong>Property:</strong> {{propertyAddress}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{portalLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Go to Tenant Portal</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '031b5041-8ee4-4094-acf6-fb487c766fab';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ihr Premium-Abonnement wurde aktiviert</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Ihr Premium-Abonnement wurde erfolgreich aktiviert!</p><p style="margin:0"><strong>Plan:</strong> {{planName}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/dashboard" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Zum Dashboard</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'bafbe4dd-d2fe-4681-9a6f-73fa6844a63d';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Your Premium Subscription Activated</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Your Premium subscription has been successfully activated!</p><p style="margin:0"><strong>Plan:</strong> {{planName}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/dashboard" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Go to Dashboard</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'f08a2606-82ca-46d4-94ad-28a213057b96';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ihr Abonnement wurde gekündigt</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Ihr Abonnement wurde gekündigt.</p><p style="margin:0"><strong>Zugriff bis:</strong> {{accessUntil}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '5def6948-e300-4c82-a6b4-9f8662e9437e';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Your Subscription Has Been Cancelled</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Your subscription has been cancelled.</p><p style="margin:0"><strong>Access until:</strong> {{accessUntil}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'd62c1f1c-c8ea-4613-b63e-733ae9933267';

UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Entdecke rentab.ly</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0"><strong>{{referrerName}}</strong> empfiehlt Ihnen rentab.ly.</p><p style="margin:0">Registrieren Sie sich jetzt und erhalten Sie <strong>1 Monat PRO kostenlos</strong>!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{referralLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Jetzt registrieren</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '03467cce-9f16-4a6a-ab0e-8478ca8b7c93';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Discover rentab.ly</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0"><strong>{{referrerName}}</strong> recommends rentab.ly.</p><p style="margin:0">Register now and get <strong>1 month PRO for free</strong>!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{referralLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Register Now</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '5384dc67-e923-432a-900f-4b52f5b4f188';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Belohnung verdient!</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Eine Person, die Sie empfohlen haben, hat sich registriert.</p><p style="margin:0">Sie erhalten <strong>2 Monate PRO kostenlos</strong>!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/dashboard" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Zum Dashboard</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'a07d1c52-116e-4750-a329-d1f7b54c02cf';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Reward Earned!</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{userName}}</strong>,</p><p style="margin:0 0 16px 0">Someone you referred has signed up.</p><p style="margin:0">You receive <strong>2 months PRO for free</strong>!</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="https://app.rentab.ly/dashboard" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Go to Dashboard</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '7634e06f-153b-4da1-b3fa-c924331d6f07';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Neue Antwort auf Ihr Ticket</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Es gibt eine neue Antwort auf Ihr Ticket <strong>#{{ticketNumber}}</strong>:</p><p style="margin:0 0 16px 0"><strong>Betreff:</strong> {{ticketSubject}}</p><p style="margin:0"><strong>Antwort:</strong><br>{{replyMessage}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{ticketLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">Ticket anzeigen</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'e5284663-301d-4083-8a68-2b76e8946851';

UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">New Reply to Your Ticket</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">There is a new reply to your ticket <strong>#{{ticketNumber}}</strong>:</p><p style="margin:0 0 16px 0"><strong>Subject:</strong> {{ticketSubject}}</p><p style="margin:0"><strong>Reply:</strong><br>{{replyMessage}}</p>
</div>
<table width="100%" cellpadding="20" cellspacing="0">
<tr><td><a href="{{ticketLink}}" style="background:#3c8af7;border-radius:50px;color:#fff;display:inline-block;padding:10px 30px;text-decoration:none">View Ticket</a></td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'bb18cf17-d599-482c-8853-1306b2fd4c58';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Erinnerung: Mietzahlung</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Erinnerung an Ihre fällige Mietzahlung.</p><p style="margin:0"><strong>Betrag:</strong> {{amount}}<br><strong>Fällig am:</strong> {{dueDate}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'bc337708-8309-4fbe-ad9a-5e3852537538';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Reminder: Rent Payment</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Reminder about your rent payment due.</p><p style="margin:0"><strong>Amount:</strong> {{amount}}<br><strong>Due date:</strong> {{dueDate}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'ca457e74-bfa0-4b2f-a273-36309ef15184';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Ankündigung Mieterhöhung</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Hiermit kündigen wir eine Mieterhöhung an.</p><p style="margin:0"><strong>Neue Miete:</strong> {{newRent}}<br><strong>Gültig ab:</strong> {{effectiveDate}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = 'c2e563d5-4e52-41fa-b8dc-b0b3dca70491';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Rent Increase Notification</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">We hereby announce a rent increase.</p><p style="margin:0"><strong>New rent:</strong> {{newRent}}<br><strong>Effective from:</strong> {{effectiveDate}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '40800b32-cca9-4044-8d83-aec55b3a3fe9';

UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Mietvertrag unterzeichnet</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hallo <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Ihr Mietvertrag wurde erfolgreich unterzeichnet.</p><p style="margin:0"><strong>Mietbeginn:</strong> {{startDate}}<br><strong>Monatliche Miete:</strong> {{monthlyRent}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '7c8a964a-9592-4cb6-b320-69b7ab63fe1e';
UPDATE email_templates SET body_html = '<!DOCTYPE html>
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
<h1 style="margin:0 0 20px 0;color:#3c8af7;font-size:24px">Rental Contract Signed</h1>
<div style="color:#141719;font-size:14px;line-height:1.6;margin-bottom:20px">
<p style="margin:0 0 16px 0">Hello <strong>{{tenantName}}</strong>,</p><p style="margin:0 0 16px 0">Your rental contract has been successfully signed.</p><p style="margin:0"><strong>Lease start:</strong> {{startDate}}<br><strong>Monthly rent:</strong> {{monthlyRent}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #ddd;padding:20px 0"></td></tr></table>
<p style="color:#666;font-size:12px;text-align:center;margin:0">© 2026 <a href="https://rentab.ly" style="color:#141719">rentab.ly</a></p>
</td></tr></table>
</td></tr></table>
</body>
</html>', updated_at = NOW() WHERE id = '7b88c043-5727-461d-9827-ade23f8e11e3';

