"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Groups management moved onto the Contacts page (Contacts / Tags / Groups
// tabs) so tags and groups live in one place instead of being split across
// separate nav destinations. This route stays as a redirect so old links
// and bookmarks keep working.
export default function GroupsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/contacts?tab=groups");
  }, [router]);
  return null;
}