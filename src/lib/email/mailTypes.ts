/**
 * Central Mail Registry
 *
 * ALL email types in the system must be defined here.
 * This ensures consistency, idempotency, and trackability.
 */

export enum MailType {
  // Authentication & Onboarding
  WELCOME = 'welcome',
  VERIFY_EMAIL = 'verify_email',
  MAGIC_LOGIN = 'magic_login',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_CONFIRMATION = 'password_reset_confirmation',

  // Trial & Subscription
  TRIAL_STARTING = 'trial_starting',
  TRIAL_ENDING = 'trial_ending',
  TRIAL_ENDED = 'trial_ended',
  PRO_UPGRADE_CONFIRMATION = 'pro_upgrade_confirmation',
  SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',

  // Referral Program
  REFERRAL_INVITATION = 'referral_invitation',
  REFERRAL_REWARD_EARNED = 'referral_reward_earned',
  REFERRAL_MONTHLY_SUMMARY = 'referral_monthly_summary',

  // Affiliate Program
  AFFILIATE_PAYOUT_REQUESTED = 'affiliate_payout_requested',
  AFFILIATE_PAYOUT_PAID = 'affiliate_payout_paid',
  AFFILIATE_MONTHLY_REPORT = 'affiliate_monthly_report',

  // Tenant Portal
  TENANT_PORTAL_ACTIVATION = 'tenant_portal_activation',
  TENANT_PASSWORD_SET = 'tenant_password_set',

  // Tickets & Communication
  TICKET_CREATED = 'ticket_created',
  TICKET_REPLY = 'ticket_reply',
  TICKET_STATUS_CHANGED = 'ticket_status_changed',

  // Financial Reminders
  LOAN_REMINDER = 'loan_reminder',
  RENT_OVERDUE = 'rent_overdue',
  DUNNING_LEVEL_1 = 'dunning_level_1',
  DUNNING_LEVEL_2 = 'dunning_level_2',
  DUNNING_LEVEL_3 = 'dunning_level_3',

  // Admin Alerts
  ADMIN_ALERT = 'admin_alert',
  SYSTEM_ERROR = 'system_error',
}

export type MailCategory = 'transactional' | 'informational';

export interface MailTypeConfig {
  mailType: MailType;
  category: MailCategory;
  description: string;
  trigger: string;
  recipient: 'user' | 'tenant' | 'admin' | 'custom';
  idempotencyStrategy: 'none' | 'userId' | 'userId+date' | 'userId+type+date' | 'custom';
  templateKey?: string;
}

/**
 * Mail Type Registry
 *
 * Defines metadata for each mail type including:
 * - Category (transactional vs informational)
 * - Trigger event
 * - Recipient type
 * - Idempotency strategy
 */
