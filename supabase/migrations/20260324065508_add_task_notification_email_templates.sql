/*
  # Add email templates for task notifications

  ## New Templates
  1. `task_status_changed` (de/en) - Notify tenant when task status changes
     Variables: tenantName, taskTitle, oldStatus, newStatus, propertyName, taskCategory
  2. `task_assigned` (de/en) - Notify team member when assigned to a task
     Variables: assigneeName, taskTitle, taskDescription, propertyName, taskCategory, taskPriority, dueDate, assignedBy

  ## Notes
  - Uses the same HTML structure as existing templates (ticket_reply pattern)
  - Category: transactional
  - No existing templates are modified
*/

-- 1. task_status_changed - German
INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables, category)
VALUES (
  'task_status_changed',
  'de',
  'Aufgaben-Statusänderung (Mieter)',
  'Benachrichtigt den Mieter über eine Statusänderung einer verknüpften Aufgabe',
  'Aufgabe aktualisiert: {{taskTitle}}',
  '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aufgaben-Status</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Status Ihrer Anfrage aktualisiert</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">der Status der Aufgabe <strong style="color: #1E1E24;">{{taskTitle}}</strong> wurde aktualisiert.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fb; border-radius: 6px; padding: 0;">
<tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Neuer Status</p>
<p style="margin: 0 0 16px; color: #1E1E24; font-size: 16px; font-weight: 600;">{{newStatus}}</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Immobilie: <span style="color: #555;">{{propertyName}}</span></p>
<p style="margin: 0; color: #999; font-size: 12px;">Kategorie: <span style="color: #555;">{{taskCategory}}</span></p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 20px 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">Bei Fragen k&ouml;nnen Sie sich jederzeit &uuml;ber Ihr Mieterportal an Ihren Vermieter wenden.</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Mieter bei rentably registriert sind.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'Status Ihrer Anfrage aktualisiert

Hallo {{tenantName}},

der Status der Aufgabe "{{taskTitle}}" wurde aktualisiert.

Neuer Status: {{newStatus}}
Immobilie: {{propertyName}}
Kategorie: {{taskCategory}}

Bei Fragen können Sie sich jederzeit über Ihr Mieterportal an Ihren Vermieter wenden.

--
rentably | https://rentab.ly
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum',
  '["tenantName", "taskTitle", "oldStatus", "newStatus", "propertyName", "taskCategory"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

-- 2. task_status_changed - English
INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables, category)
VALUES (
  'task_status_changed',
  'en',
  'Task Status Change (Tenant)',
  'Notifies the tenant about a status change of a linked task',
  'Task updated: {{taskTitle}}',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Task Status</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Your request status has been updated</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{tenantName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">the status of task <strong style="color: #1E1E24;">{{taskTitle}}</strong> has been updated.</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fb; border-radius: 6px; padding: 0;">
<tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 8px; color: #999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">New Status</p>
<p style="margin: 0 0 16px; color: #1E1E24; font-size: 16px; font-weight: 600;">{{newStatus}}</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Property: <span style="color: #555;">{{propertyName}}</span></p>
<p style="margin: 0; color: #999; font-size: 12px;">Category: <span style="color: #555;">{{taskCategory}}</span></p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 20px 32px 28px;">
<p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">If you have any questions, you can contact your landlord through the tenant portal at any time.</p>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are registered as a tenant on rentably.</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'Your request status has been updated

Hello {{tenantName}},

the status of task "{{taskTitle}}" has been updated.

New Status: {{newStatus}}
Property: {{propertyName}}
Category: {{taskCategory}}

If you have any questions, you can contact your landlord through the tenant portal at any time.

--
rentably | https://rentab.ly
Privacy: https://rentab.ly/datenschutz | Imprint: https://rentab.ly/impressum',
  '["tenantName", "taskTitle", "oldStatus", "newStatus", "propertyName", "taskCategory"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

-- 3. task_assigned - German
INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables, category)
VALUES (
  'task_assigned',
  'de',
  'Aufgabe zugewiesen (Benutzer)',
  'Benachrichtigt einen Benutzer, wenn ihm eine Aufgabe zugewiesen wird',
  'Neue Aufgabe zugewiesen: {{taskTitle}}',
  '<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aufgabe zugewiesen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">Neue Aufgabe zugewiesen</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hallo <strong style="color: #1E1E24;">{{assigneeName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">Ihnen wurde eine neue Aufgabe zugewiesen:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fb; border-radius: 6px; padding: 0;">
<tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 16px; font-weight: 600;">{{taskTitle}}</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Immobilie: <span style="color: #555;">{{propertyName}}</span></p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Kategorie: <span style="color: #555;">{{taskCategory}}</span></p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Priorit&auml;t: <span style="color: #555;">{{taskPriority}}</span></p>
<p style="margin: 0; color: #999; font-size: 12px;">F&auml;llig: <span style="color: #555;">{{dueDate}}</span></p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 20px 32px;">
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">{{taskDescription}}</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">Im Dashboard &ouml;ffnen</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">Sie erhalten diese E-Mail, weil Sie als Nutzer bei rentably angemeldet sind.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mo &ndash; Fr, 9:00 &ndash; 18:00 Uhr</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Datenschutz</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Impressum</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Kontakt</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'Neue Aufgabe zugewiesen

Hallo {{assigneeName}},

Ihnen wurde eine neue Aufgabe zugewiesen:

{{taskTitle}}
Immobilie: {{propertyName}}
Kategorie: {{taskCategory}}
Prioritaet: {{taskPriority}}
Faellig: {{dueDate}}

{{taskDescription}}

Zugewiesen von: {{assignedBy}}

Im Dashboard oeffnen: https://rentab.ly/dashboard

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mo - Fr, 9:00 - 18:00 Uhr
Datenschutz: https://rentab.ly/datenschutz | Impressum: https://rentab.ly/impressum | Kontakt: https://rentab.ly/kontakt',
  '["assigneeName", "taskTitle", "taskDescription", "propertyName", "taskCategory", "taskPriority", "dueDate", "assignedBy"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;

-- 4. task_assigned - English
INSERT INTO email_templates (template_key, language, template_name, description, subject, body_html, body_text, variables, category)
VALUES (
  'task_assigned',
  'en',
  'Task Assigned (User)',
  'Notifies a team member when a task is assigned to them',
  'New task assigned: {{taskTitle}}',
  '<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Task Assigned</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: ''Manrope'', Arial, Helvetica, sans-serif; -webkit-text-size-adjust: none; text-size-adjust: none;">
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
<tr><td align="center" style="padding: 32px 16px;">
<table width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">

<tr><td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #eee;">
<a href="https://rentab.ly" target="_blank" style="display: inline-block;">
<img src="https://6f36f82794.imgdist.com/pub/bfra/2bnm3c1v/dzm/8g5/nzj/rentably-logo.svg" alt="rentably" width="180" style="display: block; height: auto; border: 0;" />
</a>
</td></tr>

<tr><td style="padding: 28px 32px 0;">
<h1 style="margin: 0 0 20px; color: #1E1E24; font-size: 20px; font-weight: 700; line-height: 1.4;">New task assigned</h1>
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #1E1E24;">{{assigneeName}}</strong>,</p>
<p style="margin: 0 0 20px; color: #555; font-size: 14px; line-height: 1.6;">a new task has been assigned to you:</p>
</td></tr>

<tr><td style="padding: 0 32px;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fb; border-radius: 6px; padding: 0;">
<tr><td style="padding: 16px 20px;">
<p style="margin: 0 0 12px; color: #1E1E24; font-size: 16px; font-weight: 600;">{{taskTitle}}</p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Property: <span style="color: #555;">{{propertyName}}</span></p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Category: <span style="color: #555;">{{taskCategory}}</span></p>
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">Priority: <span style="color: #555;">{{taskPriority}}</span></p>
<p style="margin: 0; color: #999; font-size: 12px;">Due: <span style="color: #555;">{{dueDate}}</span></p>
</td></tr>
</table>
</td></tr>

<tr><td style="padding: 20px 32px;">
<p style="margin: 0 0 8px; color: #555; font-size: 14px; line-height: 1.6;">{{taskDescription}}</p>
</td></tr>

<tr><td style="padding: 0 32px 28px; text-align: center;">
<a href="https://rentab.ly/dashboard" style="display: inline-block; background-color: #3c8af7; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 600;">Open in Dashboard</a>
</td></tr>

<tr><td style="padding: 20px 32px; border-top: 1px solid #eee; text-align: center;">
<p style="margin: 0 0 4px; color: #999; font-size: 12px;">&copy; 2026 <a href="https://rentab.ly" style="color: #3c8af7; text-decoration: none;">rentably</a></p>
<p style="margin: 0 0 8px; color: #bbb; font-size: 11px; line-height: 1.5;">You are receiving this email because you are registered as a user on rentably.</p>
<p style="margin: 0 0 6px; color: #bbb; font-size: 11px; line-height: 1.8;"><a href="mailto:hallo@rentab.ly" style="color: #3c8af7; text-decoration: none;">hallo@rentab.ly</a>&nbsp;&nbsp;|&nbsp;&nbsp;<a href="https://wa.me/493022334468" style="color: #3c8af7; text-decoration: none;">WhatsApp</a>&nbsp;&nbsp;|&nbsp;&nbsp;Mon &ndash; Fri, 9:00 &ndash; 18:00</p>
<p style="margin: 0; color: #bbb; font-size: 11px; line-height: 1.5;"><a href="https://rentab.ly/datenschutz" style="color: #3c8af7; text-decoration: none;">Privacy</a>&nbsp;|&nbsp;<a href="https://rentab.ly/impressum" style="color: #3c8af7; text-decoration: none;">Imprint</a>&nbsp;|&nbsp;<a href="https://rentab.ly/kontakt" style="color: #3c8af7; text-decoration: none;">Contact</a></p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>',
  'New task assigned

Hello {{assigneeName}},

a new task has been assigned to you:

{{taskTitle}}
Property: {{propertyName}}
Category: {{taskCategory}}
Priority: {{taskPriority}}
Due: {{dueDate}}

{{taskDescription}}

Assigned by: {{assignedBy}}

Open in Dashboard: https://rentab.ly/dashboard

--
rentably | hallo@rentab.ly | WhatsApp: https://wa.me/493022334468
Mon - Fri, 9:00 - 18:00
Privacy: https://rentab.ly/datenschutz | Imprint: https://rentab.ly/impressum | Contact: https://rentab.ly/kontakt',
  '["assigneeName", "taskTitle", "taskDescription", "propertyName", "taskCategory", "taskPriority", "dueDate", "assignedBy"]'::jsonb,
  'transactional'
)
ON CONFLICT (template_key, language) DO NOTHING;
