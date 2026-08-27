"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ContactWithRelations } from "@/types";
import { initials } from "@/lib/utils";

export function ContactsTable({
  contacts,
  onSelect,
}: {
  contacts: ContactWithRelations[];
  onSelect: (contact: ContactWithRelations) => void;
}) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead className="sticky top-0 z-10 bg-bg-app">
        <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <th className="px-4 py-2.5 font-semibold">Contact</th>
          <th className="px-4 py-2.5 font-semibold">Tags</th>
          <th className="px-4 py-2.5 font-semibold">Groups</th>
          <th className="px-4 py-2.5 font-semibold">Attributes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {contacts.map((contact) => {
          const attributeEntries = Object.entries(contact.attributes ?? {});
          return (
            <tr
              key={contact._id}
              data-contact-row
              onClick={() => onSelect(contact)}
              className="cursor-pointer bg-card transition-colors hover:bg-accent"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={contact.avatarUrl} alt={contact.name} />
                    <AvatarFallback>{initials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{contact.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{contact.phoneNumber}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {contact.tags.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag) => (
                      <span key={tag._id} className="flex items-center gap-1 border border-border px-2 py-0.5 text-xs">
                        <span className="h-2 w-2 shrink-0" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {contact.groups.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {contact.groups.map((g) => (
                      <Badge key={g._id} variant="outline">
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                {attributeEntries.length === 0 ? (
                  <span className="text-xs text-muted-foreground">—</span>
                ) : (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {attributeEntries.slice(0, 3).map(([key, value]) => (
                      <span key={key}>
                        <span className="font-medium text-foreground">{key}:</span> {value}
                      </span>
                    ))}
                    {attributeEntries.length > 3 && <span>+{attributeEntries.length - 3} more</span>}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}