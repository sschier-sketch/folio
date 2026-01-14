/*
  # Create English Email Templates (Fixed JSONB Format)

  1. New Templates
    - Create English versions of all existing templates
    - Professional English content
    - Same variables as German versions (JSONB format)
    - Consistent branding (rentab.ly)

  2. Templates Created (EN)
    - registration
    - user_invitation
    - password_reset
    - tenant_portal_activation
    - ticket_reply
    - contract_signed
    - rent_payment_reminder
    - rent_increase_notification
    - subscription_started
    - subscription_cancelled
    - login_link
*/

-- 1. Registration (Welcome Email) - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'registration',
  'Welcome Email',
  'Welcome to rentab.ly',
  'Welcome email for new users after successful registration',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to rentab.ly!</h1>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Thank you for registering with rentab.ly, your modern solution for professional property management!
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    You can now log in with your email address <strong>{{user_email}}</strong> and manage your properties.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">What you can do with rentab.ly:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>Manage properties and units digitally</li>
      <li>Create and organize rental contracts</li>
      <li>Track and document rent payments</li>
      <li>Handle tickets and requests</li>
      <li>Tenant portal for direct communication</li>
      <li>Store documents centrally</li>
    </ul>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    If you have any questions, we are always here to help.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Best of luck with rentab.ly!<br>
    Your rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly - Modern Property Management
  </p>
</div>',
  'Welcome to rentab.ly!

Hello {{user_name}},

Thank you for registering with rentab.ly, your modern solution for professional property management!

You can now log in with your email address {{user_email}} and manage your properties.

What you can do with rentab.ly:
- Manage properties and units digitally
- Create and organize rental contracts
- Track and document rent payments
- Handle tickets and requests
- Tenant portal for direct communication
- Store documents centrally

If you have any questions, we are always here to help.

Best of luck with rentab.ly!
Your rentab.ly Team

