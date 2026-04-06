import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OrganizerFaqItem } from "../../types/organizerFaq";
import { createEmptyOrganizerFaqItem, makeOrganizerFaqId } from "../../utils/organizerFaq";
import { ORGANIZER_FAQ_TEMPLATE_IDS, type OrganizerFaqTemplateId } from "../../constants/organizerFaqTemplates";
import OrganizerFaqAnswerRich from "./OrganizerFaqAnswerRich";
import { useToast } from "../Toast";

const palette = {
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  accent: "#1E88E5",
  danger: "#FF3D57",
  text: "#F5F5F5",
  muted: "rgba(255,255,255,0.65)",
};

function reorder(list: OrganizerFaqItem[], from: number, to: number): OrganizerFaqItem[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((x, i) => ({ ...x, sort_order: i }));
}

type Props = {
  value: OrganizerFaqItem[];
  onChange: (next: OrganizerFaqItem[]) => void;
  disabled?: boolean;
};

type SortableRowProps = {
  row: OrganizerFaqItem;
  index: number;
  itemsLength: number;
  expandedId: string | null;
  setExpandedId: React.Dispatch<React.SetStateAction<string | null>>;
  disabled?: boolean;
  updateAt: (index: number, patch: Partial<OrganizerFaqItem>) => void;
  removeAt: (index: number) => void;
  move: (from: number, dir: -1 | 1) => void;
  previewById: Record<string, boolean>;
  setPreviewById: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
};

