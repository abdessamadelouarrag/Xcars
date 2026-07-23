"use client";

import { CheckCheck, Loader2, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { permissionGroups, permissionOptions } from "@/lib/auth/permission-options";
import type { Permission } from "@/lib/auth/permissions";

export function MemberPermissionsEditor({
  memberId,
  memberName,
  initialPermissions,
}: {
  memberId: string;
  memberName: string;
  initialPermissions: Permission[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPermissions, setSavedPermissions] =
    useState<Permission[]>(initialPermissions);
  const [selected, setSelected] = useState<Permission[]>(initialPermissions);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function showEditor() {
    setSelected(savedPermissions);
    setOpen(true);
  }

  function togglePermission(permission: Permission, checked: boolean) {
    setSelected((current) =>
      checked
        ? [...new Set([...current, permission])]
        : current.filter((item) => item !== permission),
    );
  }

  async function save() {
    setSaving(true);
    const response = await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: selected }),
    });
    const payload = (await response.json()) as {
      error?: { message: string };
    };
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error?.message ?? "Permissions non enregistrées.");
      return;
    }

    setSavedPermissions(selected);
    setOpen(false);
    toast.success("Permissions mises à jour");
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={showEditor}
        aria-label={`Modifier les permissions de ${memberName}`}
      >
        <ShieldCheck />
        Permissions
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Fermer la fenêtre des permissions"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`permissions-title-${memberId}`}
            className="relative flex max-h-[min(780px,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h2
                  id={`permissions-title-${memberId}`}
                  className="text-lg font-bold"
                >
                  Permissions de {memberName}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les changements prennent effet dès l’enregistrement.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X />
              </Button>
            </header>

            <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/35 px-5 py-3 sm:px-6">
              <p className="text-xs font-medium text-muted-foreground">
                {selected.length} droit{selected.length > 1 ? "s" : ""} activé
                {selected.length > 1 ? "s" : ""}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelected(permissionOptions.map((item) => item.value))
                  }
                >
                  <CheckCheck />
                  Tout
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected([])}
                >
                  Aucun
                </Button>
              </div>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
              {permissionGroups.map((group) => (
                <fieldset key={group.label}>
                  <legend className="text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
                    {group.label}
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {group.options.map((permission) => (
                      <label
                        key={permission.value}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted/60"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 size-4 accent-primary"
                          checked={selected.includes(permission.value)}
                          onChange={(event) =>
                            togglePermission(
                              permission.value,
                              event.target.checked,
                            )
                          }
                        />
                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <footer className="flex justify-end gap-2 border-t border-border bg-card px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                Enregistrer les permissions
              </Button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
