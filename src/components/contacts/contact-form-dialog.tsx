"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { contactsApi, ApiClientError } from "@/lib/api";
import type { Contact } from "@/types";

export function ContactFormDialog({ onCreated }: { onCreated: (contact: Contact) => void }) {
  const [open, setOpen] = useState(false);
  const [waId, setWaId] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!waId.trim() || !name.trim() || !phoneNumber.trim()) return;
    setSaving(true);
    try {
      const contact = await contactsApi.create({
        waId: waId.trim(),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
      });
      onCreated(contact);
      toast.success("Contact created");
      setOpen(false);
      setWaId("");
      setName("");
      setPhoneNumber("");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't create the contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> New contact
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Sharma" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Phone number</Label>
            <Input id="contact-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-waid">WhatsApp ID</Label>
            <Input id="contact-waid" value={waId} onChange={(e) => setWaId(e.target.value)} placeholder="919876543210" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving || !waId.trim() || !name.trim() || !phoneNumber.trim()} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
