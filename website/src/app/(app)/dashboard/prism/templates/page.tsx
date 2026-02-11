"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AppHeader } from "@/components/app/app-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAuth } from "@/components/app/auth-provider";
import {
  PLACEHOLDERS,
  SAMPLE_PLACEHOLDER_VALUES,
  DEFAULT_TEMPLATE_NAME,
  renderTemplate,
} from "@prism/shared";
import {
  FileText,
  Plus,
  Star,
  Pencil,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  body: string;
  isPredefined: boolean;
}

interface EditingTemplate {
  id?: string;
  name: string;
  description: string;
  body: string;
}

const placeholderKeys = Object.keys(PLACEHOLDERS);

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [localDefaultId, setLocalDefaultId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const customTemplates = templates.filter((t) => !t.isPredefined);
  const predefinedTemplates = templates.filter((t) => t.isPredefined);

  // Effective default: explicit user choice > fallback to "Standard" predefined
  const explicitDefaultId = localDefaultId ?? user?.defaultTemplateId ?? null;
  const effectiveDefaultId =
    explicitDefaultId ??
    predefinedTemplates.find((t) => t.name === DEFAULT_TEMPLATE_NAME)?.id ??
    null;

  const openCreate = () => {
    setEditing({ name: "", description: "", body: "" });
    setError(null);
    setShowPreview(false);
  };

  const openEdit = (tpl: Template) => {
    setEditing({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      body: tpl.body,
    });
    setError(null);
    setShowPreview(false);
  };

  const closeModal = () => {
    setEditing(null);
    setError(null);
    setShowPreview(false);
  };

  const insertPlaceholder = (key: string) => {
    if (!editing || !bodyRef.current) return;
    const textarea = bodyRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const insertion = `{${key}}`;
    const before = editing.body.substring(0, start);
    const after = editing.body.substring(end);
    const newBody = before + insertion + after;
    setEditing({ ...editing, body: newBody });
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + insertion.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const saveTemplate = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.body.trim()) {
      setError("Name and body are required.");
      return;
    }
    if (!/\{\w+\}/.test(editing.body)) {
      setError("Body must contain at least one {placeholder}.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isUpdate = !!editing.id;
      const url = isUpdate ? `/api/templates/${editing.id}` : "/api/templates";
      const method = isUpdate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          description: editing.description,
          body: editing.body,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save template");
      }

      closeModal();
      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        await fetchTemplates();
      }
    } catch {
      // handle error
    } finally {
      setDeleting(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}/set-default`, {
        method: "PATCH",
      });
      if (res.ok) {
        setLocalDefaultId(id);
      }
    } catch {
      // handle error
    }
  };

  const previewBody = editing?.body
    ? renderTemplate(editing.body, SAMPLE_PLACEHOLDER_VALUES)
    : "";

  return (
    <>
      <AppHeader
        title="Templates"
        description="Manage your PR description templates."
      />

      <div className="p-8 space-y-8">
        {/* Custom Templates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Templates</h2>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <Plus size={16} className="mr-1.5" />
              Create Template
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : customTemplates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/50 bg-card/50 py-12 text-center">
              <FileText
                size={32}
                className="mx-auto text-muted-foreground/50"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                No custom templates yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create templates to customize your PR descriptions.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {customTemplates.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  isDefault={tpl.id === effectiveDefaultId}
                  onEdit={() => openEdit(tpl)}
                  onDelete={() => deleteTemplate(tpl.id)}
                  onSetDefault={() => setDefault(tpl.id)}
                  isDeleting={deleting === tpl.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Built-in Templates */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Built-in Templates</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {predefinedTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                isDefault={tpl.id === effectiveDefaultId}
                onSetDefault={() => setDefault(tpl.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={!!editing} onClose={closeModal}>
        <DialogHeader onClose={closeModal}>
          <h2 className="text-lg font-semibold">
            {editing?.id ? "Edit Template" : "Create Template"}
          </h2>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={editing?.name ?? ""}
              onChange={(e) =>
                editing && setEditing({ ...editing, name: e.target.value })
              }
              placeholder="e.g. Bug Fix Template"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={editing?.description ?? ""}
              onChange={(e) =>
                editing &&
                setEditing({ ...editing, description: e.target.value })
              }
              placeholder="Brief description of this template"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Body</label>
              <button
                type="button"
                onClick={() => setShowPreview((p) => !p)}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showPreview ? (
                  <EyeOff size={13} />
                ) : (
                  <Eye size={13} />
                )}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>

            {showPreview ? (
              <div className="w-full rounded-lg border border-input bg-secondary/30 p-4 text-sm font-mono whitespace-pre-wrap max-h-64 overflow-y-auto">
                {previewBody || (
                  <span className="text-muted-foreground italic">
                    Enter a template body to see preview...
                  </span>
                )}
              </div>
            ) : (
              <textarea
                ref={bodyRef}
                value={editing?.body ?? ""}
                onChange={(e) =>
                  editing && setEditing({ ...editing, body: e.target.value })
                }
                placeholder={
                  "## Summary\n{summary}\n\n## Changes\n{what_changed}"
                }
                rows={10}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
              />
            )}
          </div>

          {/* Placeholder Chips */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Click a placeholder to insert it into the body
            </p>
            <div className="flex flex-wrap gap-1.5">
              {placeholderKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => insertPlaceholder(key)}
                  title={PLACEHOLDERS[key].description}
                  className="inline-flex items-center rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs font-mono text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30 cursor-pointer"
                >
                  {`{${key}}`}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={closeModal}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveTemplate} disabled={saving}>
            <Save size={14} className="mr-1.5" />
            {saving
              ? "Saving..."
              : editing?.id
                ? "Update Template"
                : "Create Template"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

function TemplateCard({
  template,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting,
}: {
  template: Template;
  isDefault: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  isDeleting?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{template.name}</h3>
            {template.isPredefined && (
              <Badge variant="secondary" className="text-[10px]">
                Built-in
              </Badge>
            )}
            {isDefault && (
              <Badge className="text-[10px]">
                <Star size={10} className="mr-0.5" />
                Default
              </Badge>
            )}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {template.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isDefault && onSetDefault && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onSetDefault}
              className="text-xs h-8"
              title="Set as default"
            >
              <Star size={14} />
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="text-xs h-8"
              title="Edit"
            >
              <Pencil size={14} />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={isDeleting}
              className="text-xs h-8 text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
      <pre className="mt-3 rounded-lg bg-secondary/50 p-3 text-xs font-mono text-muted-foreground overflow-x-auto max-h-40 overflow-y-auto">
        {template.body}
      </pre>
    </div>
  );
}
