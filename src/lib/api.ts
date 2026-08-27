import type {
  ApiEnvelope,
  AttributeDef,
  AttributeType,
  AuthUser,
  BusinessProfile,
  Contact,
  ContactWithRelations,
  Conversation,
  Group,
  LoginResult,
  Message,
  PaginatedEnvelope,
  Tag,
  WhatsappIntegration,
  WhatsappTemplate,
  TemplateCategory,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

// Media endpoints (POST /messages/upload, POST /profile/picture) need this
// second static header on top of the Bearer token — see the design guide
// §5. Baked in at build time; swap for a config-endpoint fetch if your
// deployment needs it resolved at runtime instead.
const SERVICE_TOKEN = process.env.NEXT_PUBLIC_JESTY_SERVICE_TOKEN ?? "";

class ApiClientError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("jesty_access_token");
}

export function setAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem("jesty_access_token", token);
  else window.localStorage.removeItem("jesty_access_token");
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has("Content-Type") && rest.body && typeof rest.body === "string") {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include",
  });

  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body) {
    throw new ApiClientError(res.status, body?.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

// The plain HTTP client above returns .data directly; some callers need
// pagination too, so this variant returns the full envelope.
async function requestPaginated<T>(path: string, init: RequestInit = {}): Promise<PaginatedEnvelope<T>> {
  const token = getAccessToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const body = (await res.json()) as PaginatedEnvelope<T>;
  if (!res.ok) throw new ApiClientError(res.status, body.message ?? "Request failed");
  return body;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
  // The /sso/callback?token=... page exchanges the short-lived handoff
  // token (minted by the other backend's "Open inbox" button) for a normal
  // Jesty session — same response shape as login().
  ssoLogin: (token: string) =>
    request<LoginResult>("/auth/sso", {
      method: "POST",
      body: JSON.stringify({ token }),
      auth: false,
    }),
  me: () => request<{ user: AuthUser }>("/auth/me"),
  logout: () => request<null>("/auth/logout", { method: "POST" }),
};

export const conversationsApi = {
  list: (params: { status?: string; search?: string; phoneNumberId?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    if (params.phoneNumberId) qs.set("phoneNumberId", params.phoneNumberId);
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 30));
    return requestPaginated<Conversation>(`/conversations?${qs.toString()}`);
  },
  get: (id: string) => request<Conversation>(`/conversations/${id}`),
  updateStatus: (id: string, status: string) =>
    request<Conversation>(`/conversations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  markRead: (id: string) => request<Conversation>(`/conversations/${id}/read`, { method: "POST" }),
  messages: (conversationId: string, page = 1, limit = 50) =>
    requestPaginated<Message>(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`),
};

export const messagesApi = {
  send: (payload: {
    conversationId: string;
    type?: string;
    text?: string;
    mediaUrl?: string;
    mediaId?: string;
    caption?: string;
    filename?: string;
    templateName?: string;
    languageCode?: string;
    replyToMessageId?: string;
  }) => request<Message>("/messages", { method: "POST", body: JSON.stringify(payload) }),

  // Multipart upload — distinct helper so the service-token header is never
  // forgotten on this call path (see design guide §5).
  upload: async (payload: {
    conversationId: string;
    type: "image" | "video" | "audio" | "document" | "sticker";
    file: File;
    caption?: string;
    filename?: string;
    replyToMessageId?: string;
  }) => {
    const form = new FormData();
    form.set("conversationId", payload.conversationId);
    form.set("type", payload.type);
    form.set("file", payload.file);
    if (payload.caption) form.set("caption", payload.caption);
    if (payload.filename) form.set("filename", payload.filename);
    if (payload.replyToMessageId) form.set("replyToMessageId", payload.replyToMessageId);

    const token = getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("jesty-backend-service-token", SERVICE_TOKEN);

    const res = await fetch(`${API_URL}/messages/upload`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    });
    const body = (await res.json()) as ApiEnvelope<Message>;
    if (!res.ok) throw new ApiClientError(res.status, body.message ?? "Upload failed");
    return body.data;
  },

  search: (q: string) => request<Message[]>(`/messages/search?q=${encodeURIComponent(q)}`),
  forward: (messageId: string, conversationIds: string[]) =>
    request<unknown[]>(`/messages/${messageId}/forward`, {
      method: "POST",
      body: JSON.stringify({ conversationIds }),
    }),
  react: (messageId: string, emoji: string) =>
    request<null>(`/messages/${messageId}/react`, { method: "POST", body: JSON.stringify({ emoji }) }),
  unreact: (messageId: string) => request<null>(`/messages/${messageId}/react`, { method: "DELETE" }),
};