---
© 2026 rentab.ly - Modern Property Management',
  '["user_name", "user_email"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 2. User Invitation - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'user_invitation',
  'User Invitation',
  'You have been invited to rentab.ly',
  'Invitation email for new users to join',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Invitation to rentab.ly</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello,</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    <strong>{{inviter_name}}</strong> has invited you to use rentab.ly.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    An account has been created for the email address <strong>{{invitee_email}}</strong>.
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{invitation_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Accept Invitation
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    rentab.ly is your modern solution for professional property management.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Invitation to rentab.ly

Hello,

{{inviter_name}} has invited you to use rentab.ly.

An account has been created for the email address {{invitee_email}}.

Click the following link to accept the invitation:
{{invitation_link}}

rentab.ly is your modern solution for professional property management.

---
© 2026 rentab.ly',
  '["inviter_name", "invitation_link", "invitee_email"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 3. Password Reset - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'password_reset',
  'Password Reset',
  'Reset your password - rentab.ly',
  'Email for password reset',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Reset Your Password</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    You have requested to reset your password.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Click the button below to set a new password:
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{reset_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Reset Password
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    For security reasons, this link is only valid for 24 hours.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    If you did not request this change, please ignore this email. Your password will remain unchanged.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Reset Your Password

Hello {{user_name}},

You have requested to reset your password.

Click the following link to set a new password:
{{reset_link}}

For security reasons, this link is only valid for 24 hours.

If you did not request this change, please ignore this email. Your password will remain unchanged.

---
© 2026 rentab.ly',
  '["user_name", "reset_link"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 4. Tenant Portal Activation - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'tenant_portal_activation',
  'Tenant Portal Activation',
  'Your Access to the Tenant Portal - rentab.ly',
  'Email for tenant portal access activation',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Welcome to the Tenant Portal</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{tenant_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Your landlord <strong>{{landlord_name}}</strong> ({{landlord_email}}) has set up tenant portal access for you.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">In the tenant portal you can:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>View your contract details</li>
      <li>Download documents</li>
      <li>Submit meter readings</li>
      <li>Create tickets and send messages</li>
      <li>Manage your contact information</li>
    </ul>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{portal_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Go to Tenant Portal
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Your login credentials:<br>
    Email: <strong>{{tenant_email}}</strong>
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    If you have any questions, please contact your landlord directly.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Welcome to the Tenant Portal

Hello {{tenant_name}},

Your landlord {{landlord_name}} ({{landlord_email}}) has set up tenant portal access for you.

In the tenant portal you can:
- View your contract details
- Download documents
- Submit meter readings
- Create tickets and send messages
- Manage your contact information

Portal access:
{{portal_link}}

Your login credentials:
Email: {{tenant_email}}

If you have any questions, please contact your landlord directly.

---
© 2026 rentab.ly',
  '["tenant_name", "tenant_email", "portal_link", "landlord_name", "landlord_email"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 5. Ticket Reply - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'ticket_reply',
  'Ticket Reply',
  'Re: {{ticketSubject}} [Ticket #{{ticketNumber}}]',
  'Email notification for new ticket replies',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">New Reply to Your Ticket</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{recipientName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    <strong>{{senderName}}</strong> has replied to your ticket.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <p style="margin: 0; white-space: pre-wrap; color: #1e293b;">{{replyMessage}}</p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Ticket No.: <strong>#{{ticketNumber}}</strong><br>
    Subject: {{ticketSubject}}
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    {{additionalInfo}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'New Reply to Your Ticket

Hello {{recipientName}},

{{senderName}} has replied to your ticket.

---
{{replyMessage}}
---

Ticket No.: #{{ticketNumber}}
Subject: {{ticketSubject}}

{{additionalInfo}}

---
© 2026 rentab.ly',
  '["recipientName", "ticketNumber", "ticketSubject", "replyMessage", "additionalInfo", "senderName"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 6. Contract Signed - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'contract_signed',
  'Contract Signed',
  'Rental Contract Signed - {{propertyAddress}}',
  'Confirmation after contract signing',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Rental Contract Signed</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{recipientName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    The rental contract for the property <strong>{{propertyAddress}}</strong> has been successfully signed.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Contract Details</h3>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Tenant:</strong> {{tenantName}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Property:</strong> {{propertyAddress}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Lease Start:</strong> {{startDate}}
    </p>
    <p style="color: #475569; margin: 8px 0;">
      <strong>Monthly Rent:</strong> €{{monthlyRent}}
    </p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    A copy of the contract is available in your account.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Rental Contract Signed

Hello {{recipientName}},

The rental contract for the property {{propertyAddress}} has been successfully signed.

Contract Details:
- Tenant: {{tenantName}}
- Property: {{propertyAddress}}
- Lease Start: {{startDate}}
- Monthly Rent: €{{monthlyRent}}

A copy of the contract is available in your account.

---
© 2026 rentab.ly',
  '["recipientName", "propertyAddress", "tenantName", "startDate", "monthlyRent"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 7. Rent Payment Reminder - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'rent_payment_reminder',
  'Rent Payment Reminder',
  'Reminder: Rent Payment for {{propertyAddress}}',
  'Reminder for due rent payment',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Reminder: Rent Payment</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{tenantName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    This is a friendly reminder that the rent payment for <strong>{{propertyAddress}}</strong> is due.
  </p>
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
    <p style="color: #92400e; margin: 8px 0;">
      <strong>Amount:</strong> €{{amount}}
    </p>
    <p style="color: #92400e; margin: 8px 0;">
      <strong>Due Date:</strong> {{dueDate}}
    </p>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    Please transfer the amount to the registered account promptly.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    If you have already paid, please disregard this email.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Best regards,<br>
    {{landlordName}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Reminder: Rent Payment

Hello {{tenantName}},

This is a friendly reminder that the rent payment for {{propertyAddress}} is due.

Amount: €{{amount}}
Due Date: {{dueDate}}

Please transfer the amount to the registered account promptly.

If you have already paid, please disregard this email.

Best regards,
{{landlordName}}

---
© 2026 rentab.ly',
  '["tenantName", "propertyAddress", "amount", "dueDate", "landlordName"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 8. Rent Increase Notification - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'rent_increase_notification',
  'Rent Increase Notification',
  'Rent Increase Notification - {{propertyAddress}}',
  'Notification of upcoming rent increase',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Rent Increase Notification</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Dear {{tenantName}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    We are writing to inform you of a rent adjustment for the property <strong>{{propertyAddress}}</strong>.
  </p>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Current Rent:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">€{{currentRent}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">New Rent:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #2563eb;">€{{newRent}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b; border-top: 1px solid #e2e8f0;">Increase:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b; border-top: 1px solid #e2e8f0;">+€{{increaseAmount}} ({{increasePercentage}}%)</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #64748b;">Effective From:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #1e293b;">{{effectiveDate}}</td>
      </tr>
    </table>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    {{additionalInfo}}
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Best regards,<br>
    {{landlordName}}
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Rent Increase Notification

Dear {{tenantName}},

We are writing to inform you of a rent adjustment for the property {{propertyAddress}}.

Current Rent: €{{currentRent}}
New Rent: €{{newRent}}
Increase: +€{{increaseAmount}} ({{increasePercentage}}%)
Effective From: {{effectiveDate}}

{{additionalInfo}}

Best regards,
{{landlordName}}

---
© 2026 rentab.ly',
  '["tenantName", "propertyAddress", "currentRent", "newRent", "increaseAmount", "increasePercentage", "effectiveDate", "additionalInfo", "landlordName"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 9. Subscription Started - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'subscription_started',
  'Subscription Activated',
  'Your Premium Subscription Has Been Activated - rentab.ly',
  'Confirmation of subscription activation',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Welcome to Premium!</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Your <strong>{{subscription_plan}}</strong> subscription has been successfully activated!
  </p>
  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 30px 0;">
    <p style="color: #166534; font-weight: 600; margin: 0;">
      You now have access to all premium features!
    </p>
  </div>
  <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 30px 0;">
    <h3 style="color: #2563eb; margin-top: 0;">Your Premium Benefits:</h3>
    <ul style="color: #475569; line-height: 1.8;">
      <li>Unlimited properties and units</li>
      <li>Tenant portal for direct communication</li>
      <li>Advanced financial analytics</li>
      <li>Automatic utility billing</li>
      <li>Unlimited document management</li>
      <li>Priority support</li>
    </ul>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Enjoy rentab.ly Premium!<br>
    Your rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Welcome to Premium!

Hello {{user_name}},

Your {{subscription_plan}} subscription has been successfully activated!

You now have access to all premium features!

Your Premium Benefits:
- Unlimited properties and units
- Tenant portal for direct communication
- Advanced financial analytics
- Automatic utility billing
- Unlimited document management
- Priority support

Enjoy rentab.ly Premium!
Your rentab.ly Team

---
© 2026 rentab.ly',
  '["user_name", "subscription_plan"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 10. Subscription Cancelled - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'subscription_cancelled',
  'Subscription Cancelled',
  'Your Subscription Has Been Cancelled - rentab.ly',
  'Confirmation of subscription cancellation',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Subscription Cancelled</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Your cancellation has been successfully processed.
  </p>
  <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 30px 0;">
    <p style="color: #92400e; margin: 0;">
      Your subscription will remain active until <strong>{{end_date}}</strong>.<br>
      Until then, you can continue to use all premium features.
    </p>
  </div>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    We are sorry to see you go! We would be happy to welcome you back to rentab.ly in the future.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    If you have any feedback for us, feel free to reply to this email.
  </p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    Thank you for your trust!<br>
    Your rentab.ly Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Subscription Cancelled

Hello {{user_name}},

Your cancellation has been successfully processed.

Your subscription will remain active until {{end_date}}.
Until then, you can continue to use all premium features.

We are sorry to see you go! We would be happy to welcome you back to rentab.ly in the future.

If you have any feedback for us, feel free to reply to this email.

Thank you for your trust!
Your rentab.ly Team

---
© 2026 rentab.ly',
  '["user_name", "end_date"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;

-- 11. Login Link - EN
INSERT INTO email_templates (
  template_key, template_name, subject, description, body_html, body_text, variables, language
) VALUES (
  'login_link',
  'Login Link',
  'Your Login Link - rentab.ly',
  'Email with temporary login link',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Your Login Link</h2>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">Hello {{user_name}},</p>
  <p style="font-size: 16px; line-height: 1.6; color: #1e293b;">
    You have requested a login link. Click the button below to log in:
  </p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{login_link}}" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Log In Now
    </a>
  </div>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    For security reasons, this link is only valid for a short time.
  </p>
  <p style="font-size: 14px; line-height: 1.6; color: #64748b;">
    If you did not request this link, please ignore this email.
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
  <p style="color: #64748b; font-size: 12px; text-align: center;">
    © 2026 rentab.ly
  </p>
</div>',
  'Your Login Link

Hello {{user_name}},

You have requested a login link. Click the following link to log in:

{{login_link}}

For security reasons, this link is only valid for a short time.

If you did not request this link, please ignore this email.

---
© 2026 rentab.ly',
  '["user_name", "login_link"]'::jsonb,
  'en'
) ON CONFLICT (template_key, language) DO NOTHING;