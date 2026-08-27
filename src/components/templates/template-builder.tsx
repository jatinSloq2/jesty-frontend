"use client";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  numbers: WhatsappIntegration[];
  initialDraft?: WhatsappTemplate;
};
export function TemplateBuilder({ numbers, initialDraft }: Props) {
  const [category, setCategory] = useState<TemplateCategory>("UTILITY");
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en_US");
  const [body, setBody] = useState("");
  const [header, setHeader] = useState("NONE");
  const [footer, setFooter] = useState("");
  const [buttonType, setButtonType] = useState("NONE");
  const [buttonText, setButtonText] = useState("");
  const [buttonValue, setButtonValue] = useState("");
  const [phone, setPhone] = useState(
    numbers.find((n) => n.isDefault)?.whatsapp?.phoneNumberId ||
      numbers[0]?.whatsapp?.phoneNumberId ||
      "",
  );
  const [saving, setSaving] = useState(false);
  const components = () => {
    const result: any[] = [];
    if (header !== "NONE")
      result.push({
        type: "HEADER",
        format: header,
        ...(header === "TEXT" ? { text: "Header" } : {}),
      });
    result.push({ type: "BODY", text: body });
    if (footer) result.push({ type: "FOOTER", text: footer });
    if (buttonType !== "NONE")
      result.push({
        type: "BUTTONS",
        buttons: [
          {
            type: buttonType,
            text: buttonText,
            ...(buttonType === "URL"
              ? { url: buttonValue }
              : buttonType === "PHONE_NUMBER"
                ? { phone_number: buttonValue }
                : {}),
          },
        ],
      });
    return result;
  };
  const save = async (submit: boolean) => {
    if (!name.trim() || !body.trim())
      return toast.error("Template name and body are required");
    setSaving(true);
    try {
      const payload = {
        phoneNumberId: phone,
        name,
        language,
        category,
        parameter_format: "positional",
        components: components(),
      };
      if (submit) {
        await templatesApi.create(payload);
        toast.success("Template submitted to Meta");
      } else {
        await templatesApi.saveDraft(payload);
        toast.success("Draft saved");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5 rounded-xl border border-border bg-bg-panel p-6">
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
            />
          </div>
          <div>
            <Label>Language</Label>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            />
          </div>
        </div>
        {category === "AUTHENTICATION" ? (
          <div className="rounded-lg border border-amber-300 p-4 text-sm">
            Authentication templates use Meta&apos;s OTP body, expiration
            footer, and OTP button payload. Use the authentication controls in
            the dedicated auth flow.
          </div>
        ) : (
          <>
            <div>
              <Label>Header</Label>
              <Select value={header} onValueChange={setHeader}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "NONE",
                    "TEXT",
                    "IMAGE",
                    "VIDEO",
                    "DOCUMENT",
                    "LOCATION",
                  ].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Your order {{1}} is confirmed."
              />
            </div>
            <div>
              <Label>Footer</Label>
              <Input
                value={footer}
                onChange={(e) => setFooter(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label>Button</Label>
                <Select value={buttonType} onValueChange={setButtonType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No button</SelectItem>
                    <SelectItem value="QUICK_REPLY">Quick reply</SelectItem>
                    <SelectItem value="URL">Website URL</SelectItem>
                    <SelectItem value="PHONE_NUMBER">Phone number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {buttonType !== "NONE" && (
                <>
                  <div>
                    <Label>Label</Label>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                    />
                  </div>
                  {buttonType !== "QUICK_REPLY" && (
                    <div>
                      <Label>{buttonType === "URL" ? "URL" : "Phone"}</Label>
                      <Input
                        value={buttonValue}
                        onChange={(e) => setButtonValue(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      <aside className="h-fit rounded-xl border border-border bg-bg-panel p-6">
        <p className="font-medium">Template actions</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Save a server-side draft, then submit it to Meta when ready.
        </p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => save(false)}
            disabled={saving}
          >
            Save draft
          </Button>
          <Button
            className="flex-1"
            onClick={() => save(true)}
            disabled={saving}
          >
            Submit
          </Button>
        </div>
      </aside>
    </section>
  );
}
