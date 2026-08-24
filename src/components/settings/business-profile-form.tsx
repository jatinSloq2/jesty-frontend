"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileApi, ApiClientError } from "@/lib/api";
import type { BusinessProfile } from "@/types";
import { initials } from "@/lib/utils";

export function BusinessProfileForm({ phoneNumberId }: { phoneNumberId?: string }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    profileApi
      .get(phoneNumberId)
      .then(setProfile)
      .catch(() => setProfile({}))
      .finally(() => setLoading(false));
  }, [phoneNumberId]);

  const update = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) =>
    setProfile((p) => ({ ...(p ?? {}), [key]: value }));

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await profileApi.update({ ...profile, phoneNumberId });
      setProfile(updated);
      toast.success("Business profile updated");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Couldn't save the profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadPicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingPic(true);
    try {
      const updated = await profileApi.uploadPicture(file, phoneNumberId);
      setProfile(updated);
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Upload failed");
    } finally {
      setUploadingPic(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const websites = profile?.websites ?? ["", ""];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button className="group relative" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-20 w-20 border border-border">
            <AvatarImage src={profile?.profile_picture_url} alt="Business profile" />
            <AvatarFallback className="text-lg">{initials(profile?.email ?? "B")}</AvatarFallback>
          </Avatar>
          <span className="pill-circle absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center bg-brand text-brand-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {uploadingPic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </span>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadPicture} />
        <div>
          <p className="text-sm font-medium">Profile picture</p>
          <p className="text-xs text-muted-foreground">Click the avatar to change it.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="about">About</Label>
          <Input id="about" maxLength={139} value={profile?.about ?? ""} onChange={(e) => update("about", e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            maxLength={512}
            value={profile?.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={profile?.address ?? ""} onChange={(e) => update("address", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={profile?.email ?? ""} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website-1">Website 1</Label>
          <Input
            id="website-1"
            value={websites[0] ?? ""}
            onChange={(e) => update("websites", [e.target.value, websites[1] ?? ""])}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="website-2">Website 2</Label>
          <Input
            id="website-2"
            value={websites[1] ?? ""}
            onChange={(e) => update("websites", [websites[0] ?? "", e.target.value])}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vertical">Category</Label>
          <Input id="vertical" value={profile?.vertical ?? ""} onChange={(e) => update("vertical", e.target.value)} />
        </div>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </Button>
    </div>
  );
}