export const integrationsApi = {
  list: () => request<WhatsappIntegration[]>("/integrations/whatsapp"),
  connect: (payload: {
    label?: string;
    phoneNumber: string;
    phoneNumberId: string;
    wabaId: string;
    appId: string;
    appSecret?: string;
    accessToken: string;
    tokenType?: "temporary" | "permanent";
    isDefault?: boolean;
  }) => request<WhatsappIntegration>("/integrations/whatsapp", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<{ label: string; isActive: boolean; isDefault: boolean; accessToken: string; appSecret: string; tokenType: "temporary" | "permanent" }>) =>
    request<WhatsappIntegration>(`/integrations/whatsapp/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request<null>(`/integrations/whatsapp/${id}`, { method: "DELETE" }),
};

export const templatesApi = {
  list: (phoneNumberId?: string) => request<WhatsappTemplate[]>(`/templates${phoneNumberId ? `?phoneNumberId=${encodeURIComponent(phoneNumberId)}` : ""}`),
  create: (payload: Record<string, unknown>) => request<{ id: string; status: string }>('/templates', { method: 'POST', body: JSON.stringify(payload) }),
  aiDraft: (prompt: string, category: TemplateCategory) => request<WhatsappTemplate>('/templates/ai-draft', { method: 'POST', body: JSON.stringify({ prompt, category }) }),
  uploadHeader: async (file: File, phoneNumberId?: string) => {
    const form = new FormData(); form.set('file', file); if (phoneNumberId) form.set('phoneNumberId', phoneNumberId);
    const headers = new Headers(); const token = getAccessToken(); if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API_URL}/templates/header-media`, { method: 'POST', headers, body: form, credentials: 'include' });
    const body = await res.json() as ApiEnvelope<{ handle: string }>;
    if (!res.ok) throw new ApiClientError(res.status, body.message ?? 'Template media upload failed');
    return body.data;
  },
};

export const profileApi = {
  get: (phoneNumberId?: string) =>
    request<BusinessProfile>(`/profile${phoneNumberId ? `?phoneNumberId=${phoneNumberId}` : ""}`),
  update: (payload: Partial<BusinessProfile> & { phoneNumberId?: string }) =>
    request<BusinessProfile>("/profile", { method: "PATCH", body: JSON.stringify(payload) }),
  uploadPicture: async (file: File, phoneNumberId?: string) => {
    const form = new FormData();
    form.set("file", file);
    if (phoneNumberId) form.set("phoneNumberId", phoneNumberId);

    const token = getAccessToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("jesty-backend-service-token", SERVICE_TOKEN);

    const res = await fetch(`${API_URL}/profile/picture`, {
      method: "POST",
      headers,
      body: form,
      credentials: "include",
    });
    const body = (await res.json()) as ApiEnvelope<BusinessProfile>;
    if (!res.ok) throw new ApiClientError(res.status, body.message ?? "Upload failed");
    return body.data;
  },
};

export const contactsApi = {
  list: (params: { search?: string; tag?: string; group?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.tag) qs.set("tag", params.tag);
    if (params.group) qs.set("group", params.group);
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 20));
    return requestPaginated<ContactWithRelations>(`/contacts?${qs.toString()}`);
  },
  get: (id: string) => request<ContactWithRelations>(`/contacts/${id}`),
  create: (payload: {
    waId: string;
    name: string;
    phoneNumber: string;
    email?: string;
    avatarUrl?: string;
    notes?: string;
    tags?: string[];
    groups?: string[];
    attributes?: Record<string, string>;
  }) => request<Contact>("/contacts", { method: "POST", body: JSON.stringify(payload) }),
  update: (
    id: string,
    payload: Partial<{
      name: string;
      phoneNumber: string;
      email: string;
      avatarUrl: string;
      notes: string;
      tags: string[];
      groups: string[];
      attributes: Record<string, string>;
    }>
  ) => request<Contact>(`/contacts/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request<null>(`/contacts/${id}`, { method: "DELETE" }),
  // Backend expects an explicit { block } boolean — not a bare toggle.
  setBlocked: (id: string, block: boolean) =>
    request<Contact>(`/contacts/${id}/block`, { method: "POST", body: JSON.stringify({ block }) }),
};

export const groupsApi = {
  list: () => request<Group[]>("/groups"),
  get: (id: string) => request<Group>(`/groups/${id}`),
  create: (payload: { name: string; description?: string; contactIds?: string[] }) =>
    request<Group>("/groups", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<{ name: string; description: string; contactIds: string[] }>) =>
    request<Group>(`/groups/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request<null>(`/groups/${id}`, { method: "DELETE" }),
  updateMembers: (id: string, payload: { add?: string[]; remove?: string[] }) =>
    request<Group>(`/groups/${id}/members`, { method: "POST", body: JSON.stringify(payload) }),
};

export const tagsApi = {
  list: () => request<Tag[]>("/tags"),
  create: (payload: { name: string; color?: string }) =>
    request<Tag>("/tags", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<{ name: string; color: string }>) =>
    request<Tag>(`/tags/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request<null>(`/tags/${id}`, { method: "DELETE" }),
};

export const attributesApi = {
  list: () => request<AttributeDef[]>("/attributes"),
  create: (payload: { key: string; label: string; type: AttributeType; options?: string[] }) =>
    request<AttributeDef>("/attributes", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<{ key: string; label: string; type: AttributeType; options: string[] }>) =>
    request<AttributeDef>(`/attributes/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  remove: (id: string) => request<null>(`/attributes/${id}`, { method: "DELETE" }),
};

export const notificationsApi = {
  registerDeviceToken: (token: string, platform: "web" | "android" | "ios" = "web") =>
    request<null>("/notifications/device-token", { method: "POST", body: JSON.stringify({ token, platform }) }),
  unregisterDeviceToken: (token: string) =>
    request<null>("/notifications/device-token", { method: "DELETE", body: JSON.stringify({ token }) }),
};

export { ApiClientError };
