export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketCategory = 'general' | 'maintenance' | 'repair' | 'complaint' | 'question';

export interface MailThread {
  id: string;
  user_id: string;
  tenant_id: string | null;
  external_email: string | null;
  external_name: string | null;
  subject: string;
  folder: 'inbox' | 'sent' | 'unknown' | 'trash';
  status: 'unread' | 'read' | 'archived';
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  priority: TicketPriority | null;
  category: TicketCategory | null;
  ticket_id: string | null;
  tenants?: {
    first_name: string;
    last_name: string;
    email: string | null;
  } | null;
}

export interface MailAttachment {
  id: string;
  message_id: string;
  filename: string;
  content_type: string;
  file_size: number;
  storage_path: string;
}

export interface MailMessage {
  id: string;
  thread_id: string;
  user_id: string;
  direction: 'inbound' | 'outbound';
  sender_address: string;
  sender_name: string;
  recipient_address: string;
  recipient_name: string;
  body_text: string;
  body_html: string | null;
  tenant_communication_id: string | null;
  created_at: string;
  mail_attachments?: MailAttachment[];
}

export interface UserMailbox {
  user_id: string;
  alias_localpart: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Folder = 'inbox' | 'sent' | 'unknown' | 'trash';
