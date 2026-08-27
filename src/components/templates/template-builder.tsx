"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { toast } from "@/components/ui/jesty-toast";
import { templatesApi } from "@/lib/api";
import type {
  TemplateCategory,
  WhatsappIntegration,
  WhatsappTemplate,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

/**
 * ---------------------------------------------------------------------------
 * Template Builder — creates/edits a WhatsApp Message Template.
 *
 * This mirrors the validation rules enforced server-side in
 * template.controller.ts (which itself follows Meta's official Message
 * Templates API), so a template that looks valid here should not bounce
 * back with a 400 from the backend. See Meta's Message Templates docs:
 * https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
 * ---------------------------------------------------------------------------
 */

type HeaderFormat =
  | "NONE"
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "DOCUMENT"
  | "LOCATION";
type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE" | "FLOW";
type OtpType = "COPY_CODE" | "ONE_TAP" | "ZERO_TAP";

interface ButtonState {
  key: string;
  type: ButtonType;
  text: string; // not used by COPY_CODE
  url?: string; // URL only
  urlExample?: string; // URL only, when url contains {{1}}
  phone?: string; // PHONE_NUMBER only
  copyCodeExample?: string; // COPY_CODE only
  flowId?: string; // FLOW only
}

const BUTTON_LABELS: Record<ButtonType, string> = {
  QUICK_REPLY: "Quick reply",
  URL: "Website URL",
  PHONE_NUMBER: "Call phone number",
  COPY_CODE: "Copy offer code",
  FLOW: "Flow",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Finds {{1}}/{{name}} tokens in a string — mirrors the backend's extractVariables. */
function extractVariables(text: string): {
  positional: number[];
  named: string[];
} {
  const positional = new Set<number>();
  const named = new Set<string>();
  const re = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const token = m[1];
    if (token === undefined) continue;

    if (/^\d+$/.test(token)) {
      positional.add(Number(token));
    } else {
      named.add(token);
    }
  }
  return {
    positional: [...positional].sort((a, b) => a - b),
    named: [...named],
  };
}

type Comp = Record<string, unknown>;

export function TemplateBuilder({
  numbers,
  initialDraft,
}: {
  numbers: WhatsappIntegration[];
  initialDraft?: WhatsappTemplate;
}) {
  const router = useRouter();

  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<TemplateCategory>("UTILITY");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [phone, setPhone] = useState(
    numbers.find((n) => n.isDefault)?.whatsapp?.phoneNumberId ||
      numbers[0]?.whatsapp?.phoneNumberId ||
      "",
  );

  // ---- Header ----
  const [headerFormat, setHeaderFormat] = useState<HeaderFormat>("NONE");
  const [headerText, setHeaderText] = useState("");
  const [headerTextExample, setHeaderTextExample] = useState("");
  const [headerHandle, setHeaderHandle] = useState("");
  const [headerFileName, setHeaderFileName] = useState("");
  const [uploadingHeader, setUploadingHeader] = useState(false);

  // ---- Body ----
  const [bodyText, setBodyText] = useState("");
  const [bodyPositionalExamples, setBodyPositionalExamples] = useState<
    Record<number, string>
  >({});
  const [bodyNamedExamples, setBodyNamedExamples] = useState<
    Record<string, string>
  >({});

  // ---- Footer ----
  const [footerText, setFooterText] = useState("");

  // ---- Buttons (MARKETING / UTILITY) ----
  const [buttons, setButtons] = useState<ButtonState[]>([]);

  // ---- Authentication-only ----
  const [otpType, setOtpType] = useState<OtpType>("COPY_CODE");
  const [copyCodeButtonText, setCopyCodeButtonText] = useState("");
  const [packageName, setPackageName] = useState("");
  const [signatureHash, setSignatureHash] = useState("");
  const [addSecurityRecommendation, setAddSecurityRecommendation] =
    useState(true);
  const [codeExpirationMinutes, setCodeExpirationMinutes] =
    useState<string>("");

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bodyVars = useMemo(() => extractVariables(bodyText), [bodyText]);
  const headerVars = useMemo(() => extractVariables(headerText), [headerText]);
  const parameterFormat: "named" | "positional" | undefined =
    bodyVars.named.length > 0
      ? "named"
      : bodyVars.positional.length > 0
        ? "positional"
        : undefined;

  // -------------------------------------------------------------------------
  // Load an existing draft into the form (this was previously a no-op — the
  // `initialDraft` prop was accepted but never read, so editing a draft via
  // /templates/create?draft=ID silently opened a blank form).
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!initialDraft) return;
    setDraftId(initialDraft.id);
    setCategory(initialDraft.category);
    setName(initialDraft.name ?? "");
    setLanguage(initialDraft.language ?? "en_US");

    const comps = (initialDraft.components ?? []) as Comp[];
    const typeOf = (c: Comp) => String(c.type ?? "").toUpperCase();

    const header = comps.find((c) => typeOf(c) === "HEADER");
    if (header) {
      const format = String(
        header.format ?? "TEXT",
      ).toUpperCase() as HeaderFormat;
      setHeaderFormat(format);
      if (format === "TEXT") {
        setHeaderText(String(header.text ?? ""));
        const ex = (header.example as { header_text?: string[] } | undefined)
          ?.header_text;
        if (ex?.[0]) setHeaderTextExample(ex[0]);
      } else if (
        format === "IMAGE" ||
        format === "VIDEO" ||
        format === "DOCUMENT"
      ) {
        const ex = (header.example as { header_handle?: string[] } | undefined)
          ?.header_handle;
        if (ex?.[0]) setHeaderHandle(ex[0]);
      }
    } else {
      setHeaderFormat("NONE");
    }

    const body = comps.find((c) => typeOf(c) === "BODY");
    if (body) {
      setBodyText(String(body.text ?? ""));
      const namedEx = (
        body.example as
          | {
              body_text_named_params?: {
                param_name: string;
                example: string;
              }[];
            }
          | undefined
      )?.body_text_named_params;
      if (namedEx?.length) {
        setBodyNamedExamples(
          Object.fromEntries(namedEx.map((p) => [p.param_name, p.example])),
        );
      }
      const posEx = (body.example as { body_text?: string[][] } | undefined)
        ?.body_text?.[0];
      if (posEx?.length) {
        setBodyPositionalExamples(
          Object.fromEntries(posEx.map((v, i) => [i + 1, v])),
        );
      }
    }

    const footer = comps.find((c) => typeOf(c) === "FOOTER");
    if (footer) {
      setFooterText(String(footer.text ?? ""));
      const mins = footer.code_expiration_minutes;
      if (typeof mins === "number") setCodeExpirationMinutes(String(mins));
    }

    const buttonsComp = comps.find((c) => typeOf(c) === "BUTTONS") as
      | { buttons?: Comp[] }
      | undefined;
    const rawButtons = buttonsComp?.buttons ?? [];
    if (initialDraft.category === "AUTHENTICATION") {
      const otp = rawButtons[0];
      if (otp) {
        setOtpType((otp.otp_type as OtpType) ?? "COPY_CODE");
        if (typeof otp.copy_code_button_text === "string")
          setCopyCodeButtonText(otp.copy_code_button_text);
        if (typeof otp.package_name === "string")
          setPackageName(otp.package_name);
        if (typeof otp.signature_hash === "string")
          setSignatureHash(otp.signature_hash);
      }
      if (typeof body?.add_security_recommendation === "boolean") {
        setAddSecurityRecommendation(body.add_security_recommendation);
      }
    } else {
      setButtons(
        rawButtons.map((b) => ({
          key: uid(),
          type: String(b.type).toUpperCase() as ButtonType,
          text: String(b.text ?? ""),
          url: typeof b.url === "string" ? b.url : undefined,
          urlExample: Array.isArray(b.example)
            ? String(b.example[0] ?? "")
            : undefined,
          phone:
            typeof b.phone_number === "string" ? b.phone_number : undefined,
          copyCodeExample:
            typeof b.example === "string" ? b.example : undefined,
          flowId: typeof b.flow_id === "string" ? b.flow_id : undefined,
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDraft]);

  // -------------------------------------------------------------------------
  // Button list helpers — buttons are capped and grouped per Meta's rules:
  // max 10 total, max 1 PHONE_NUMBER, max 2 URL, max 1 FLOW, max 1 COPY_CODE.
  // -------------------------------------------------------------------------
  const buttonCounts = useMemo(() => {
    const counts: Record<ButtonType, number> = {
      QUICK_REPLY: 0,
      URL: 0,
      PHONE_NUMBER: 0,
      COPY_CODE: 0,
      FLOW: 0,
    };
    for (const b of buttons) counts[b.type]++;
    return counts;
  }, [buttons]);

  const canAddButtonType: Record<ButtonType, boolean> = {
    QUICK_REPLY: buttons.length < 10,
    URL: buttons.length < 10 && buttonCounts.URL < 2,
    PHONE_NUMBER: buttons.length < 10 && buttonCounts.PHONE_NUMBER < 1,
    COPY_CODE: buttons.length < 10 && buttonCounts.COPY_CODE < 1,
    FLOW: buttons.length < 10 && buttonCounts.FLOW < 1,
  };

  function addButton(type: ButtonType) {
    setButtons((prev) => [...prev, { key: uid(), type, text: "" }]);
  }
  function updateButton(key: string, patch: Partial<ButtonState>) {
    setButtons((prev) =>
      prev.map((b) => (b.key === key ? { ...b, ...patch } : b)),
    );
  }
  function removeButton(key: string) {
    setButtons((prev) => prev.filter((b) => b.key !== key));
  }

  // -------------------------------------------------------------------------
  // Header media upload — Meta needs a resumable-upload "handle" (obtained
  // via POST /api/templates/header-media), which is a DIFFERENT id than a
  // regular WhatsApp media id used for sending live messages.
  // -------------------------------------------------------------------------
  async function onHeaderFileChosen(file: File | undefined) {
    if (!file) return;
    setHeaderFileName(file.name);
    setHeaderHandle("");
    setUploadingHeader(true);
    try {
      const { handle } = await templatesApi.uploadHeader(
        file,
        phone || undefined,
      );
      setHeaderHandle(handle);
      toast.success("Header media uploaded");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Header media upload failed",
      );
      setHeaderFileName("");
    } finally {
      setUploadingHeader(false);
    }
  }

  // -------------------------------------------------------------------------
  // Build the Meta-shaped `components` array from form state.
  // -------------------------------------------------------------------------
  function buildComponents(): Comp[] {
    const result: Comp[] = [];

    if (category === "AUTHENTICATION") {
      const body: Comp = {
        type: "BODY",
        ...(addSecurityRecommendation !== undefined
          ? { add_security_recommendation: addSecurityRecommendation }
          : {}),
      };
      result.push(body);

      if (footerText.trim() || codeExpirationMinutes) {
        const footer: Comp = { type: "FOOTER" };
        const mins = Number(codeExpirationMinutes);
        if (codeExpirationMinutes && !Number.isNaN(mins))
          footer.code_expiration_minutes = mins;
        result.push(footer);
      }

      const otp: Comp = { type: "OTP", otp_type: otpType };
      if (otpType === "COPY_CODE" && copyCodeButtonText.trim())
        otp.copy_code_button_text = copyCodeButtonText.trim();
      if (otpType === "ONE_TAP" || otpType === "ZERO_TAP") {
        otp.package_name = packageName.trim();
        otp.signature_hash = signatureHash.trim();
      }
      result.push({ type: "BUTTONS", buttons: [otp] });
      return result;
    }

    if (headerFormat !== "NONE") {
      const header: Comp = { type: "HEADER", format: headerFormat };
      if (headerFormat === "TEXT") {
        header.text = headerText;
        if (headerVars.positional.length > 0 && headerTextExample.trim()) {
          header.example = { header_text: [headerTextExample.trim()] };
        }
      } else if (headerFormat !== "LOCATION" && headerHandle) {
        header.example = { header_handle: [headerHandle] };
      }
      result.push(header);
    }

    const body: Comp = { type: "BODY", text: bodyText };
    if (parameterFormat === "named" && bodyVars.named.length > 0) {
      body.example = {
        body_text_named_params: bodyVars.named.map((n) => ({
          param_name: n,
          example: bodyNamedExamples[n] ?? "",
        })),
      };
    } else if (
      parameterFormat === "positional" &&
      bodyVars.positional.length > 0
    ) {
      body.example = {
        body_text: [
          bodyVars.positional.map((n) => bodyPositionalExamples[n] ?? ""),
        ],
      };
    }
    result.push(body);

    if (footerText.trim())
      result.push({ type: "FOOTER", text: footerText.trim() });

    if (buttons.length > 0) {
      // Sorted by type so same-type buttons are always grouped together,
      // regardless of the order they were added in — Meta rejects
      // interleaved button types (e.g. URL, QUICK_REPLY, URL).
      const order: ButtonType[] = [
        "QUICK_REPLY",
        "URL",
        "PHONE_NUMBER",
        "FLOW",
        "COPY_CODE",
      ];
      const sorted = [...buttons].sort(
        (a, b) => order.indexOf(a.type) - order.indexOf(b.type),
      );
      const built = sorted.map((b): Comp => {
        switch (b.type) {
          case "URL": {
            const btn: Comp = { type: "URL", text: b.text, url: b.url ?? "" };
            if (/{{\s*1\s*}}/.test(b.url ?? "") && b.urlExample?.trim())
              btn.example = [b.urlExample.trim()];
            return btn;
          }
          case "PHONE_NUMBER":
            return {
              type: "PHONE_NUMBER",
              text: b.text,
              phone_number: b.phone ?? "",
            };
          case "COPY_CODE":
            return { type: "COPY_CODE", example: b.copyCodeExample ?? "" };
          case "FLOW":
            return { type: "FLOW", text: b.text, flow_id: b.flowId ?? "" };
          default:
            return { type: "QUICK_REPLY", text: b.text };
        }
      });
      result.push({ type: "BUTTONS", buttons: built });
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Client-side validation — mirrors the backend's rules so the person gets
  // instant feedback instead of a round trip just to learn a 400 happened.
  // The backend is still the source of truth; this only improves UX.
  // -------------------------------------------------------------------------
  function validate(): string[] {
    const errors: string[] = [];
    if (!name.trim()) errors.push("Template name is required");
    else if (!/^[a-z0-9_]{1,512}$/.test(name))
      errors.push(
        "Name must be lowercase letters, numbers, and underscores only",
      );
    if (!/^[a-z]{2,3}(_[A-Z]{2})?$/.test(language))
      errors.push("Language must look like en, en_US, or pt_BR");
    if (!phone) errors.push("Choose a connected WhatsApp number");

    if (category === "AUTHENTICATION") {
      if (otpType === "ONE_TAP" || otpType === "ZERO_TAP") {
        if (!packageName.trim())
          errors.push("Package name is required for one-tap/zero-tap autofill");
        if (!signatureHash.trim())
          errors.push(
            "Signature hash is required for one-tap/zero-tap autofill",
          );
      }
      if (codeExpirationMinutes) {
        const mins = Number(codeExpirationMinutes);
        if (Number.isNaN(mins) || mins < 1 || mins > 90)
          errors.push("Code expiration must be between 1 and 90 minutes");
      }
      return errors;
    }

    if (!bodyText.trim()) errors.push("Body text is required");
    if (bodyText.length > 1024)
      errors.push("Body text must be 1024 characters or fewer");
    if (bodyVars.named.length > 0 && bodyVars.positional.length > 0) {
      errors.push(
        "Body text mixes named ({{name}}) and numbered ({{1}}) variables — use only one style",
      );
    }
    if (bodyVars.positional.some((n, i) => n !== i + 1)) {
      errors.push(
        "Numbered variables must start at {{1}} and be sequential with no gaps",
      );
    }
    for (const n of bodyVars.positional) {
      if (!bodyPositionalExamples[n]?.trim())
        errors.push(`Add a sample value for {{${n}}} in the body`);
    }
    for (const n of bodyVars.named) {
      if (!bodyNamedExamples[n]?.trim())
        errors.push(`Add a sample value for {{${n}}} in the body`);
    }

    if (headerFormat === "TEXT") {
      if (!headerText.trim())
        errors.push("Header text is required when a TEXT header is selected");
      if (headerText.length > 60)
        errors.push("Header text must be 60 characters or fewer");
      if (headerVars.positional.length > 1 || headerVars.named.length > 0) {
        errors.push("Header text supports only a single {{1}} variable");
      }
      if (headerVars.positional.length === 1 && !headerTextExample.trim()) {
        errors.push("Add a sample value for the header's {{1}} variable");
      }
    } else if (
      headerFormat === "IMAGE" ||
      headerFormat === "VIDEO" ||
      headerFormat === "DOCUMENT"
    ) {
      if (!headerHandle)
        errors.push(
          `Upload a ${headerFormat.toLowerCase()} for the header before saving`,
        );
    }

    if (footerText.length > 60)
      errors.push("Footer text must be 60 characters or fewer");
    if (/{{\s*[a-zA-Z0-9_]+\s*}}/.test(footerText))
      errors.push("Footer text cannot contain variables");

    for (const b of buttons) {
      if (b.type !== "COPY_CODE" && (!b.text.trim() || b.text.length > 25)) {
        errors.push(
          `${BUTTON_LABELS[b.type]} button needs label text (max 25 characters)`,
        );
      }
      if (b.type === "URL") {
        if (!b.url || !/^https:\/\/.+/.test(b.url))
          errors.push("URL button requires a full https:// link");
        if (/{{\s*1\s*}}/.test(b.url ?? "") && !b.urlExample?.trim())
          errors.push("Add a sample value for the dynamic URL button");
      }
      if (
        b.type === "PHONE_NUMBER" &&
        (!b.phone?.trim() || b.phone.length > 20)
      ) {
        errors.push("Phone button needs a phone number (max 20 characters)");
      }
      if (
        b.type === "COPY_CODE" &&
        (!b.copyCodeExample?.trim() || b.copyCodeExample.length > 15)
      ) {
        errors.push("Copy-code button needs a sample code (max 15 characters)");
      }
      if (b.type === "FLOW" && !b.flowId?.trim())
        errors.push("Flow button needs a Flow ID");
    }

    return errors;
  }

  async function handleSaveDraft() {
    if (!name.trim())
      return toast.error("Give the template a name before saving a draft");
    setSaving(true);
    try {
      const payload = {
        id: draftId,
        phoneNumberId: phone || undefined,
        name,
        language,
        category,
        parameter_format: parameterFormat,
        components: buildComponents(),
      };
      const saved = await templatesApi.saveDraft(payload);
      setDraftId(saved.id);
      toast.success("Draft saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save draft");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    const errors = validate();
    if (errors.length > 0) {
      toast.error(
        errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more)` : ""),
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        phoneNumberId: phone || undefined,
        name,
        language,
        category,
        parameter_format: parameterFormat,
        components: buildComponents(),
      };
      await templatesApi.create(payload);
      toast.success("Template submitted to Meta for review");
      if (draftId)
        await templatesApi.deleteDraft(draftId).catch(() => undefined);
      router.push("/templates");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Meta rejected this template",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5 border border-border bg-card p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Connected number</Label>
            <Select value={phone} onValueChange={setPhone}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a number" />
              </SelectTrigger>
              <SelectContent>
                {numbers.map((n) => (
                  <SelectItem
                    key={n.id}
                    value={n.whatsapp?.phoneNumberId || n.id}
                  >
                    {n.label || n.whatsapp?.phoneNumber || "WhatsApp number"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as TemplateCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="UTILITY">Utility</SelectItem>
                <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                )
              }
              placeholder="order_shipped"
            />
          </div>
          <div>
            <Label>Language</Label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="en_US"
            />
          </div>
        </div>

        {category === "AUTHENTICATION" ? (
          <div className="space-y-4 border border-border p-4">
            <p className="text-sm text-muted-foreground">
              Meta writes the body and footer copy for authentication templates
              automatically — you only configure the one-time-password button
              below.
            </p>
            <div>
              <Label>OTP delivery method</Label>
              <Select
                value={otpType}
                onValueChange={(v) => setOtpType(v as OtpType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COPY_CODE">Copy code</SelectItem>
                  <SelectItem value="ONE_TAP">
                    One-tap autofill (Android)
                  </SelectItem>
                  <SelectItem value="ZERO_TAP">
                    Zero-tap autofill (Android)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {otpType === "COPY_CODE" ? (
              <div>
                <Label>Button text (optional)</Label>
                <Input
                  value={copyCodeButtonText}
                  onChange={(e) => setCopyCodeButtonText(e.target.value)}
                  placeholder="Copy code"
                  maxLength={25}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Android package name</Label>
                  <Input
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="com.your.app"
                  />
                </div>
                <div>
                  <Label>APK signature hash</Label>
                  <Input
                    value={signatureHash}
                    onChange={(e) => setSignatureHash(e.target.value)}
                    placeholder="e.g. from apksigner"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="add-security-recommendation"
                checked={addSecurityRecommendation}
                onCheckedChange={(v) =>
                  setAddSecurityRecommendation(v === true)
                }
              />
              <Label
                htmlFor="add-security-recommendation"
                className="cursor-pointer"
              >
                Add "don't share this code" security line
              </Label>
            </div>
            <div>
              <Label>Code expiration (minutes, optional)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={codeExpirationMinutes}
                onChange={(e) => setCodeExpirationMinutes(e.target.value)}
                placeholder="Meta default: 10"
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <Label>Header</Label>
              <Select
                value={headerFormat}
                onValueChange={(v) => setHeaderFormat(v as HeaderFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "NONE",
                      "TEXT",
                      "IMAGE",
                      "VIDEO",
                      "DOCUMENT",
                      "LOCATION",
                    ] as HeaderFormat[]
                  ).map((x) => (
                    <SelectItem key={x} value={x}>
                      {x === "NONE" ? "No header" : x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {headerFormat === "TEXT" && (
                <div className="mt-2 space-y-2">
                  <Input
                    value={headerText}
                    onChange={(e) => setHeaderText(e.target.value)}
                    placeholder="Order confirmed{{1}}"
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {headerText.length}/60 · at most one {"{{1}}"} variable
                  </p>
                  {headerVars.positional.length === 1 && (
                    <Input
                      value={headerTextExample}
                      onChange={(e) => setHeaderTextExample(e.target.value)}
                      placeholder="Sample value for {{1}}"
                    />
                  )}
                </div>
              )}

              {(headerFormat === "IMAGE" ||
                headerFormat === "VIDEO" ||
                headerFormat === "DOCUMENT") && (
                <div className="mt-2 space-y-2">
                  <label className="flex cursor-pointer items-center gap-2 border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-brand hover:text-foreground">
                    <Upload className="h-4 w-4" />
                    {headerFileName ||
                      `Upload a ${headerFormat.toLowerCase()} sample for review`}
                    <input
                      type="file"
                      className="hidden"
                      accept={
                        headerFormat === "IMAGE"
                          ? "image/*"
                          : headerFormat === "VIDEO"
                            ? "video/*"
                            : undefined
                      }
                      onChange={(e) =>
                        void onHeaderFileChosen(e.target.files?.[0])
                      }
                    />
                  </label>
                  {uploadingHeader && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Uploading to
                      Meta…
                    </p>
                  )}
                  {headerHandle && !uploadingHeader && (
                    <p className="text-xs text-online-dot">
                      Media ready — this exact file is used for Meta's review.
                    </p>
                  )}
                </div>
              )}

              {headerFormat === "LOCATION" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  The actual location is sent per-message when this template is
                  used — no text needed here.
                </p>
              )}
            </div>

            <div>
              <Label>Body</Label>
              <Textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Hi {{1}}, your order {{2}} is confirmed."
                maxLength={1024}
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {bodyText.length}/1024
              </p>

              {(bodyVars.positional.length > 0 ||
                bodyVars.named.length > 0) && (
                <div className="mt-2 space-y-2 border border-border p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sample values for Meta&apos;s reviewers
                  </p>
                  {bodyVars.named.length > 0 &&
                    bodyVars.positional.length > 0 && (
                      <p className="text-xs text-destructive">
                        Don&apos;t mix {"{{name}}"} and {"{{1}}"} style
                        variables in the same body.
                      </p>
                    )}
                  {bodyVars.positional.map((n) => (
                    <Input
                      key={n}
                      value={bodyPositionalExamples[n] ?? ""}
                      onChange={(e) =>
                        setBodyPositionalExamples((prev) => ({
                          ...prev,
                          [n]: e.target.value,
                        }))
                      }
                      placeholder={`Sample for {{${n}}}`}
                    />
                  ))}
                  {bodyVars.named.map((n) => (
                    <Input
                      key={n}
                      value={bodyNamedExamples[n] ?? ""}
                      onChange={(e) =>
                        setBodyNamedExamples((prev) => ({
                          ...prev,
                          [n]: e.target.value,
                        }))
                      }
                      placeholder={`Sample for {{${n}}}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Footer</Label>
              <Input
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                maxLength={60}
                placeholder="Optional"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {footerText.length}/60 · no variables allowed
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Buttons</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={buttons.length >= 10}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add button
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {(Object.keys(BUTTON_LABELS) as ButtonType[]).map(
                      (type) => (
                        <DropdownMenuItem
                          key={type}
                          disabled={!canAddButtonType[type]}
                          onClick={() => addButton(type)}
                        >
                          {BUTTON_LABELS[type]}
                        </DropdownMenuItem>
                      ),
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {buttons.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No buttons — up to 10 allowed, mixed types grouped
                  automatically.
                </p>
              ) : (
                <div className="space-y-2">
                  {buttons.map((b) => (
                    <div
                      key={b.key}
                      className="flex flex-wrap items-center gap-2 border border-border p-2"
                    >
                      <Badge variant="secondary">{BUTTON_LABELS[b.type]}</Badge>
                      {b.type !== "COPY_CODE" && (
                        <Input
                          className="w-40"
                          value={b.text}
                          onChange={(e) =>
                            updateButton(b.key, { text: e.target.value })
                          }
                          placeholder="Button label"
                          maxLength={25}
                        />
                      )}
                      {b.type === "URL" && (
                        <>
                          <Input
                            className="w-56"
                            value={b.url ?? ""}
                            onChange={(e) =>
                              updateButton(b.key, { url: e.target.value })
                            }
                            placeholder="https://example.com/{{1}}"
                          />
                          {/{{\s*1\s*}}/.test(b.url ?? "") && (
                            <Input
                              className="w-40"
                              value={b.urlExample ?? ""}
                              onChange={(e) =>
                                updateButton(b.key, {
                                  urlExample: e.target.value,
                                })
                              }
                              placeholder="Sample suffix"
                            />
                          )}
                        </>
                      )}
                      {b.type === "PHONE_NUMBER" && (
                        <Input
                          className="w-40"
                          value={b.phone ?? ""}
                          onChange={(e) =>
                            updateButton(b.key, { phone: e.target.value })
                          }
                          placeholder="+14155551234"
                          maxLength={20}
                        />
                      )}
                      {b.type === "COPY_CODE" && (
                        <Input
                          className="w-40"
                          value={b.copyCodeExample ?? ""}
                          onChange={(e) =>
                            updateButton(b.key, {
                              copyCodeExample: e.target.value,
                            })
                          }
                          placeholder="Sample code"
                          maxLength={15}
                        />
                      )}
                      {b.type === "FLOW" && (
                        <Input
                          className="w-48"
                          value={b.flowId ?? ""}
                          onChange={(e) =>
                            updateButton(b.key, { flowId: e.target.value })
                          }
                          placeholder="Flow ID"
                        />
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto"
                        onClick={() => removeButton(b.key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <aside className="h-fit space-y-4 border border-border bg-card p-6">
        <div>
          <p className="font-medium">Preview</p>
          <div className="mt-3 border border-border bg-bg-chat p-4">
            <div className="ml-auto max-w-[280px] space-y-1 border border-border bg-bubble-in p-3 text-sm text-text-primary">
              {category === "AUTHENTICATION" ? (
                <>
                  <p>*000000* is your verification code.</p>
                  {addSecurityRecommendation && (
                    <p className="text-xs text-muted-foreground">
                      For your security, do not share this code.
                    </p>
                  )}
                  {codeExpirationMinutes && (
                    <p className="text-xs text-muted-foreground">
                      This code expires in {codeExpirationMinutes} minutes.
                    </p>
                  )}
                  <div className="mt-2 border-t border-border pt-2 text-center text-xs font-medium text-brand-strong">
                    {otpType === "COPY_CODE"
                      ? copyCodeButtonText || "Copy code"
                      : "Autofill"}
                  </div>
                </>
              ) : (
                <>
                  {headerFormat === "TEXT" && headerText && (
                    <p className="font-semibold">{headerText}</p>
                  )}
                  {(headerFormat === "IMAGE" ||
                    headerFormat === "VIDEO" ||
                    headerFormat === "DOCUMENT") && (
                    <div className="flex h-24 items-center justify-center border border-dashed border-border text-xs text-muted-foreground">
                      {headerFormat} header
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">
                    {bodyText || "Your message body will appear here."}
                  </p>
                  {footerText && (
                    <p className="text-xs text-muted-foreground">
                      {footerText}
                    </p>
                  )}
                  {buttons.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-border pt-2">
                      {buttons.map((b) => (
                        <div
                          key={b.key}
                          className="text-center text-xs font-medium text-brand-strong"
                        >
                          {b.type === "COPY_CODE"
                            ? "Copy offer code"
                            : b.text || BUTTON_LABELS[b.type]}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="font-medium">Template actions</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Save a server-side draft, then submit it to Meta when ready.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save draft
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </aside>
    </section>
  );
}
