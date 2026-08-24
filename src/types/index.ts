export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatarUrl?: string;
  assignedPhoneNumberIds: string[];
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Contact {
  _id: string;
  waId: string;
  name: string;
  profileName?: string;
  phoneNumber: string;
  email?: string;
  avatarUrl?: string;
  tags: string[];
  groups: string[];
  attributes: Record<string, string>;
  notes?: string;
  isBlocked: boolean;
}

export interface Tag {
  _id: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactSummary {
  _id: string;
  name: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  contactIds: string[] | ContactSummary[];
  contactCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type AttributeType = "text" | "number" | "date" | "boolean" | "list";

export interface AttributeDef {
  _id: string;
  key: string;
  label: string;
  type: AttributeType;
  options?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// GET /contacts (and /contacts/:id) populate tags → Tag[] and groups → Group[]
// (name-only), unlike the bare id arrays on the base Contact shape used
// elsewhere (e.g. the conversation's embedded contact).
export interface ContactWithRelations extends Omit<Contact, "tags" | "groups"> {
  tags: Tag[];
  groups: Pick<Group, "_id" | "name">[];
}

export type ConversationStatus = "open" | "pending" | "closed";

export interface Conversation {
  _id: string;
  contact: Contact;
  waId: string;
  phoneNumberId: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastCustomerMessageAt?: string;
  unreadCount: number;
  status: ConversationStatus;
  canSendFreeform: boolean;
}

export type MessageDirection = "inbound" | "outbound";
export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "pending";
export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contacts"
  | "template"
  | "reaction"
  | "system";

export interface MessageReaction {
  emoji: string;
  waId: string;
  reactedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  waMessageId?: string;
  direction: MessageDirection;
  type: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaId?: string;
  mediaMimeType?: string;
  caption?: string;
  templateName?: string;
  status: MessageStatus;
  sentBy?: string;
  repliedToMessage?: { _id: string; text?: string; type: MessageType; direction: MessageDirection } | string;
  repliedToWaMessageId?: string;
  forwardedFromMessage?: string;
  reactions: MessageReaction[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsappIntegration {
  id: string;
  label?: string;
  isDefault: boolean;
  isActive: boolean;
  status: "unverified" | "connected" | "failed" | "expired";
  lastCheckedAt?: string;
  lastError?: string;
  whatsapp?: {
    phoneNumber: string;
    phoneNumberId: string;
    wabaId: string;
    appId: string;
    businessVerificationStatus: "pending" | "verified" | "rejected";
    tokenType: "temporary" | "permanent";
    tokenExpiry?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}
