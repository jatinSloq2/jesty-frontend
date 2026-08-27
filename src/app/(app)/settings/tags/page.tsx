"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Tag management moved onto the Contacts page (Contacts / Tags / Groups
// tabs) instead of Settings, so it lives next to the contacts it labels.
// Redirect kept for old links/bookmarks.
export default function TagsSettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contacts?tab=tags");
  }, [router]);
  return null;
}