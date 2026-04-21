import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Star, Trash2 } from "lucide-react";
import type { AwardItem } from "../../../types/awards";
import {
  AWARD_ACHIEVEMENT_TYPE_OPTIONS,
  AWARD_CATEGORY_OPTIONS,
  createEmptyAward,
} from "../../../types/awards";
import "./AwardsSection.css";

export type AwardsEditorSectionProps = {
  value: AwardItem[];
  onChange: (next: AwardItem[]) => void;
  disabled?: boolean;
  className?: string;
};

type RowProps = {
  item: AwardItem;
  index: number;
  total: number;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onPatch: (index: number, patch: Partial<AwardItem>) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
};

function SortableAwardRow({
  item,
  index,
  total,
  expandedId,
  setExpandedId,
  onPatch,
  onRemove,
  disabled,
}: RowProps) {
  const { t } = useTranslation("common");
  const open = expandedId === item.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const summary =
    item.title?.trim() ||
    t("awards.editor_row_untitled", { n: index + 1 });

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`awards-editor-row${isDragging ? " awards-editor-row--dragging" : ""}`}
    >
      <div className="awards-editor-row__bar">
        <button
          type="button"
          className="awards-editor-row__grip"
          aria-label={t("awards.drag_handle")}
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} />
        </button>
        <button
          type="button"
          className="awards-editor-row__toggle"
          onClick={() => setExpandedId(open ? null : item.id)}
          aria-expanded={open}
        >
          <span className="awards-editor-row__chev">{open ? "▼" : "▶"}</span>
          <span className="awards-editor-row__summary">{summary}</span>
          <span className="awards-editor-row__tags">
            {item.isHighlighted ? (
              <span className="awards-editor-row__pill">{t("awards.featured_badge")}</span>
            ) : null}
            <span className="awards-editor-row__pill">
              {t("awards.editor_counter", { current: index + 1, total })}
            </span>
          </span>
        </button>
        <div className="awards-editor-row__actions">
          <button
            type="button"
            className="awards-editor-row__icon-btn"
            aria-label={t("awards.toggle_highlight")}
            disabled={disabled}
            onClick={() => onPatch(index, { isHighlighted: !item.isHighlighted })}
          >
            <Star size={18} fill={item.isHighlighted ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="awards-editor-row__icon-btn awards-editor-row__icon-btn--danger"
            aria-label={t("awards.remove")}
            disabled={disabled}
            onClick={() => onRemove(index)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="awards-editor-form">
          <label>
            <span className="lbl">{t("awards.field_title")}</span>
            <input
              value={item.title}
              disabled={disabled}
              onChange={(e) => onPatch(index, { title: e.target.value })}
              placeholder={t("awards.placeholder_title")}
            />
          </label>

          <div className="awards-editor-form__row2">
            <label>
              <span className="lbl">{t("awards.field_category")}</span>
              <select
                value={item.category || ""}
                disabled={disabled}
                onChange={(e) => onPatch(index, { category: e.target.value })}
              >
                <option value="">{t("awards.select_placeholder")}</option>
                {AWARD_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="lbl">{t("awards.field_achievement_type")}</span>
              <select
                value={item.achievementType || ""}
                disabled={disabled}
                onChange={(e) => onPatch(index, { achievementType: e.target.value })}
              >
                <option value="">{t("awards.select_placeholder")}</option>
                {AWARD_ACHIEVEMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span className="lbl">{t("awards.field_organization")}</span>
            <input
              value={item.organization || ""}
              disabled={disabled}
              onChange={(e) => onPatch(index, { organization: e.target.value })}
              placeholder={t("awards.placeholder_organization")}
            />
          </label>

          <div className="awards-editor-form__row2">
            <label>
              <span className="lbl">{t("awards.field_year")}</span>
              <input
                value={item.year || ""}
                disabled={disabled}
                onChange={(e) => onPatch(index, { year: e.target.value })}
                placeholder="2024"
                inputMode="numeric"
              />
            </label>
            <label>
              <span className="lbl">{t("awards.field_location")}</span>
              <input
                value={item.location || ""}
                disabled={disabled}
                onChange={(e) => onPatch(index, { location: e.target.value })}
                placeholder={t("awards.placeholder_location")}
              />
            </label>
          </div>

          <label>
            <span className="lbl">{t("awards.field_description")}</span>
            <textarea
              value={item.description || ""}
              disabled={disabled}
              onChange={(e) => onPatch(index, { description: e.target.value })}
              placeholder={t("awards.placeholder_description")}
            />
          </label>

          <label>
            <span className="lbl">{t("awards.field_image_url")}</span>
            <input
              value={item.imageUrl || ""}
              disabled={disabled}
              onChange={(e) => onPatch(index, { imageUrl: e.target.value })}
              placeholder="https://..."
              autoComplete="off"
            />
            {item.imageUrl?.trim() ? (
              <div className="awards-editor__img-preview">
                <img src={item.imageUrl} alt="" />
              </div>
            ) : null}
          </label>

          <div className="awards-editor-form__toggle-row">
            <span>{t("awards.field_highlight")}</span>
            <button
              type="button"
              className="awards-editor-form__switch"
              data-on={item.isHighlighted ? "true" : "false"}
              aria-pressed={!!item.isHighlighted}
              disabled={disabled}
              onClick={() => onPatch(index, { isHighlighted: !item.isHighlighted })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Editor de premios y logros: añadir, editar, eliminar, reordenar (drag), destacados.
 * Estado controlado vía `value` / `onChange` para conectar después con el backend.
 */
export function AwardsEditorSection({
  value,
  onChange,
  disabled,
  className = "",
}: AwardsEditorSectionProps) {
  const { t } = useTranslation("common");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => value.map((v) => v.id), [value]);

  const patchAt = useCallback(
    (index: number, patch: Partial<AwardItem>) => {
      const next = [...value];
      next[index] = { ...next[index], ...patch };
      onChange(next);
    },
    [value, onChange],
  );

  const removeAt = useCallback(
    (index: number) => {
      const row = value[index];
      const next = value.filter((_, i) => i !== index);
      onChange(next);
      if (row && expandedId === row.id) setExpandedId(null);
    },
    [value, onChange, expandedId],
  );

  const addAward = useCallback(() => {
    const row = createEmptyAward();
    onChange([...value, row]);
    setExpandedId(row.id);
  }, [value, onChange]);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const oldIndex = value.findIndex((x) => x.id === active.id);
      const newIndex = value.findIndex((x) => x.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      onChange(arrayMove(value, oldIndex, newIndex));
    },
    [value, onChange],
  );

  return (
    <section className={`awards-editor ${className}`.trim()} aria-labelledby="awards-editor-title">
      <div className="awards-editor__toolbar">
        <div>
          <h2 id="awards-editor-title" className="awards-editor__title">
            {t("awards.editor_title")}
          </h2>
          <p className="awards-editor__hint">{t("awards.editor_hint")}</p>
        </div>
        <button
          type="button"
          className="awards-editor__add"
          onClick={addAward}
          disabled={disabled}
        >
          <Plus size={18} style={{ verticalAlign: "middle", marginRight: 6 }} aria-hidden />
          {t("awards.add_button")}
        </button>
      </div>

      {value.length === 0 ? (
        <div className="awards-editor__empty">
          <p className="awards-editor__empty-title">{t("awards.editor_empty_title")}</p>
          <p className="awards-editor__empty-text">{t("awards.editor_empty_hint")}</p>
          <button
            type="button"
            className="awards-editor__add"
            onClick={addAward}
            disabled={disabled}
          >
            {t("awards.add_button")}
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {value.map((item, index) => (
              <SortableAwardRow
                key={item.id}
                item={item}
                index={index}
                total={value.length}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                onPatch={patchAt}
                onRemove={removeAt}
                disabled={disabled}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}

export default AwardsEditorSection;