export const MAIL_TYPE_REGISTRY: Record<MailType, MailTypeConfig> = {
  [MailType.WELCOME]: {
    mailType: MailType.WELCOME,
    category: 'transactional',
    description: 'Welcome email after signup',
    trigger: 'User completes registration',
    recipient: 'user',
    idempotencyStrategy: 'userId',
    templateKey: 'welcome',
  },
  [MailType.VERIFY_EMAIL]: {
    mailType: MailType.VERIFY_EMAIL,
    category: 'transactional',
    description: 'Email verification link',
    trigger: 'User signs up (if verification enabled)',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.MAGIC_LOGIN]: {
    mailType: MailType.MAGIC_LOGIN,
    category: 'transactional',
    description: 'Magic link for passwordless login',
    trigger: 'User requests magic login',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.PASSWORD_RESET_REQUEST]: {
    mailType: MailType.PASSWORD_RESET_REQUEST,
    category: 'transactional',
    description: 'Password reset confirmation link',
    trigger: 'User requests password reset',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.PASSWORD_RESET_CONFIRMATION]: {
    mailType: MailType.PASSWORD_RESET_CONFIRMATION,
    category: 'transactional',
    description: 'Password successfully changed notification',
    trigger: 'User completes password reset',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.TRIAL_STARTING]: {
    mailType: MailType.TRIAL_STARTING,
    category: 'informational',
    description: 'Trial period started notification',
    trigger: 'User signs up with trial',
    recipient: 'user',
    idempotencyStrategy: 'userId',
    templateKey: 'trial_starting',
  },
  [MailType.TRIAL_ENDING]: {
    mailType: MailType.TRIAL_ENDING,
    category: 'informational',
    description: 'Trial ending soon reminder (7 days before)',
    trigger: 'Cron job - 7 days before trial_ends_at',
    recipient: 'user',
    idempotencyStrategy: 'userId+date',
    templateKey: 'trial_ending',
  },
  [MailType.TRIAL_ENDED]: {
    mailType: MailType.TRIAL_ENDED,
    category: 'informational',
    description: 'Trial expired notification',
    trigger: 'Cron job - when now > trial_ends_at',
    recipient: 'user',
    idempotencyStrategy: 'userId+date',
    templateKey: 'trial_ended',
  },
  [MailType.PRO_UPGRADE_CONFIRMATION]: {
    mailType: MailType.PRO_UPGRADE_CONFIRMATION,
    category: 'transactional',
    description: 'Pro subscription activated',
    trigger: 'Stripe webhook - subscription activated',
    recipient: 'user',
    idempotencyStrategy: 'userId+type+date',
  },
  [MailType.SUBSCRIPTION_PAYMENT_FAILED]: {
    mailType: MailType.SUBSCRIPTION_PAYMENT_FAILED,
    category: 'transactional',
    description: 'Subscription payment failed',
    trigger: 'Stripe webhook - payment failed',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.SUBSCRIPTION_CANCELLED]: {
    mailType: MailType.SUBSCRIPTION_CANCELLED,
    category: 'transactional',
    description: 'Subscription cancelled confirmation',
    trigger: 'User cancels subscription',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.REFERRAL_INVITATION]: {
    mailType: MailType.REFERRAL_INVITATION,
    category: 'transactional',
    description: 'Referral invitation sent by user',
    trigger: 'User sends referral invitation',
    recipient: 'custom',
    idempotencyStrategy: 'none',
    templateKey: 'referral_invitation',
  },
  [MailType.REFERRAL_REWARD_EARNED]: {
    mailType: MailType.REFERRAL_REWARD_EARNED,
    category: 'transactional',
    description: 'Referral reward granted',
    trigger: 'Referred user subscribes to Pro',
    recipient: 'user',
    idempotencyStrategy: 'custom',
    templateKey: 'referral_reward_earned',
  },
  [MailType.REFERRAL_MONTHLY_SUMMARY]: {
    mailType: MailType.REFERRAL_MONTHLY_SUMMARY,
    category: 'informational',
    description: 'Monthly referral activity summary',
    trigger: 'Cron job - 1st of month',
    recipient: 'user',
    idempotencyStrategy: 'userId+date',
  },
  [MailType.AFFILIATE_PAYOUT_REQUESTED]: {
    mailType: MailType.AFFILIATE_PAYOUT_REQUESTED,
    category: 'transactional',
    description: 'Affiliate payout request received',
    trigger: 'Affiliate requests payout',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.AFFILIATE_PAYOUT_PAID]: {
    mailType: MailType.AFFILIATE_PAYOUT_PAID,
    category: 'transactional',
    description: 'Affiliate payout completed',
    trigger: 'Admin approves payout',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.AFFILIATE_MONTHLY_REPORT]: {
    mailType: MailType.AFFILIATE_MONTHLY_REPORT,
    category: 'informational',
    description: 'Monthly affiliate earnings report',
    trigger: 'Cron job - 1st of month',
    recipient: 'user',
    idempotencyStrategy: 'userId+date',
  },
  [MailType.TENANT_PORTAL_ACTIVATION]: {
    mailType: MailType.TENANT_PORTAL_ACTIVATION,
    category: 'transactional',
    description: 'Tenant portal access invitation',
    trigger: 'Landlord activates tenant portal access',
    recipient: 'tenant',
    idempotencyStrategy: 'custom',
    templateKey: 'tenant_portal_activation',
  },
  [MailType.TENANT_PASSWORD_SET]: {
    mailType: MailType.TENANT_PASSWORD_SET,
    category: 'transactional',
    description: 'Tenant portal password set confirmation',
    trigger: 'Tenant sets portal password',
    recipient: 'tenant',
    idempotencyStrategy: 'custom',
  },
  [MailType.TICKET_CREATED]: {
    mailType: MailType.TICKET_CREATED,
    category: 'transactional',
    description: 'New support ticket created',
    trigger: 'User/Tenant creates ticket',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.TICKET_REPLY]: {
    mailType: MailType.TICKET_REPLY,
    category: 'transactional',
    description: 'Reply to support ticket',
    trigger: 'Landlord/Admin replies to ticket',
    recipient: 'custom',
    idempotencyStrategy: 'none',
  },
  [MailType.TICKET_STATUS_CHANGED]: {
    mailType: MailType.TICKET_STATUS_CHANGED,
    category: 'transactional',
    description: 'Ticket status changed notification',
    trigger: 'Ticket status updated',
    recipient: 'user',
    idempotencyStrategy: 'none',
  },
  [MailType.LOAN_REMINDER]: {
    mailType: MailType.LOAN_REMINDER,
    category: 'informational',
    description: 'Loan milestone reminder (interest end, repayment)',
    trigger: 'Cron job - X days before loan event',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.RENT_OVERDUE]: {
    mailType: MailType.RENT_OVERDUE,
    category: 'informational',
    description: 'Rent payment overdue notification',
    trigger: 'Cron job - rent not paid by due date',
    recipient: 'user',
    idempotencyStrategy: 'custom',
  },
  [MailType.DUNNING_LEVEL_1]: {
    mailType: MailType.DUNNING_LEVEL_1,
    category: 'informational',
    description: 'First dunning reminder',
    trigger: 'Cron job - based on dunning rules',
    recipient: 'tenant',
    idempotencyStrategy: 'custom',
  },
  [MailType.DUNNING_LEVEL_2]: {
    mailType: MailType.DUNNING_LEVEL_2,
    category: 'informational',
    description: 'Second dunning reminder',
    trigger: 'Cron job - based on dunning rules',
    recipient: 'tenant',
    idempotencyStrategy: 'custom',
  },
  [MailType.DUNNING_LEVEL_3]: {
    mailType: MailType.DUNNING_LEVEL_3,
    category: 'informational',
    description: 'Final dunning reminder',
    trigger: 'Cron job - based on dunning rules',
    recipient: 'tenant',
    idempotencyStrategy: 'custom',
  },
  [MailType.ADMIN_ALERT]: {
    mailType: MailType.ADMIN_ALERT,
    category: 'transactional',
    description: 'Alert for admins (security, abuse, etc)',
    trigger: 'System detects alert condition',
    recipient: 'admin',
    idempotencyStrategy: 'none',
  },
  [MailType.SYSTEM_ERROR]: {
    mailType: MailType.SYSTEM_ERROR,
    category: 'transactional',
    description: 'Critical system error notification',
    trigger: 'System encounters critical error',
    recipient: 'admin',
    idempotencyStrategy: 'none',
  },
};

/**
 * Generate idempotency key based on mail type strategy
 */
export function generateIdempotencyKey(
  mailType: MailType,
  userId?: string,
  customKey?: string
): string | undefined {
  const config = MAIL_TYPE_REGISTRY[mailType];
  const today = new Date().toISOString().split('T')[0];

  switch (config.idempotencyStrategy) {
    case 'none':
      return undefined;

    case 'userId':
      return userId ? `${mailType}:${userId}` : undefined;

    case 'userId+date':
      return userId ? `${mailType}:${userId}:${today}` : undefined;

    case 'userId+type+date':
      return userId ? `${mailType}:${userId}:${today}` : undefined;

    case 'custom':
      return customKey;

    default:
      return undefined;
  }
}

/**
 * Get mail type configuration
 */
export function getMailTypeConfig(mailType: MailType): MailTypeConfig {
  return MAIL_TYPE_REGISTRY[mailType];
}