function SortableFaqRow({
  row,
  index,
  itemsLength,
  expandedId,
  setExpandedId,
  disabled,
  updateAt,
  removeAt,
  move,
  previewById,
  setPreviewById,
}: SortableRowProps) {
  const { t } = useTranslation("common");
  const open = expandedId === row.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    borderRadius: 16,
    border: `1px solid ${palette.border}`,
    background: palette.card,
    overflow: "hidden",
    position: "relative",
    zIndex: isDragging ? 2 : undefined,
  };

  const preview = !!previewById[row.id];

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        <button
          type="button"
          aria-label={t("organizer_faq.drag_handle_label")}
          disabled={disabled}
          {...attributes}
          {...listeners}
          style={{
            flexShrink: 0,
            width: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.2)",
            border: "none",
            borderRight: `1px solid ${palette.border}`,
            cursor: disabled ? "not-allowed" : "grab",
            color: palette.muted,
          }}
        >
          <GripVertical size={20} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setExpandedId(open ? null : row.id)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textAlign: "left",
          }}
          aria-expanded={open}
        >
          <span style={{ fontSize: "1.1rem", color: palette.muted }}>{open ? "▼" : "▶"}</span>
          <span style={{ flex: 1, fontWeight: 700, color: palette.text, fontSize: "0.98rem" }}>
            {row.q.trim() ? row.q : t("organizer_faq.untitled", { n: index + 1 })}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: palette.muted,
              padding: "2px 8px",
              borderRadius: 999,
              border: `1px solid ${palette.border}`,
            }}
          >
            {t("organizer_faq.counter", { current: index + 1, total: itemsLength || 1 })}
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "0 16px 16px 16px",
                display: "grid",
                gap: 12,
                borderTop: `1px solid ${palette.border}`,
              }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: palette.muted }}>{t("organizer_faq.question")}</span>
                <input
                  type="text"
                  value={row.q}
                  disabled={disabled}
                  onChange={(e) => updateAt(index, { q: e.target.value })}
                  placeholder={t("organizer_faq.question_placeholder")}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: palette.text,
                    fontSize: "1rem",
                  }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: palette.muted }}>{t("organizer_faq.answer")}</span>
                <span style={{ fontSize: "0.75rem", color: palette.muted, lineHeight: 1.4 }}>{t("organizer_faq.answer_hint_markdown")}</span>
                <textarea
                  value={row.a}
                  disabled={disabled}
                  onChange={(e) => updateAt(index, { a: e.target.value })}
                  placeholder={t("organizer_faq.answer_placeholder")}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: palette.text,
                    fontSize: "0.95rem",
                    lineHeight: 1.5,
                    resize: "vertical",
                    minHeight: 96,
                  }}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.85rem",
                  color: palette.muted,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={preview}
                  disabled={disabled}
                  onChange={(e) =>
                    setPreviewById((prev) => ({ ...prev, [row.id]: e.target.checked }))
                  }
                />
                {t("organizer_faq.preview")}
              </label>

              {preview && row.a.trim() ? (
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(0,0,0,0.25)",
                    color: palette.text,
                  }}
                >
                  <OrganizerFaqAnswerRich markdown={row.a} />
                </div>
              ) : null}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  style={secondaryBtn(disabled || index === 0)}
                >
                  {t("organizer_faq.move_up")}
                </button>
                <button
                  type="button"
                  disabled={disabled || index >= itemsLength - 1}
                  onClick={() => move(index, 1)}
                  style={secondaryBtn(disabled || index >= itemsLength - 1)}
                >
                  {t("organizer_faq.move_down")}
                </button>
                <button type="button" disabled={disabled} onClick={() => removeAt(index)} style={dangerBtn(disabled)}>
                  {t("organizer_faq.delete")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Editor de FAQs para perfil de organizador: añadir (plantillas o en blanco), editar, reordenar (arrastre), eliminar.
 */
export default function OrganizerFaqEditor({ value, onChange, disabled }: Props) {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const items = Array.isArray(value) ? value : [];
  const [expandedId, setExpandedId] = useState<string | null>(() => items[0]?.id ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewById, setPreviewById] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateAt = useCallback(
    (index: number, patch: Partial<OrganizerFaqItem>) => {
      const next = items.map((row, i) => (i === index ? { ...row, ...patch } : row));
      onChange(next);
    },
    [items, onChange]
  );

  const removeAt = useCallback(
    (index: number) => {
      if (disabled) return;
      const next = items.filter((_, i) => i !== index).map((x, i) => ({ ...x, sort_order: i }));
      onChange(next);
      showToast(t("organizer_faq.deleted_toast"), "success");
      setPreviewById((prev) => {
        const id = items[index]?.id;
        if (!id) return prev;
        const { [id]: _, ...rest } = prev;
        return rest;
      });
      setExpandedId((prev) => {
        if (prev && next.some((x) => x.id === prev)) return prev;
        return next[0]?.id ?? null;
      });
    },
    [items, onChange, disabled, t, showToast]
  );

  const move = useCallback(
    (from: number, dir: -1 | 1) => {
      if (disabled) return;
      const to = from + dir;
      onChange(reorder(items, from, to));
    },
    [items, onChange, disabled]
  );

  const addFromTemplate = useCallback(
    (tid: "blank" | OrganizerFaqTemplateId) => {
      if (disabled) return;
      let row: OrganizerFaqItem;
      if (tid === "blank") {
        row = { ...createEmptyOrganizerFaqItem(), id: makeOrganizerFaqId(), sort_order: items.length };
      } else {
        row = {
          id: makeOrganizerFaqId(),
          q: t(`organizer_faq.templates.${tid}.question`),
          a: t(`organizer_faq.templates.${tid}.answer`),
          sort_order: items.length,
        };
      }
      onChange([...items, row]);
      setExpandedId(row.id);
      setPickerOpen(false);
    },
    [items, onChange, disabled, t]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((r) => r.id === active.id);
      const newIndex = items.findIndex((r) => r.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onChange(arrayMove(items, oldIndex, newIndex).map((x, i) => ({ ...x, sort_order: i })));
    },
    [items, onChange]
  );

  return (
    <div data-test-id="organizer-faq-editor">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: palette.text }}>{t("organizer_faq.title")}</h2>
          <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.9rem", color: palette.muted, maxWidth: 520, lineHeight: 1.45 }}>
            {t("organizer_faq.intro")}
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: disabled ? 1 : 1.02 }}
          whileTap={{ scale: disabled ? 1 : 0.98 }}
          onClick={() => setPickerOpen(true)}
          disabled={disabled}
          style={{
            padding: "0.65rem 1.1rem",
            borderRadius: 999,
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            fontWeight: 700,
            fontSize: "0.9rem",
            color: "#fff",
            background: `linear-gradient(135deg, ${palette.accent}, #7C4DFF)`,
            boxShadow: "0 8px 22px rgba(30,136,229,0.35)",
          }}
        >
          {t("organizer_faq.add_question")}
        </motion.button>
      </div>

      {pickerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="organizer-faq-template-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={() => setPickerOpen(false)}
          data-test-id="organizer-faq-template-picker"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              borderRadius: 16,
              padding: "1.25rem",
              background: "linear-gradient(165deg, rgba(28,28,40,0.98), rgba(18,18,28,0.99))",
              border: `1px solid ${palette.border}`,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h3 id="organizer-faq-template-title" style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", color: palette.text }}>
              {t("organizer_faq.add_menu_title")}
            </h3>
            <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
              {ORGANIZER_FAQ_TEMPLATE_IDS.map((tid) => (
                <button
                  key={tid}
                  type="button"
                  disabled={disabled}
                  onClick={() => addFromTemplate(tid)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    background: "rgba(255,255,255,0.06)",
                    color: palette.text,
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {t(`organizer_faq.templates.${tid}.label`)}
                </button>
              ))}
              <button
                type="button"
                disabled={disabled}
                onClick={() => addFromTemplate("blank")}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1px dashed ${palette.border}`,
                  background: "transparent",
                  color: palette.muted,
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {t("organizer_faq.add_blank")}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  background: "rgba(255,255,255,0.06)",
                  color: palette.text,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <AnimatePresence initial={false}>
              {items.map((row, index) => (
                <motion.div
                  key={row.id}
                  layout={false}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableFaqRow
                    row={row}
                    index={index}
                    itemsLength={items.length}
                    expandedId={expandedId}
                    setExpandedId={setExpandedId}
                    disabled={disabled}
                    updateAt={updateAt}
                    removeAt={removeAt}
                    move={move}
                    previewById={previewById}
                    setPreviewById={setPreviewById}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1.25rem",
            borderRadius: 16,
            border: `1px dashed ${palette.border}`,
            background: "rgba(255,255,255,0.03)",
            color: palette.muted,
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>💬</div>
          <div style={{ fontWeight: 700, color: palette.text, marginBottom: 6 }}>{t("organizer_faq.empty_title")}</div>
          <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{t("organizer_faq.empty_hint")}</div>
        </div>
      )}
    </div>
  );
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${palette.border}`,
    background: "rgba(255,255,255,0.06)",
    color: palette.text,
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  };
}

function dangerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid rgba(255,61,87,0.45)`,
    background: "rgba(255,61,87,0.12)",
    color: "#ffb4c0",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
  };
}
