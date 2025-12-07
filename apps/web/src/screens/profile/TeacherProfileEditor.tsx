import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTeacherMy, useUpsertTeacher } from "../../hooks/useTeacher";
import { useTeacherMedia } from "../../hooks/useTeacherMedia";
import { useTags } from "../../hooks/useTags";
import RitmosChips from "@/components/RitmosChips";
import { RITMOS_CATALOG } from "@/lib/ritmosCatalog";
import { useHydratedForm } from "../../hooks/useHydratedForm";
import { Chip } from "../../components/profile/Chip";
import ImageWithFallback from "../../components/ImageWithFallback";
import { PHOTO_SLOTS, VIDEO_SLOTS, getMediaBySlot } from "../../utils/mediaSlots";
import type { MediaItem as MediaSlotItem } from "../../utils/mediaSlots";
import { ProfileNavigationToggle } from "../../components/profile/ProfileNavigationToggle";
import InvitedMastersSection from "../../components/profile/InvitedMastersSection";
import BankAccountEditor, { type BankAccountData } from "../../components/profile/BankAccountEditor";
import { getDraftKey } from "../../utils/draftKeys";
import { useDrafts } from "../../state/drafts";
import { useRoleChange } from "../../hooks/useRoleChange";
import { useAuth } from "@/contexts/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { validateZonasAgainstCatalog } from "../../utils/validateZonas";
import '@/styles/organizer.css';
import { useTeacherInvitations, useRespondToInvitation, useTeacherAcademies, useRemoveInvitation } from "../../hooks/useAcademyTeacherInvitations";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { generateClassId, ensureClassId } from "../../utils/classIdGenerator";
import ZonaGroupedChips from "../../components/profile/ZonaGroupedChips";
import { useMyCompetitionGroups, useDeleteCompetitionGroup } from "../../hooks/useCompetitionGroups";
import { FaInstagram, FaFacebookF, FaTiktok, FaYoutube, FaWhatsapp, FaGlobe, FaTelegram } from 'react-icons/fa';
import { StripePayoutSettings } from "../../components/payments/StripePayoutSettings";
import { useMyApprovedRoles } from "../../hooks/useMyApprovedRoles";

// Lazy load heavy components
const TeacherMetricsPanel = React.lazy(() => import("../../components/profile/TeacherMetricsPanel").then(m => ({ default: m.TeacherMetricsPanel })));
const UbicacionesEditor = React.lazy(() => import("../../components/locations/UbicacionesEditor"));
const CrearClase = React.lazy(() => import("../../components/events/CrearClase"));
const CostsPromotionsEditor = React.lazy(() => import("../../components/events/CostsPromotionsEditor"));
const FAQEditor = React.lazy(() => import("../../components/common/FAQEditor"));
const PhotoManagementSection = React.lazy(() => import("../../components/profile/PhotoManagementSection").then(m => ({ default: m.PhotoManagementSection })));
const VideoManagementSection = React.lazy(() => import("../../components/profile/VideoManagementSection").then(m => ({ default: m.VideoManagementSection })));
const AcademyCard = React.lazy(() => import("../../components/explore/cards/AcademyCard"));

const colors = {
  primary: '#E53935',
  secondary: '#FB8C00',
  blue: '#1E88E5',
  coral: '#FF7043',
  light: '#F5F5F5',
  dark: '#1A1A1A',
  orange: '#FF9800'
};

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const formatCurrency = (value?: number | string | null) => {
  // Si es null/undefined/vacío, retornar null para no mostrar nada
  if (value === null || value === undefined || value === '') return null;
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (numeric === null || Number.isNaN(numeric)) return null;
  // Si es 0, retornar "Gratis"
  if (numeric === 0) return 'Gratis';
  // Si es > 0, formatear como precio
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `$${Number(numeric).toLocaleString('en-US')}`;
  }
};

// CSS constante a nivel de módulo para evitar reinserción en cada render
const STYLES = `
        .academy-editor-container {
          min-height: 100vh;
          padding: 2rem 1rem;
        }
        .academy-editor-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .academy-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .academy-editor-inner h2,
        .academy-editor-inner h3,
        .academy-editor-card h2,
        .org-editor__card h2 {
          color: #fff;
          text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
        }
        .photos-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .rhythms-zones-two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .academy-editor-card {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 3rem;
        }
        .academy-editor-grid {
          display: grid;
          gap: 1.5rem;
        }
        .academy-social-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .teacher-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .teacher-tab-button {
          padding: 0.75rem 1.5rem;
          border-radius: 12px 12px 0 0;
          border: none;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
    background: transparent;
    font-weight: 600;
  }
  .teacher-tab-button:hover {
    opacity: 0.9;
  }
  .teacher-tab-button[aria-selected="true"] {
    background: linear-gradient(135deg, rgba(240,147,251,0.2), rgba(245,87,108,0.2));
    font-weight: 800;
    border-bottom: 2px solid rgba(240,147,251,0.5);
  }
  .teacher-tab-button:focus-visible {
    outline: 2px solid rgba(240,147,251,0.5);
    outline-offset: 2px;
        }
        .academies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .invitation-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .invitation-actions {
          display: flex;
          gap: 0.5rem;
        }
      .editor-section {
        margin-bottom: 3rem;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .editor-section-title {
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
    color: #F5F5F5;
        text-shadow: rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px;
      }
      .editor-field {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
    color: #F5F5F5;
      }
      .editor-input {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
    color: #F5F5F5;
        font-size: 1rem;
      }
      .editor-textarea {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
    color: #F5F5F5;
        font-size: 1rem;
        resize: vertical;
        font-family: inherit;
      }
      .glass-card-container {
        opacity: 1;
        margin-bottom: 2rem;
        padding: 2rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: rgba(0, 0, 0, 0.3) 0px 8px 32px;
        backdrop-filter: blur(10px);
        transform: none;
      }
      .info-redes-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: start;
      }
      .profile-section-compact {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      .row-bottom {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .row-bottom-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .subtitle {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
    color: #F5F5F5;
      }
      .tag {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .social-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .field {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1rem;
      }
      .field-icon {
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.9;
    color: #F5F5F5;
      }
      .input-group {
        flex: 1;
        display: flex;
        align-items: center;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
        transition: all 0.2s ease;
      }
      .input-group:focus-within {
        border-color: rgba(76, 173, 255, 0.6);
        background: rgba(255, 255, 255, 0.12);
        box-shadow: 0 0 0 2px rgba(76, 173, 255, 0.2);
      }
      .prefix {
        padding: 0.75rem 0.5rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        border-right: 1px solid rgba(255, 255, 255, 0.15);
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.05);
      }
      .input-group input {
        border: none;
        outline: none;
        background: transparent;
    color: #F5F5F5;
        font-size: 1rem;
        padding: 0.75rem;
        flex: 1;
        min-width: 0;
      }
      .input-group input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
  .academy-chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .academy-class-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .academy-class-buttons {
    display: flex;
    gap: 8px;
  }
  .competition-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .competition-group-item {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  .competition-group-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .status-banner {
    margin-bottom: 1.5rem;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
  }
  .status-banner--ok {
    border: 1px solid rgba(16,185,129,0.4);
    background: rgba(16,185,129,0.15);
    box-shadow: 0 4px 12px rgba(16,185,129,0.2);
  }
  .status-banner--err {
    border: 1px solid rgba(239,68,68,0.4);
    background: rgba(239,68,68,0.15);
    box-shadow: 0 4px 12px rgba(239,68,68,0.2);
  }
  .welcome-banner {
    padding: 1.5rem;
    margin-bottom: 2rem;
    background: linear-gradient(135deg, rgba(229, 57, 53, 0.2) 0%, rgba(251, 140, 0, 0.2) 100%);
    border: 2px solid rgba(229, 57, 53, 0.4);
    border-radius: 16px;
    text-align: center;
  }
  .welcome-banner-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
  .welcome-banner-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #E53935 0%, #FB8C00 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .welcome-banner-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .loading-screen {
    padding: 48px 24px;
    text-align: center;
    color: #F5F5F5;
  }
  .loading-icon {
    font-size: 2rem;
    margin-bottom: 16px;
  }
  .error-screen {
    padding: 48px 24px;
    text-align: center;
    color: #F5F5F5;
  }
  .error-icon {
    font-size: 2.2rem;
    margin-bottom: 16px;
  }
  .retry-button {
    margin-top: 4px;
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.35);
    background: transparent;
    color: #F5F5F5;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s ease;
  }
  .retry-button:hover {
    background: rgba(255,255,255,0.1);
  }
  .retry-button:focus-visible {
    outline: 2px solid rgba(255,255,255,0.5);
    outline-offset: 2px;
  }
  .class-edit-button, .class-delete-button {
    padding: 8px 12px;
    border-radius: 10px;
    color: #fff;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
  }
  .class-edit-button {
    border: 1px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.06);
  }
  .class-edit-button:hover {
    background: rgba(255,255,255,0.1);
  }
  .class-delete-button {
    border: 1px solid rgba(229,57,53,0.35);
    background: rgba(229,57,53,0.12);
  }
  .class-delete-button:hover {
    background: rgba(229,57,53,0.2);
  }
  .invitation-accept-button, .invitation-reject-button, .invitation-remove-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .invitation-accept-button {
    background: linear-gradient(135deg, #10B981, #059669);
  }
  .invitation-accept-button:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .invitation-reject-button, .invitation-remove-button {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid #EF4444;
    color: #EF4444;
  }
  .invitation-reject-button:hover:not(:disabled), .invitation-remove-button:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.3);
  }
  .invitation-accept-button:disabled, .invitation-reject-button:disabled, .invitation-remove-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .competition-group-view-button, .competition-group-edit-button, .competition-group-delete-button {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    color: #fff;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .competition-group-view-button {
    background: rgba(30,136,229,0.2);
    border: 1px solid #1E88E5;
  }
  .competition-group-view-button:hover {
    background: rgba(30,136,229,0.3);
  }
  .competition-group-edit-button {
    background: rgba(255,193,7,0.2);
    border: 1px solid #FFC107;
  }
  .competition-group-edit-button:hover {
    background: rgba(255,193,7,0.3);
  }
  .competition-group-delete-button {
    background: rgba(239,68,68,0.2);
    border: 1px solid #EF4444;
  }
  .competition-group-delete-button:hover:not(:disabled) {
    background: rgba(239,68,68,0.3);
  }
  .competition-group-delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .create-group-button {
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #10B981, #059669);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
  }
  .create-group-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  .create-group-button:focus-visible {
    outline: 2px solid rgba(16,185,129,0.5);
    outline-offset: 2px;
  }
      @media (max-width: 768px) {
    .photos-two-columns {
          grid-template-columns: 1fr !important;
          gap: 1rem !important;
        }
    .rhythms-zones-two-columns {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .academy-editor-container {
      padding: 1rem 0.75rem !important;
    }
    .academy-editor-inner {
      max-width: 100% !important;
      padding: 0 0.5rem !important;
    }
    .academy-editor-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    .academy-editor-card {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
      border-radius: 12px !important;
    }
    .academy-editor-card h2 {
      font-size: 1.25rem !important;
      margin-bottom: 1rem !important;
    }
    .academy-editor-grid {
      gap: 1rem !important;
    }
    .academy-social-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .org-editor__header {
      flex-direction: column !important;
      gap: 0.75rem !important;
      text-align: center !important;
    }
    .org-editor__back {
      align-self: flex-start !important;
    }
    .org-editor__title {
      font-size: 1.5rem !important;
    }
    .teacher-tabs {
      flex-wrap: wrap !important;
      gap: 0.4rem !important;
    }
    .teacher-tab-button {
      flex: 1 1 auto !important;
      min-width: 120px !important;
      padding: 0.6rem 1rem !important;
      font-size: 0.9rem !important;
    }
    .academies-grid {
      grid-template-columns: 1fr !important;
      gap: 1rem !important;
    }
    .invitation-card {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    .invitation-actions {
      width: 100% !important;
      flex-direction: column !important;
    }
    .invitation-actions button {
      width: 100% !important;
    }
        .editor-section {
          padding: 1rem !important;
          margin-bottom: 1.5rem !important;
          border-radius: 12px !important;
        }
        .editor-section-title {
          font-size: 1.2rem !important;
          margin-bottom: 0.75rem !important;
        }
        .glass-card-container {
          padding: 0.75rem !important;
          margin-bottom: 1rem !important;
          border-radius: 12px !important;
        }
        .profile-section-compact {
          padding: 1rem !important;
          gap: 1rem !important;
        }
        .subtitle {
          font-size: 0.95rem !important;
        }
        .field-icon {
          width: 24px !important;
          height: 24px !important;
        }
        .field {
          font-size: 0.9rem !important;
          gap: 0.5rem !important;
        }
        .input-group input {
          font-size: 0.9rem !important;
          padding: 0.6rem !important;
        }
        .prefix {
          font-size: 0.85rem !important;
          padding: 0.6rem 0.4rem !important;
        }
    .competition-group-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
    }
    .competition-group-header button {
      width: 100% !important;
    }
    .competition-group-item {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      padding: 1rem !important;
    }
    .competition-group-actions {
      width: 100% !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 0.5rem !important;
    }
    .competition-group-actions button {
      width: 100% !important;
      padding: 0.625rem !important;
      font-size: 0.875rem !important;
    }
  }
      @media (max-width: 480px) {
    .academy-editor-container {
      padding: 0.75rem 0.5rem !important;
    }
    .academy-editor-inner {
      padding: 0 0.25rem !important;
    }
    .academy-editor-card {
      padding: 0.75rem !important;
      margin-bottom: 1rem !important;
      border-radius: 10px !important;
    }
    .academy-editor-card h2 {
      font-size: 1.1rem !important;
      margin-bottom: 0.75rem !important;
    }
    .org-editor__title {
      font-size: 1.25rem !important;
    }
    input, textarea {
      font-size: 0.9rem !important;
      padding: 0.625rem !important;
    }
    label {
      font-size: 0.875rem !important;
      margin-bottom: 0.375rem !important;
    }
    .academy-chips-container {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.5rem !important;
    }
    .academy-class-item {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 0.75rem !important;
    }
    .academy-class-buttons {
      width: 100% !important;
      display: flex !important;
      gap: 0.5rem !important;
    }
    .academy-class-buttons button {
      flex: 1 !important;
      padding: 0.5rem !important;
      font-size: 0.875rem !important;
    }
    .teacher-tabs {
      gap: 0.3rem !important;
    }
    .teacher-tab-button {
      flex: 1 1 100% !important;
      min-width: 100% !important;
      padding: 0.5rem 0.75rem !important;
      font-size: 0.85rem !important;
    }
    .academies-grid {
      gap: 0.75rem !important;
    }
    .invitation-card {
      gap: 0.5rem !important;
    }
    .org-editor__card {
      padding: 1rem !important;
      margin-bottom: 1.5rem !important;
    }
    .competition-group-header {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
    }
    .competition-group-header button {
      width: 100% !important;
    }
    .competition-group-item {
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      padding: 1rem !important;
    }
    .competition-group-actions {
      width: 100% !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.5rem !important;
    }
    .competition-group-actions button {
      flex: 1 1 auto !important;
      min-width: calc(50% - 0.25rem) !important;
      padding: 0.625rem !important;
      font-size: 0.875rem !important;
    }
        .editor-section {
          padding: 0.75rem !important;
          margin-bottom: 1rem !important;
          border-radius: 10px !important;
        }
        .editor-section-title {
          font-size: 1.1rem !important;
          margin-bottom: 0.5rem !important;
        }
        .editor-input,
        .editor-textarea {
          padding: 0.6rem !important;
          font-size: 0.9rem !important;
        }
        .glass-card-container {
          padding: 0.5rem !important;
          margin-bottom: 0.75rem !important;
          border-radius: 10px !important;
        }
        .profile-section-compact {
          padding: 0.75rem !important;
          gap: 1rem !important;
        }
        .subtitle {
          font-size: 0.9rem !important;
        }
        .tag {
          font-size: 0.7rem !important;
        }
        .field-icon {
          width: 22px !important;
          height: 22px !important;
        }
        .social-list {
          gap: 0.5rem !important;
        }
        .field {
          font-size: 0.85rem !important;
          gap: 0.5rem !important;
        }
        .input-group input {
          font-size: 0.85rem !important;
          padding: 0.5rem !important;
        }
        .prefix {
          font-size: 0.8rem !important;
          padding: 0.5rem 0.4rem !important;
        }
      }
`;

// Memoized subcomponents
const SocialFieldRow = React.memo<{
  icon: React.ReactNode;
  prefix: string;
  name: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}>(({ icon, prefix, name, value, placeholder, type = 'text', onChange }) => (
  <label className="field">
    <span className="field-icon">{icon}</span>
    <div className="input-group">
      <span className="prefix">{prefix}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  </label>
));
SocialFieldRow.displayName = 'SocialFieldRow';

const ClassListItem = React.memo<{
  item: any;
  costo: any;
  fechaLabel: string | null;
  costoLabel: string | null;
  onEdit: () => void;
  onDelete: () => void;
}>(({ item, costo, fechaLabel, costoLabel, onEdit, onDelete }) => (
  <div className="academy-class-item">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <strong style={{ color: '#fff' }}>{item.titulo || 'Clase'}</strong>
      <span style={{ fontSize: 12, opacity: 0.8 }}>🕒 {item.inicio || '—'} – {item.fin || '—'}</span>
      {(fechaLabel || costoLabel) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {fechaLabel && (
            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(240,147,251,0.15)', border: '1px solid rgba(240,147,251,0.28)' }}>
              📅 {fechaLabel}
            </span>
          )}
          {costoLabel && (
            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.28)' }}>
              💰 {costoLabel === 'Gratis' ? 'Gratis' : costoLabel}
            </span>
          )}
        </div>
      )}
    </div>
    <div className="academy-class-buttons">
      <button type="button" onClick={onEdit} className="class-edit-button">
        Editar
      </button>
      <button type="button" onClick={onDelete} className="class-delete-button">
        Eliminar
      </button>
    </div>
  </div>
));
ClassListItem.displayName = 'ClassListItem';

const InvitationItem = React.memo<{
  invitation: any;
  colors: typeof colors;
  onAccept: () => void;
  onReject: () => void;
  onRemove: () => void;
  isAccepting: boolean;
  isRemoving: boolean;
}>(({ invitation, colors, onAccept, onReject, onRemove, isAccepting, isRemoving }) => {
  const academy = invitation.academy;
  if (!academy) return null;

  return (
    <div
      key={invitation.id}
      className="invitation-card"
      style={{
        padding: '1.5rem',
        background: invitation.status === 'pending' 
          ? 'rgba(255, 193, 7, 0.1)' 
          : invitation.status === 'accepted'
          ? 'rgba(16, 185, 129, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        borderRadius: '12px',
        border: `1px solid ${
          invitation.status === 'pending' 
            ? 'rgba(255, 193, 7, 0.3)' 
            : invitation.status === 'accepted'
            ? 'rgba(16, 185, 129, 0.3)'
            : 'rgba(239, 68, 68, 0.3)'
        }`
      }}
    >
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: academy.avatar_url 
          ? `url(${academy.avatar_url}) center/cover`
          : 'linear-gradient(135deg, #E53935, #FB8C00)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: '700',
        fontSize: '1.25rem',
        flexShrink: 0
      }}>
        {!academy.avatar_url && (academy.nombre_publico?.[0]?.toUpperCase() || '🎓')}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, color: colors.light, fontSize: '1.1rem' }}>
          {academy.nombre_publico}
        </h3>
        {academy.bio && (
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.7, color: colors.light }}>
            {academy.bio.substring(0, 100)}{academy.bio.length > 100 ? '...' : ''}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            padding: '0.25rem 0.5rem',
            background: invitation.status === 'pending' 
              ? 'rgba(255, 193, 7, 0.2)' 
              : invitation.status === 'accepted'
              ? 'rgba(16, 185, 129, 0.2)'
              : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${
              invitation.status === 'pending' 
                ? '#FFC107' 
                : invitation.status === 'accepted'
                ? '#10B981'
                : '#EF4444'
            }`,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: invitation.status === 'pending' 
              ? '#FFC107' 
              : invitation.status === 'accepted'
              ? '#10B981'
              : '#EF4444'
          }}>
            {invitation.status === 'pending' && '⏳ Pendiente'}
            {invitation.status === 'accepted' && '✅ Aceptada'}
            {invitation.status === 'rejected' && '❌ Rechazada'}
            {invitation.status === 'cancelled' && '🚫 Cancelada'}
          </span>
          {invitation.invited_at && (
            <span style={{ fontSize: '0.75rem', opacity: 0.6, color: colors.light }}>
              {new Date(invitation.invited_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
      </div>
      {invitation.status === 'pending' && (
        <div className="invitation-actions">
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="invitation-accept-button"
          >
            ✅ Aceptar
          </button>
          <button
            onClick={onReject}
            disabled={isAccepting}
            className="invitation-reject-button"
          >
            ❌ Rechazar
          </button>
        </div>
      )}
      {invitation.status === 'accepted' && (
        <div className="invitation-actions">
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="invitation-remove-button"
          >
            🚫 Quitar
          </button>
        </div>
      )}
    </div>
  );
});
InvitationItem.displayName = 'InvitationItem';

const CompetitionGroupItem = React.memo<{
  group: any;
  colors: typeof colors;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}>(({ group, colors, onView, onEdit, onDelete, isDeleting }) => (
  <div className="competition-group-item">
    <div style={{ flex: 1, minWidth: 0 }}>
      <h3 style={{ margin: 0, color: colors.light, fontSize: '1.1rem', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
        {group.name}
      </h3>
      {group.description && (
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7, color: colors.light, marginBottom: '0.5rem', wordBreak: 'break-word' }}>
          {group.description.substring(0, 100)}{group.description.length > 100 ? '...' : ''}
        </p>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        {group.training_location && (
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(30,136,229,0.15)', border: '1px solid rgba(30,136,229,0.3)', borderRadius: '8px', color: '#fff', wordBreak: 'break-word' }}>
            📍 {group.training_location}
          </span>
        )}
        {group.cost_amount && (
          <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: '#fff' }}>
            💰 ${group.cost_amount} {group.cost_type === 'monthly' ? '/mes' : group.cost_type === 'per_session' ? '/sesión' : '/paquete'}
          </span>
        )}
      </div>
    </div>
    <div className="competition-group-actions">
      <button onClick={onView} className="competition-group-view-button">
        Ver
      </button>
      <button onClick={onEdit} className="competition-group-edit-button">
        Editar
      </button>
      <button onClick={onDelete} disabled={isDeleting} className="competition-group-delete-button">
        Eliminar
      </button>
    </div>
  </div>
));
CompetitionGroupItem.displayName = 'CompetitionGroupItem';

const AcademyItem = React.memo<{ academy: any }>(({ academy }) => {
  const academyData = React.useMemo(() => ({
    id: academy.academy_id,
    nombre_publico: academy.academy_name,
    bio: academy.academy_bio || '',
    avatar_url: academy.academy_avatar || null,
    portada_url: academy.academy_portada || null,
    ritmos: Array.isArray(academy.academy_ritmos) ? academy.academy_ritmos : [],
    zonas: Array.isArray(academy.academy_zonas) ? academy.academy_zonas : [],
    media: academy.academy_portada 
      ? [{ url: academy.academy_portada, type: 'image', slot: 'cover' }]
      : academy.academy_avatar 
      ? [{ url: academy.academy_avatar, type: 'image', slot: 'avatar' }]
      : []
  }), [academy]);
  
  return (
    <React.Suspense fallback={<div role="status">Cargando...</div>}>
      <AcademyCard item={academyData} />
    </React.Suspense>
  );
});
AcademyItem.displayName = 'AcademyItem';

const formatDateOrDay = (fecha?: string, diaSemana?: number | null, diasSemana?: Array<string | number> | null) => {
  if (fecha) {
    try {
      // Parsear fecha como hora local para evitar problemas de zona horaria
      const fechaOnly = fecha.includes('T') ? fecha.split('T')[0] : fecha;
      const [year, month, day] = fechaOnly.split('-').map(Number);
      if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
        const parsed = new Date(year, month - 1, day);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[TeacherProfileEditor] Error formatting date:', e);
      }
    }
  }
  // Si tiene múltiples días (diasSemana), formatear todos
  if (diasSemana && Array.isArray(diasSemana) && diasSemana.length > 0) {
    const dayNameMap: Record<string, string> = {
      'domingo': 'Domingo', 'dom': 'Domingo',
      'lunes': 'Lunes', 'lun': 'Lunes',
      'martes': 'Martes', 'mar': 'Martes',
      'miércoles': 'Miércoles', 'miercoles': 'Miércoles', 'mié': 'Miércoles', 'mie': 'Miércoles',
      'jueves': 'Jueves', 'jue': 'Jueves',
      'viernes': 'Viernes', 'vie': 'Viernes',
      'sábado': 'Sábado', 'sabado': 'Sábado', 'sáb': 'Sábado', 'sab': 'Sábado',
    };
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasLegibles = diasSemana.map((d: string | number) => {
      if (typeof d === 'number' && d >= 0 && d <= 6) {
        return dayNames[d];
      }
      if (typeof d === 'string') {
        return dayNameMap[d.toLowerCase()] || d;
      }
      return null;
    }).filter((d: string | null) => d !== null);
    return diasLegibles.length > 0 ? diasLegibles.join(', ') : null;
  }
  // Si tiene un solo día (diaSemana)
  if (typeof diaSemana === 'number' && diaSemana >= 0 && diaSemana <= 6) {
    return dayNames[diaSemana];
  }
  return null;
};

export default function TeacherProfileEditor() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: teacher, isLoading, refetch: refetchTeacher } = useTeacherMy();
  const { data: approvedRoles } = useMyApprovedRoles();
  const queryClient = useQueryClient();
  const { clearDraft } = useDrafts();
  const { data: allTags } = useTags();
  const { media, add, remove } = useTeacherMedia();
  const upsert = useUpsertTeacher();
  const [editingIndex, setEditingIndex] = React.useState<number|null>(null);
  const [editInitial, setEditInitial] = React.useState<any>(undefined);
  const [statusMsg, setStatusMsg] = React.useState<{ type: 'ok'|'err'; text: string }|null>(null);
  const [activeTab, setActiveTab] = React.useState<"perfil" | "metricas">("perfil");
  const [wasNewProfile, setWasNewProfile] = React.useState(false);
  const [previousApprovalStatus, setPreviousApprovalStatus] = React.useState<string | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = React.useState(false);

  // ⏳ Timeouts de seguridad para evitar loops eternos de carga (especialmente en WebView)
  const [authTimeoutReached, setAuthTimeoutReached] = React.useState(false);
  const [profileTimeoutReached, setProfileTimeoutReached] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      setAuthTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setAuthTimeoutReached(true);
    }, 15000); // 15s
    return () => window.clearTimeout(timer);
  }, [authLoading]);

  React.useEffect(() => {
    if (!isLoading) {
      setProfileTimeoutReached(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setProfileTimeoutReached(true);
    }, 15000); // 15s
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  // Scroll al top cuando cambia la pestaña
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Detectar cuando el perfil es aprobado y mostrar mensaje de bienvenida
  React.useEffect(() => {
    if (!teacher) {
      // Inicializar el estado cuando no hay perfil
      if (previousApprovalStatus === null) {
        setPreviousApprovalStatus(null);
      }
      return;
    }

    const currentStatus = (teacher as any)?.estado_aprobacion;
    
    // Inicializar el estado anterior si es la primera vez que tenemos datos
    if (previousApprovalStatus === null && currentStatus) {
      setPreviousApprovalStatus(currentStatus);
      return;
    }
    
    // Si el estado anterior era "en_revision" o "borrador" y ahora es "aprobado"
    if (
      previousApprovalStatus && 
      (previousApprovalStatus === 'en_revision' || previousApprovalStatus === 'borrador') &&
      currentStatus === 'aprobado' &&
      previousApprovalStatus !== currentStatus
    ) {
      setStatusMsg({ 
        type: 'ok', 
        text: '🎉 ¡Bienvenido, Maestro! Tu perfil ha sido aprobado. Ya puedes empezar a compartir tus clases.' 
      });
      setShowWelcomeBanner(true); // Mostrar banner de bienvenida
      setTimeout(() => setStatusMsg(null), 5000);
      // Ocultar el banner después de 10 segundos
      setTimeout(() => setShowWelcomeBanner(false), 10000);
    }

    // Actualizar el estado anterior
    if (currentStatus && currentStatus !== previousApprovalStatus) {
      setPreviousApprovalStatus(currentStatus);
    }
  }, [teacher, previousApprovalStatus]);

  // Memoize derived values early (before use in hooks)
  // Note: form is declared later, so we'll memoize profileId after form is available
  const teacherId = React.useMemo(() => (teacher as any)?.id, [teacher]);

  // Hooks para invitaciones
  const { data: invitations, isLoading: loadingInvitations, refetch: refetchInvitations } = useTeacherInvitations(teacherId);
  const { data: academies, refetch: refetchAcademies } = useTeacherAcademies(teacherId);
  const respondToInvitation = useRespondToInvitation();
  const removeInvitation = useRemoveInvitation();
  
  // Hooks para grupos de competencia
  const { data: myCompetitionGroups, isLoading: loadingGroups, refetch: refetchGroups } = useMyCompetitionGroups();
  const deleteGroup = useDeleteCompetitionGroup();

  // Handlers para invitaciones (movidos fuera de función condicional)
  const handleAcceptInvitation = React.useCallback(
    async (invitationId: number) => {
      try {
        await respondToInvitation.mutateAsync({
          invitationId,
          status: 'accepted'
        });
        setStatusMsg({ type: 'ok', text: '✅ Invitación aceptada' });
        setTimeout(() => setStatusMsg(null), 3000);
        setTimeout(async () => {
          await refetchInvitations();
          await refetchAcademies();
        }, 500);
      } catch (error: any) {
        setStatusMsg({ type: 'err', text: `❌ ${error.message}` });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    },
    [respondToInvitation, refetchInvitations, refetchAcademies, setStatusMsg],
  );

  const handleRejectInvitation = React.useCallback(
    async (invitationId: number) => {
      try {
        await respondToInvitation.mutateAsync({
          invitationId,
          status: 'rejected'
        });
        setStatusMsg({ type: 'ok', text: 'Invitación rechazada' });
        setTimeout(() => setStatusMsg(null), 3000);
      } catch (error: any) {
        setStatusMsg({ type: 'err', text: `❌ ${error.message}` });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    },
    [respondToInvitation, setStatusMsg],
  );

  const handleRemoveInvitation = React.useCallback(
    async (invitationId: number) => {
      if (!confirm('¿Estás seguro de que quieres dejar de aparecer en esta academia?')) {
        return;
      }
      try {
        await removeInvitation.mutateAsync(invitationId);
        setStatusMsg({ type: 'ok', text: '✅ Ya no apareces en esta academia' });
        setTimeout(() => setStatusMsg(null), 3000);
        setTimeout(async () => {
          await refetchInvitations();
          await refetchAcademies();
        }, 500);
      } catch (error: any) {
        setStatusMsg({ type: 'err', text: `❌ ${error.message}` });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    },
    [removeInvitation, refetchInvitations, refetchAcademies, setStatusMsg],
  );

  // Handlers para grupos de competencia (movidos fuera de función condicional)
  const handleViewGroup = React.useCallback((groupId: string) => {
    navigate(`/competition-groups/${groupId}`);
  }, [navigate]);

  const handleEditGroup = React.useCallback((groupId: string) => {
    navigate(`/competition-groups/${groupId}/edit`);
  }, [navigate]);

  const handleDeleteGroup = React.useCallback(async (groupId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
      return;
    }
    try {
      await deleteGroup.mutateAsync(groupId);
      setStatusMsg({ type: 'ok', text: '✅ Grupo eliminado exitosamente' });
      setTimeout(() => setStatusMsg(null), 3000);
      await refetchGroups();
    } catch (error: any) {
      setStatusMsg({ type: 'err', text: `❌ Error: ${error.message}` });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }, [deleteGroup, refetchGroups, setStatusMsg]);

  const ownedGroups = React.useMemo(() => 
    (myCompetitionGroups || []).filter((g: any) => g.owner_id === user?.id),
    [myCompetitionGroups, user?.id]
  );

  // Hook para cambio de rol
  useRoleChange();

  // Sin logs: solo dependencias para futuras extensiones
  React.useEffect(() => {
    if (!teacherId) return;
  }, [teacherId, academies]);

  const { form, setField, setNested, setAll } = useHydratedForm({
    draftKey: getDraftKey(user?.id, 'teacher'),
    serverData: teacher,
    defaults: {
      nombre_publico: "",
      bio: "",
      whatsapp_number: "",
      whatsapp_message_template: "me interesa la clase: {nombre}",
      ritmos_seleccionados: [] as string[],
      ritmos: [] as number[],
      zonas: [] as number[],
      cronograma: [] as any[],
      costos: [] as any[],
      promociones: [] as any[],
      ubicaciones: [] as any[],
      redes_sociales: {
        instagram: "",
        facebook: "",
        whatsapp: "",
        tiktok: "",
        youtube: "",
        email: "",
        web: "",
        telegram: ""
      },
      respuestas: {
        redes: {
          instagram: "",
          facebook: "",
          whatsapp: "",
          tiktok: "",
          youtube: "",
          email: "",
          web: "",
          telegram: ""
        },
        dato_curioso: "",
        gusta_bailar: ""
      },
      faq: [] as any[],
      reseñas: [] as any[],
      cuenta_bancaria: {} as BankAccountData
    } as any
  });

  // Asegurar que todas las clases tengan un ID único (solo una vez al cargar)
  const hasEnsuredIds = React.useRef(false);
  React.useEffect(() => {
    if (hasEnsuredIds.current) return; // Ya se aseguraron los IDs
    const cronograma = (form as any)?.cronograma;
    if (Array.isArray(cronograma) && cronograma.length > 0 && (form as any)?.id) {
      const needsUpdate = cronograma.some((it: any) => !it.id || typeof it.id !== 'number');
      if (needsUpdate) {
        hasEnsuredIds.current = true;
        const updatedCrono = cronograma.map((it: any) => ({
          ...it,
          id: ensureClassId(it)
        }));
        setField('cronograma' as any, updatedCrono as any);
        // Actualizar también en la base de datos silenciosamente
        const payload: any = { id: (form as any)?.id, cronograma: updatedCrono };
        upsert.mutateAsync(payload).catch((e) => {
          if (process.env.NODE_ENV === 'development') {
            console.error('[TeacherProfileEditor] Error actualizando IDs de clases', e);
          }
          hasEnsuredIds.current = false; // Reset si falla para intentar de nuevo
        });
      } else {
        hasEnsuredIds.current = true; // Todas las clases ya tienen IDs
      }
    }
  }, [teacher, (form as any)?.cronograma, (form as any)?.id, setField, upsert]);

  // Memoize profileId after form is available
  const profileId = React.useMemo(() => (form as any)?.id, [form]);

  const supportsPromotions = React.useMemo(() => {
    if (typeof (form as any)?.promociones !== 'undefined') return true;
    if (teacher) {
      return Object.prototype.hasOwnProperty.call(teacher, 'promociones');
    }
    return false;
  }, [teacher, (form as any)?.promociones]);

  // Clases desde useLiveClasses para tabs (solo si ya existe perfil)
  const teacherNumericId = React.useMemo(() => (teacher as any)?.id as number | undefined, [teacher]);
  const { data: classesFromTables, isLoading: classesLoading } = useLiveClasses(
    teacherNumericId ? { teacherId: teacherNumericId } : undefined
  );

  const handleSave = React.useCallback(async () => {
    try {
      // Detectar si es un perfil nuevo antes de guardar
      const isNewProfile = !teacher;
      setWasNewProfile(isNewProfile);
      
      const selectedCatalogIds = ((form as any)?.ritmos_seleccionados || []) as string[];
      
      // Validar zonas contra el catálogo
      const validatedZonas = validateZonasAgainstCatalog((form as any).zonas || [], allTags);

      // Crear payload limpio con SOLO los campos que existen en profiles_teacher
      const payload: any = {
        nombre_publico: form.nombre_publico,
        bio: form.bio,
        zonas: validatedZonas,
        whatsapp_number: (form as any).whatsapp_number || null,
        whatsapp_message_template: (form as any).whatsapp_message_template || 'me interesa la clase: {nombre}',
        ubicaciones: (form as any).ubicaciones || [],
        cronograma: (form as any).cronograma || [],
        costos: (form as any).costos || [],
        redes_sociales: form.redes_sociales,
        reseñas: (form as any).reseñas || [],
        cuenta_bancaria: (form as any).cuenta_bancaria || {},
        estado_aprobacion: 'aprobado'  // Marcar como aprobado al guardar
      };

      if (supportsPromotions) {
        payload.promociones = (form as any).promociones || [];
      }

      // Agregar ritmos_seleccionados solo si hay selección
      if (selectedCatalogIds && selectedCatalogIds.length > 0) {
        payload.ritmos_seleccionados = selectedCatalogIds;
      }

      // Solo incluir id si existe (para updates)
      if (profileId) {
        payload.id = profileId;
      }

      const savedProfile = await upsert.mutateAsync(payload);
      
      // Refetch explícito para actualizar el estado inmediatamente
      const refetched = await refetchTeacher();
      
      // Sincronizar el formulario con los datos actualizados del servidor
      if (refetched.data || savedProfile) {
        const updatedData = (refetched.data || savedProfile) as any;
        // Limpiar el borrador después de guardar exitosamente
        const draftKey = getDraftKey(user?.id, 'teacher');
        clearDraft(draftKey);
        
        // Actualizar el form con los datos del servidor
        setAll(updatedData);
      }

      // Invalidar queries de media para asegurar que las fotos se recarguen
      queryClient.invalidateQueries({ queryKey: ["teacher", "media", (savedProfile as any)?.id || teacher?.id] });
      queryClient.invalidateQueries({ queryKey: ["teacher", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["teacher"] });
      
      // Mostrar mensaje de éxito con mensaje especial para perfiles nuevos
      if (isNewProfile) {
        setStatusMsg({ 
          type: 'ok', 
          text: '🎉 ¡Bienvenido, Maestro! Tu perfil ha sido creado exitosamente. Ya puedes empezar a compartir tus clases.' 
        });
      } else {
        setStatusMsg({ type: 'ok', text: '✅ Perfil guardado exitosamente' });
      }
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("❌ [teacherProfileEditor] Error guardando:", error);
      }
      setStatusMsg({ type: 'err', text: '❌ Error al guardar el perfil' });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  }, [form, teacher, allTags, profileId, supportsPromotions, upsert, refetchTeacher, setAll, user?.id, queryClient, clearDraft]);

  const toggleRitmo = React.useCallback((ritmoId: number) => {
    const current = (form as any).ritmos || [];
    const next = current.includes(ritmoId)
      ? current.filter((id: number) => id !== ritmoId)
      : [...current, ritmoId];
    setField('ritmos' as any, next as any);
  }, [form, setField]);

  const toggleZona = React.useCallback((zonaId: number) => {
    const currentZonas = (form as any).zonas || [];
    const newZonas = currentZonas.includes(zonaId)
      ? currentZonas.filter((id: number) => id !== zonaId)
      : [...currentZonas, zonaId];
    setField('zonas' as any, newZonas as any);
  }, [form, setField]);

  const autoSavePromociones = React.useCallback(async (items: any[]) => {
    setField('promociones' as any, items as any);
    if (!profileId) {
      setStatusMsg({ type: 'err', text: '💾 Guarda el perfil una vez para activar las promociones' });
      setTimeout(() => setStatusMsg(null), 3200);
      return;
    }
    try {
      await upsert.mutateAsync({ id: profileId, promociones: items });
      setStatusMsg({ type: 'ok', text: '✅ Promociones guardadas automáticamente' });
      setTimeout(() => setStatusMsg(null), 2500);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[TeacherProfileEditor] Error al guardar promociones auto', error);
      }
      setStatusMsg({ type: 'err', text: '❌ No se pudieron guardar las promociones' });
      setTimeout(() => setStatusMsg(null), 3200);
    }
  }, [profileId, setField, upsert]);

  const autoSaveClasses = React.useCallback(
    async (cronogramaItems: any[], costosItems: any[], successText: string) => {
      if (!profileId) {
        setStatusMsg({ type: 'err', text: '💾 Guarda el perfil una vez para activar el guardado de clases' });
        setTimeout(() => setStatusMsg(null), 3200);
        return;
      }
      try {
        await upsert.mutateAsync({
          id: profileId,
          cronograma: cronogramaItems,
          costos: costosItems,
        });
        setStatusMsg({ type: 'ok', text: successText });
        setTimeout(() => setStatusMsg(null), 2400);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[TeacherProfileEditor] Error guardando clases', error);
        }
        setStatusMsg({ type: 'err', text: '❌ No se pudieron guardar las clases' });
        setTimeout(() => setStatusMsg(null), 3200);
        throw error;
      }
    },
    [profileId, upsert],
  );

  // Handlers para editar/eliminar clases (movidos fuera de función condicional)
  const handleClassEdit = React.useCallback((idx: number, it: any, costo: any) => {
    setEditingIndex(idx);
    const dayNameToNumber = (dayName: string | number): number | null => {
      if (typeof dayName === 'number') return dayName;
      const normalized = String(dayName).toLowerCase().trim();
      const map: Record<string, number> = {
        'domingo': 0, 'dom': 0, 'lunes': 1, 'lun': 1, 'martes': 2, 'mar': 2,
        'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3, 'jueves': 4, 'jue': 4,
        'viernes': 5, 'vie': 5, 'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6,
      };
      return map[normalized] ?? null;
    };
    setEditInitial({
      nombre: it.titulo || '',
      tipo: (costo?.tipo as any) || 'clases sueltas',
      precio: costo?.precio !== undefined && costo?.precio !== null ? costo.precio : null,
      regla: costo?.regla || '',
      nivel: (it as any)?.nivel ?? null,
      descripcion: (it as any)?.descripcion || '',
      fechaModo: (it as any)?.fechaModo || (it.fecha ? 'especifica' : ((it.diaSemana !== null && it.diaSemana !== undefined) || ((it as any)?.diasSemana && Array.isArray((it as any).diasSemana) && (it as any).diasSemana.length > 0) ? 'semanal' : 'por_agendar')),
      fecha: it.fecha || '',
      diaSemana: (it as any)?.diaSemana ?? null,
      diasSemana: ((it as any)?.diasSemana && Array.isArray((it as any).diasSemana) && (it as any).diasSemana.length > 0) 
        ? (it as any).diasSemana.map((d: string | number) => dayNameToNumber(d)).filter((d: number | null) => d !== null) as number[]
        : ((it as any)?.diaSemana !== null && (it as any)?.diaSemana !== undefined ? [(it as any).diaSemana] : []),
      horarioModo: (it as any)?.horarioModo || ((it as any)?.fechaModo === 'por_agendar' ? 'duracion' : ((it as any)?.duracionHoras ? 'duracion' : 'especifica')),
      inicio: it.inicio || '',
      fin: it.fin || '',
      duracionHoras: (it as any)?.duracionHoras ?? null,
      ritmoId: it.ritmoId ?? null,
      ritmoIds: it.ritmoIds ?? (typeof it.ritmoId === 'number' ? [it.ritmoId] : []),
      zonaId: it.zonaId ?? null,
      ubicacion: it.ubicacion || '',
      ubicacionId: (it as any)?.ubicacionId || null
    });
    setStatusMsg(null);
  }, [setEditingIndex, setEditInitial, setStatusMsg]);

  const handleClassDelete = React.useCallback((classId: number, refKey: string, cronograma: any[], costos: any[]) => {
    const ok = window.confirm('¿Eliminar esta clase? Esta acción no se puede deshacer.');
    if (!ok) return;

    const currentCrono = ([...cronograma] as any[]);
    const currentCostos = ([...costos] as any[]);

    const nextCrono = currentCrono.filter((it: any) => {
      const itId = ensureClassId(it);
      return itId !== classId;
    });
    const nextCostos = refKey
      ? currentCostos.filter((c: any) => {
          const cRef = (c?.referenciaCosto || c?.nombre || '').trim().toLowerCase();
          return cRef !== refKey;
        })
      : currentCostos;

    setField('cronograma' as any, nextCrono as any);
    setField('costos' as any, nextCostos as any);

    autoSaveClasses(nextCrono, nextCostos, '✅ Clase eliminada')
      .then(() => {
        if (editingIndex !== null) {
          const editingClassId = ensureClassId(cronograma[editingIndex]);
          if (editingClassId === classId) {
            setEditingIndex(null);
            setEditInitial(undefined);
          }
        }
      });
  }, [setField, autoSaveClasses, editingIndex, setEditingIndex, setEditInitial]);

  // Handlers para CrearClase component
  const handleClassCancel = React.useCallback(() => {
    setEditingIndex(null);
    setEditInitial(undefined);
    setStatusMsg(null);
  }, [setEditingIndex, setEditInitial, setStatusMsg]);

  const handleClassSubmit = React.useCallback((c: any) => {
    const currentCrono = ([...((form as any).cronograma || [])] as any[]);
    const currentCostos = ([...((form as any).costos || [])] as any[]);

    if (editingIndex !== null && editingIndex >= 0 && editingIndex < currentCrono.length) {
      const prev = currentCrono[editingIndex];
      const prevNombre = (prev?.referenciaCosto || prev?.titulo || '') as string;

      let ubicacionStr = (
        [c.ubicacionNombre, c.ubicacionDireccion].filter(Boolean).join(' · ')
      ) + (c.ubicacionNotas ? ` (${c.ubicacionNotas})` : '');
      const match = c?.ubicacionId
        ? ((form as any).ubicaciones || []).find((u: any) => (u?.id || '') === c.ubicacionId)
        : undefined;
      if (!ubicacionStr.trim() && match) {
        ubicacionStr = ([match?.nombre, match?.direccion].filter(Boolean).join(' · ')) + (match?.referencias ? ` (${match.referencias})` : '');
      }

      const ritmoIds = c.ritmoIds && c.ritmoIds.length
        ? c.ritmoIds
        : (c.ritmoId !== null && c.ritmoId !== undefined ? [c.ritmoId] : (prev?.ritmoIds || []));
      const classId = ensureClassId(prev);
      
      const costoIdx = currentCostos.findIndex((x: any) => {
        if (x?.classId && x.classId === classId) return true;
        if (x?.referenciaCosto && Number(x.referenciaCosto) === classId) return true;
        if (x?.cronogramaIndex !== null && x?.cronogramaIndex !== undefined && x.cronogramaIndex === editingIndex) return true;
        return (x?.nombre || '').trim().toLowerCase() === (prevNombre || '').trim().toLowerCase();
      });
      
      const costoId = costoIdx >= 0 && currentCostos[costoIdx]?.id 
        ? currentCostos[costoIdx].id 
        : Date.now();
      const updatedCosto = {
        id: costoId,
        nombre: c.nombre,
        tipo: c.tipo,
        precio: c.precio !== null && c.precio !== undefined ? (c.precio === 0 ? 0 : c.precio) : null,
        regla: c.regla || '',
        classId: classId,
        referenciaCosto: String(classId),
        cronogramaIndex: editingIndex
      } as any;
      if (costoIdx >= 0) currentCostos[costoIdx] = updatedCosto; else currentCostos.push(updatedCosto);
      
      const updatedItem = {
        ...prev,
        id: classId,
        tipo: 'clase',
        titulo: c.nombre,
        descripcion: c.descripcion || undefined,
        fechaModo: c.fechaModo || (c.fecha ? 'especifica' : ((c.diaSemana !== null && c.diaSemana !== undefined) || (c.diasSemana && c.diasSemana.length > 0) ? 'semanal' : undefined)),
        fecha: c.fechaModo === 'especifica' ? c.fecha : (c.fechaModo === 'por_agendar' ? undefined : undefined),
        diaSemana: c.fechaModo === 'semanal' ? ((c.diasSemana && c.diasSemana.length > 0) ? c.diasSemana[0] : c.diaSemana) : (c.fechaModo === 'por_agendar' ? null : null),
        diasSemana: c.fechaModo === 'semanal' && c.diasSemana && c.diasSemana.length > 0 ? (() => {
          const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return c.diasSemana.map((dia: number) => dayNames[dia] || null).filter((d: string | null) => d !== null);
        })() : (c.fechaModo === 'semanal' && c.diaSemana !== null && c.diaSemana !== undefined ? (() => {
          const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return [dayNames[c.diaSemana]] as string[];
        })() : undefined),
        recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
        horarioModo: c.fechaModo === 'por_agendar' ? 'duracion' : (c.horarioModo || (c.duracionHoras ? 'duracion' : 'especifica')),
        inicio: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.inicio),
        fin: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.fin),
        duracionHoras: c.fechaModo === 'por_agendar' ? c.duracionHoras : (c.horarioModo === 'duracion' ? c.duracionHoras : undefined),
        nivel: c.nivel || undefined,
        referenciaCosto: String(classId),
        costo: updatedCosto,
        ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
        ritmoIds,
        zonaId: c.zonaId,
        ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
        ubicacionId: c.ubicacionId || (match?.id || null)
      };
      currentCrono[editingIndex] = updatedItem;

      setField('cronograma' as any, currentCrono as any);
      setField('costos' as any, currentCostos as any);

      return autoSaveClasses(currentCrono, currentCostos, '✅ Clase actualizada')
        .then(() => {
          setEditingIndex(null);
          setEditInitial(undefined);
        });
    } else {
      let ubicacionStr = (
        [c.ubicacionNombre, c.ubicacionDireccion].filter(Boolean).join(' · ')
      ) + (c.ubicacionNotas ? ` (${c.ubicacionNotas})` : '');
      const match = c?.ubicacionId
        ? ((form as any).ubicaciones || []).find((u: any) => (u?.id || '') === c.ubicacionId)
        : undefined;
      if (!ubicacionStr.trim() && match) {
        ubicacionStr = ([match?.nombre, match?.direccion].filter(Boolean).join(' · ')) + (match?.referencias ? ` (${match.referencias})` : '');
      }

      const ritmoIds = c.ritmoIds && c.ritmoIds.length
        ? c.ritmoIds
        : (c.ritmoId !== null && c.ritmoId !== undefined ? [c.ritmoId] : []);
      const newClassId = generateClassId();
      const newClassIndex = currentCrono.length;
      
      const newCosto = {
        id: Date.now(),
        nombre: c.nombre,
        tipo: c.tipo,
        precio: c.precio !== null && c.precio !== undefined ? (c.precio === 0 ? 0 : c.precio) : null,
        regla: c.regla || '',
        classId: newClassId,
        referenciaCosto: String(newClassId),
        cronogramaIndex: newClassIndex
      } as any;
      
      const nextCrono = ([...currentCrono, {
        id: newClassId,
        tipo: 'clase',
        titulo: c.nombre,
        descripcion: c.descripcion || undefined,
        fechaModo: c.fechaModo || (c.fecha ? 'especifica' : ((c.diaSemana !== null && c.diaSemana !== undefined) || (c.diasSemana && c.diasSemana.length > 0) ? 'semanal' : undefined)),
        fecha: c.fechaModo === 'especifica' ? c.fecha : (c.fechaModo === 'por_agendar' ? undefined : undefined),
        diaSemana: c.fechaModo === 'semanal' ? ((c.diasSemana && c.diasSemana.length > 0) ? c.diasSemana[0] : c.diaSemana) : (c.fechaModo === 'por_agendar' ? null : null),
        diasSemana: c.fechaModo === 'semanal' && c.diasSemana && c.diasSemana.length > 0 ? (() => {
          const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return c.diasSemana.map((dia: number) => dayNames[dia] || null).filter((d: string | null) => d !== null);
        })() : (c.fechaModo === 'semanal' && c.diaSemana !== null && c.diaSemana !== undefined ? (() => {
          const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
          return [dayNames[c.diaSemana]] as string[];
        })() : undefined),
        recurrente: c.fechaModo === 'semanal' ? 'semanal' : undefined,
        horarioModo: c.fechaModo === 'por_agendar' ? 'duracion' : (c.horarioModo || (c.duracionHoras ? 'duracion' : 'especifica')),
        inicio: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.inicio),
        fin: c.fechaModo === 'por_agendar' ? undefined : (c.horarioModo === 'duracion' ? undefined : c.fin),
        duracionHoras: c.fechaModo === 'por_agendar' ? c.duracionHoras : (c.horarioModo === 'duracion' ? c.duracionHoras : undefined),
        nivel: c.nivel || undefined,
        referenciaCosto: String(newClassId),
        costo: newCosto,
        ritmoId: ritmoIds.length ? ritmoIds[0] ?? null : null,
        ritmoIds,
        zonaId: c.zonaId,
        ubicacion: (ubicacionStr && ubicacionStr.trim()) || c.ubicacion || ((form as any).ubicaciones || [])[0]?.nombre || '',
        ubicacionId: c.ubicacionId || (match?.id || null)
      }] as any);
      const nextCostos = ([...currentCostos, newCosto] as any);
      setField('cronograma' as any, nextCrono as any);
      setField('costos' as any, nextCostos as any);

      return autoSaveClasses(nextCrono, nextCostos, '✅ Clase creada');
    }
  }, [form, editingIndex, setField, autoSaveClasses, ensureClassId, generateClassId, setEditingIndex, setEditInitial]);

  const uploadFile = React.useCallback(async (file: File, slot: string) => {
    try {
      await add.mutateAsync({ file, slot });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error uploading file:', error);
      }
    }
  }, [add]);

  const removeFile = React.useCallback(async (slot: string) => {
    try {
      const mediaItem = getMediaBySlot(media as unknown as MediaSlotItem[], slot);
      if (mediaItem && 'id' in mediaItem) {
        await remove.mutateAsync((mediaItem as any).id);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error removing file:', error);
      }
    }
  }, [media, remove]);

  // Memoize ritmos/zonas for CrearClase
  const ritmosForCrearClase = React.useMemo(() => {
    const ritmoTags = (allTags || []).filter((t: any) => t.tipo === 'ritmo');
    const labelByCatalogId = new Map<string, string>();
    RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
    const localSelected: string[] = ((form as any)?.ritmos_seleccionados || []) as string[];
    if (Array.isArray(localSelected) && localSelected.length > 0) {
      const localLabels = new Set(localSelected.map(id => labelByCatalogId.get(id)).filter(Boolean));
      const filtered = ritmoTags.filter((t: any) => localLabels.has(t.nombre));
      if (filtered.length > 0) return filtered.map((t: any) => ({ id: t.id, nombre: t.nombre }));
    }
    return ritmoTags.map((t: any) => ({ id: t.id, nombre: t.nombre }));
  }, [allTags, form]);

  const zonasForCrearClase = React.useMemo(() => 
    (allTags || []).filter((t: any) => t.tipo === 'zona').map((t: any) => ({ id: t.id, nombre: t.nombre })),
    [allTags]
  );

  const zonaTagsForCrearClase = React.useMemo(() => 
    (allTags || []).filter((t: any) => t.tipo === 'zona'),
    [allTags]
  );

  const locationsForCrearClase = React.useMemo(() => 
    ((form as any).ubicaciones || []).map((u: any, i: number) => ({
      id: u?.id || String(i),
      nombre: u?.nombre,
      direccion: u?.direccion,
      referencias: u?.referencias,
      zonas: u?.zonaIds || u?.zonas || (typeof u?.zona_id === 'number' ? [u.zona_id] : []),
    })),
    [(form as any).ubicaciones]
  );

  // Callbacks for handlers
  const handleTabChange = React.useCallback((tab: "perfil" | "metricas") => {
    setActiveTab(tab);
  }, []);

  const handleBack = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCreateGroup = React.useCallback(() => {
    navigate('/competition-groups/new');
  }, [navigate]);

  // Memoize derived values (moved here to avoid duplicate declarations)
  // Note: teacherId and profileId are already memoized above before hooks

  // ✅ Esperar a que auth termine de cargar antes de renderizar
  if (authLoading && !authTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <div className="loading-icon">⏳</div>
          <p style={{ marginBottom: '8px' }}>Estamos cargando tu sesión...</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
        </div>
      </>
    );
  }

  // ⛔ Si la sesión nunca termina de cargar
  if (authLoading && authTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <p style={{ marginBottom: '12px' }}>
            No pudimos cargar tu sesión. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
        </div>
      </>
    );
  }

  // ✅ Si no hay usuario después de que auth termine, mostrar mensaje
  if (!user) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="error-screen">
          <div className="loading-icon">🔒</div>
          <p>No has iniciado sesión</p>
        </div>
      </>
    );
  }

  // ✅ Esperar a que el perfil cargue
  if (isLoading && !profileTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="loading-screen">
          <div className="loading-icon">⏳</div>
          <p style={{ marginBottom: '8px' }}>Estamos cargando tu perfil de maestro...</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            Si tarda mucho, intenta refrescar la página para una carga más rápida.
          </p>
        </div>
      </>
    );
  }

  // ⛔ Si el perfil nunca termina de cargar
  if (isLoading && profileTimeoutReached) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="error-screen">
          <div className="error-icon">⚠️</div>
          <p style={{ marginBottom: '12px' }}>
            No pudimos cargar el perfil del maestro. Revisa tu conexión e inténtalo de nuevo.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="retry-button">
            Reintentar
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="academy-editor-container org-editor" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="academy-editor-inner">
        {/* Header con botón volver + título centrado + toggle (diseño organizer) */}
        <div className="org-editor__header">
          <button className="org-editor__back" onClick={handleBack} aria-label="Volver">← Volver</button>
          <h1 className="org-editor__title">✏️ Editar Maestro</h1>
          <div style={{ width: 100 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          <ProfileNavigationToggle
            currentView="edit"
            profileType="teacher"
            onSave={handleSave}
            isSaving={upsert.isPending}
            saveDisabled={!form.nombre_publico?.trim()}
            editHref="/profile/teacher/edit"
            liveHref="/profile/teacher"
          />
        </div>

        {/* Tabs Perfil / Métricas */}
        <div className="teacher-tabs" role="tablist" aria-label="Secciones del editor">
          <button
            className="teacher-tab-button"
            role="tab"
            aria-selected={activeTab === "perfil"}
            aria-controls="tabpanel-perfil"
            id="tab-perfil"
            onClick={() => handleTabChange("perfil")}
          >
            📝 Perfil
          </button>
          <button
            className="teacher-tab-button"
            role="tab"
            aria-selected={activeTab === "metricas"}
            aria-controls="tabpanel-metricas"
            id="tab-metricas"
            onClick={() => handleTabChange("metricas")}
          >
            📊 Métricas clases
          </button>
        </div>

        {activeTab === "metricas" && teacherId && (
          <div role="tabpanel" id="tabpanel-metricas" aria-labelledby="tab-metricas">
            <React.Suspense fallback={<div role="status" aria-live="polite">Cargando métricas...</div>}>
          <TeacherMetricsPanel teacherId={teacherId} />
            </React.Suspense>
          </div>
        )}

        {activeTab === "perfil" && (
          <div role="tabpanel" id="tabpanel-perfil" aria-labelledby="tab-perfil">

        {/* Mensaje de estado global */}
        {statusMsg && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`status-banner status-banner--${statusMsg.type}`}
          >
            {statusMsg.text}
          </motion.div>
        )}

        {/* Banner de Bienvenida (para perfiles nuevos o recién aprobados) */}
        {!isLoading && (!teacher || showWelcomeBanner) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="welcome-banner"
          >
            <div className="welcome-banner-icon">🎓</div>
            <h3 className="welcome-banner-title">
              ¡Bienvenido, Maestro!
            </h3>
            <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '1rem' }}>
              {showWelcomeBanner 
                ? <>Tu perfil ha sido aprobado. Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para actualizar tu perfil.</>
                : <>Completa tu información básica y haz clic en <strong>💾 Guardar</strong> arriba para crear tu perfil</>
              }
            </p>
            <div className="welcome-banner-badge">
              👆 Mínimo requerido: <strong>Nombre del Maestro</strong> y <strong>Ritmos</strong>
            </div>
          </motion.div>
        )}

        {/* Información Personal */}
        <div className="editor-section glass-card-container" style={{ marginBottom: '3rem' }}>
          <h2 className="editor-section-title">
            👤 Información Personal
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem',
            alignItems: 'start'
          }}
            className="info-redes-grid">
            {/* Columna 1: Información Básica */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="editor-field">
                  🎓 Nombre del Maestro *
                </label>
                <input
                  type="text"
                  value={form.nombre_publico}
                  onChange={(e) => setField('nombre_publico', e.target.value)}
                  placeholder="Ej: Maestro de Baile Moderno"
                  className="editor-input"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="editor-field">
                  📝 Descripción
                </label>
                <textarea
                  value={form.bio || ''}
                  onChange={(e) => setField('bio', e.target.value)}
                  placeholder="Cuéntanos sobre tus inicios dando clases, su historia, metodología y lo que la hace especial..."
                  rows={3}
                  className="editor-textarea"
                />
              </div>
            </div>

            {/* Columna 2: Redes Sociales Compactas */}
            <div className="profile-section-compact">
              {/* REDES SOCIALES */}
              <div className="row-bottom">
                <div className="row-bottom-header">
                  <h4 className="subtitle">Redes Sociales</h4>
                  <span className="tag">Opcional</span>
                </div>

                <div className="social-list">
                  <SocialFieldRow
                    icon={<FaInstagram size={18} />}
                    prefix="ig/"
                        name="instagram"
                        value={form.redes_sociales.instagram || ''}
                        placeholder="usuario"
                    onChange={(v) => setNested('redes_sociales.instagram', v)}
                  />
                  <SocialFieldRow
                    icon={<FaTiktok size={18} />}
                    prefix="@"
                        name="tiktok"
                        value={form.redes_sociales.tiktok || ''}
                        placeholder="usuario"
                    onChange={(v) => setNested('redes_sociales.tiktok', v)}
                  />
                  <SocialFieldRow
                    icon={<FaYoutube size={18} />}
                    prefix="yt/"
                        name="youtube"
                        value={form.redes_sociales.youtube || ''}
                        placeholder="canal o handle"
                    onChange={(v) => setNested('redes_sociales.youtube', v)}
                  />
                  <SocialFieldRow
                    icon={<FaFacebookF size={18} />}
                    prefix="fb/"
                        name="facebook"
                        value={form.redes_sociales.facebook || ''}
                        placeholder="usuario o página"
                    onChange={(v) => setNested('redes_sociales.facebook', v)}
                  />
                  <SocialFieldRow
                    icon={<FaWhatsapp size={18} />}
                    prefix="+52"
                        name="whatsapp"
                        value={form.redes_sociales.whatsapp || ''}
                        placeholder="55 1234 5678"
                    type="tel"
                    onChange={(v) => setNested('redes_sociales.whatsapp', v)}
                  />
                  <SocialFieldRow
                    icon={<span>📧</span>}
                    prefix="@"
                        name="email"
                        value={form.redes_sociales.email || ''}
                        placeholder="correo@ejemplo.com"
                    type="email"
                    onChange={(v) => setNested('redes_sociales.email', v)}
                  />
                  <SocialFieldRow
                    icon={<FaGlobe size={18} />}
                    prefix="https://"
                        name="web"
                        value={form.redes_sociales.web || ''}
                        placeholder="tusitio.com"
                    onChange={(v) => setNested('redes_sociales.web', v)}
                  />
                  <SocialFieldRow
                    icon={<FaTelegram size={18} />}
                    prefix="@"
                        name="telegram"
                        value={form.redes_sociales.telegram || ''}
                        placeholder="usuario o canal"
                    onChange={(v) => setNested('redes_sociales.telegram', v)}
                      />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de WhatsApp para Clases */}
        <div className="editor-section glass-card-container" style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #25D366, #128C7E)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}>
              💬
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="editor-section-title" style={{ marginBottom: '0.5rem', fontSize: '1.35rem' }}>
                WhatsApp para Clases
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                Configura el número y mensaje de WhatsApp que aparecerán en los botones de contacto de tus clases. 
                Usa <code style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>{'{nombre}'}</code> o{" "}
                <code style={{ background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: 4, fontSize: '0.85rem' }}>{'{clase}'}</code> para insertar automáticamente el nombre de la clase.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Número de WhatsApp */}
            <div>
              <label className="editor-field" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                📱 Número de WhatsApp
              </label>
              <div className="input-group" style={{ marginTop: 0 }}>
                <span className="prefix">+52</span>
                <input
                  type="tel"
                  value={(form as any).whatsapp_number || ''}
                  onChange={(e) => setField('whatsapp_number' as any, e.target.value)}
                  placeholder="55 1234 5678"
                  className="editor-input"
                  style={{ border: 'none', background: 'transparent', padding: '0.75rem', fontSize: '0.95rem' }}
                />
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.65, color: 'rgba(255,255,255,0.75)', lineHeight: '1.3' }}>
                Este número se usará para los botones de WhatsApp en tus clases
              </p>
            </div>

            {/* Mensaje Personalizado */}
            <div>
              <label className="editor-field" style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                ✉️ Mensaje Personalizado
              </label>
              <textarea
                value={(form as any).whatsapp_message_template || 'me interesa la clase: {nombre}'}
                onChange={(e) => setField('whatsapp_message_template' as any, e.target.value)}
                placeholder="me interesa la clase: {nombre}"
                className="editor-textarea"
                rows={2}
                style={{ marginTop: 0, fontSize: '0.95rem', padding: '0.75rem', minHeight: '60px' }}
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.65, color: 'rgba(255,255,255,0.75)', lineHeight: '1.3' }}>
                Se enviará como: "Hola vengo de Donde Bailar MX, [tu mensaje]"
              </p>
            </div>
          </div>
        </div>

        {/* Pagos / Stripe Payouts */}
        {approvedRoles?.approved?.includes('maestro') && user?.id && teacher && (
          <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              💸 Pagos y Cobros
            </h2>
            <StripePayoutSettings
              userId={user.id}
              roleType="maestro"
              stripeAccountId={teacher.stripe_account_id}
              stripeOnboardingStatus={teacher.stripe_onboarding_status}
              stripeChargesEnabled={teacher.stripe_charges_enabled}
              stripePayoutsEnabled={teacher.stripe_payouts_enabled}
            />
          </div>
        )}

        {/* Estilos & Zonas - tarjeta mejorada */}
        <div className="org-editor__card academy-editor-card" style={{ marginBottom: '3rem', position: 'relative', overflow: 'hidden', borderRadius: 16, border: '1px solid rgba(255,255,255,0.12)', background: 'linear-gradient(135deg, rgba(19,21,27,0.85), rgba(16,18,24,0.85))' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f093fb, #f5576c, #FFD166)' }} />

          {/* Contenedor de dos columnas: Ritmos y Zonas */}
          <div className="rhythms-zones-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.25rem' }}>
            {/* Columna 1: Ritmos */}
            <div>
              {/* Header Estilos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1E88E5,#7C4DFF)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(30,136,229,0.35)' }}>🎵</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Estilos que Enseñamos</h2>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Selecciona los ritmos que enseñas</div>
                </div>
              </div>

              {/* Catálogo agrupado */}
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Catálogo agrupado</div>
                {(() => {
                  let selectedCatalogIds = (((form as any)?.ritmos_seleccionados) || []) as string[];
                  if ((!selectedCatalogIds || selectedCatalogIds.length === 0) && Array.isArray((form as any)?.ritmos)) {
                    const labelToItemId = new Map<string, string>();
                    RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelToItemId.set(i.id, i.label)));
                    const names = ((form as any).ritmos as number[])
                      .map(id => (allTags || []).find((t: any) => t.id === id && t.tipo === 'ritmo')?.nombre)
                      .filter(Boolean) as string[];
                    const mapped = names
                      .map(n => {
                        for (const [itemId, label] of Array.from(labelToItemId.entries())) {
                          if (label === n) return itemId;
                        }
                        return undefined;
                      })
                      .filter(Boolean) as string[];
                    if (mapped.length > 0) selectedCatalogIds = mapped;
                  }
                  const onChangeCatalog = (ids: string[]) => {
                    setField('ritmos_seleccionados' as any, ids as any);
                    try {
                      const labelByCatalogId = new Map<string, string>();
                      RITMOS_CATALOG.forEach(g => g.items.forEach(i => labelByCatalogId.set(i.id, i.label)));
                      const nameToTagId = new Map<string, number>(
                        (allTags || []).filter((t: any) => t.tipo === 'ritmo').map((t: any) => [t.nombre, t.id])
                      );
                      const mappedTagIds = ids
                        .map(cid => labelByCatalogId.get(cid))
                        .filter(Boolean)
                        .map((label: any) => nameToTagId.get(label as string))
                        .filter((n): n is number => typeof n === 'number');
                      setField('ritmos', mappedTagIds as any);
                    } catch {}
                  };

                  return (
                    <RitmosChips selected={selectedCatalogIds} onChange={onChangeCatalog} />
                  );
                })()}
              </div>
            </div>

            {/* Columna 2: Zonas */}
            <div>
              {/* Header Zonas */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#1976D2,#00BCD4)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(25,118,210,0.35)' }}>🗺️</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#fff', textShadow: 'rgba(0, 0, 0, 0.8) 0px 2px 4px, rgba(0, 0, 0, 0.6) 0px 0px 8px, rgba(0, 0, 0, 0.8) -1px -1px 0px, rgba(0, 0, 0, 0.8) 1px -1px 0px, rgba(0, 0, 0, 0.8) -1px 1px 0px, rgba(0, 0, 0, 0.8) 1px 1px 0px' }}>Zonas</h2>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Indica las zonas donde opera la Maestro</div>
                </div>
              </div>

              {/* Chips Zonas */}
              <div className="academy-chips-container">
                <ZonaGroupedChips
                  selectedIds={(form as any).zonas}
                  allTags={allTags}
                  mode="edit"
                  onToggle={toggleZona}
                />
              </div>
            </div>
          </div>
        </div>

     

        {/* Horarios, Costos y Ubicación (unificado) */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            🗓️ Horarios, Costos y Ubicación
          </h2>

          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Ubicaciones */}
            <React.Suspense fallback={<div role="status" aria-live="polite">Cargando editor de ubicaciones...</div>}>
            <UbicacionesEditor
              value={(form as any).ubicaciones || []}
              onChange={(v) => setField('ubicaciones' as any, v as any)}
              title="Ubicaciones"
              allowedZoneIds={((form as any).zonas || []) as number[]}
            />
            </React.Suspense>
            {/* Crear Clase rápida */}
            <div>
              {statusMsg && (
                <div style={{
                  marginBottom: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: statusMsg.type === 'ok' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                  background: statusMsg.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: '#fff',
                  fontSize: 14
                }}>
                  {statusMsg.text}
                </div>
              )}

              {/* Mensaje si no tiene perfil guardado */}
              {!teacher && (
                <div style={{
                  padding: '1.5rem',
                  marginBottom: '1rem',
                  background: 'rgba(255, 140, 66, 0.15)',
                  border: '2px solid rgba(255, 140, 66, 0.3)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>
                    Debes guardar el perfil del maestro primero antes de crear clases
                  </p>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0.5rem 0 0 0' }}>
                    Completa el nombre del maestro y haz clic en 💾 Guardar arriba
                  </p>
                </div>
              )}

              {teacher && (
                <React.Suspense fallback={<div role="status" aria-live="polite">Cargando editor de clases...</div>}>
                <CrearClase
                    ritmos={ritmosForCrearClase}
                    zonas={zonasForCrearClase}
                    zonaTags={zonaTagsForCrearClase}
                selectedZonaIds={((form as any).zonas || []) as number[]}
                    locations={locationsForCrearClase}
                editIndex={editingIndex}
                editValue={editInitial}
                title={editingIndex !== null ? 'Editar Clase' : 'Crear Clase'}
                onCancel={handleClassCancel}
                onSubmit={handleClassSubmit}
                  />
                </React.Suspense>
              )}

              {teacher && Array.isArray((form as any)?.cronograma) && (form as any).cronograma.length > 0 && (() => {
                const cronograma = (form as any).cronograma;
                const costos = (form as any)?.costos || [];

                return (
                  <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
                    {cronograma.map((it: any) => {
                      const classId = ensureClassId(it);
                      const refKey = ((it?.referenciaCosto || it?.titulo || '') as string).trim().toLowerCase();
                      const costo = costos.find((c: any) => {
                        if (c?.classId && c.classId === classId) return true;
                        if (c?.referenciaCosto && Number(c.referenciaCosto) === classId) return true;
                        return (c?.nombre || '').trim().toLowerCase() === refKey;
                      });
                      const costoLabel = costo ? formatCurrency(costo.precio) : null;
                      const fechaLabel = formatDateOrDay(it.fecha, (it as any)?.diaSemana ?? null, (it as any)?.diasSemana ?? null);
                      const idx = cronograma.findIndex((item: any) => ensureClassId(item) === classId);
                      
                      return (
                        <ClassListItem
                          key={classId}
                          item={it}
                          costo={costo}
                          fechaLabel={fechaLabel}
                          costoLabel={costoLabel}
                          onEdit={() => handleClassEdit(idx, it, costo)}
                          onDelete={() => handleClassDelete(classId, refKey, cronograma, costos)}
                        />
                      );
                    })}
                </div>
                );
              })()}
            </div>

            {/* Vista previa dentro del mismo contenedor */}
            {/* <div style={{ padding: '1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span>👀</span>
                <strong style={{ color: '#fff' }}>Vista previa</strong>
              </div>
              <ClasesLive
                cronograma={(form as any)?.cronograma || []}
                costos={(form as any)?.costos || []}
                ubicacion={{
                  nombre: (form as any)?.ubicaciones?.[0]?.nombre,
                  direccion: (form as any)?.ubicaciones?.[0]?.direccion,
                  referencias: (form as any)?.ubicaciones?.[0]?.referencias,
                }}
              />
            </div> */}
          </div>
        </div>

        {/* Promociones y paquetes */}
        {supportsPromotions && (
          <div style={{ marginBottom: '3rem' }}>
            <React.Suspense fallback={<div role="status" aria-live="polite">Cargando editor de promociones...</div>}>
            <CostsPromotionsEditor
              value={(form as any).promociones || []}
              onChange={autoSavePromociones}
              label="💸 Promociones y Paquetes"
              helperText="Crea promociones especiales, paquetes de clases o descuentos con fecha de vigencia para tus estudiantes."
            />
            </React.Suspense>
          </div>
        )}

        {/* Academias donde enseño */}
        {teacherId && academies && academies.length > 0 && (
          <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              🎓 Doy clases en
            </h2>
            <div className="academies-grid">
              {academies.map((academy: any) => (
                <AcademyItem key={academy.academy_id} academy={academy} />
              ))}
            </div>
          </div>
        )}

        {/* Invitaciones de Academias */}
        {teacherId && (
          <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
              📨 Invitaciones de Academias
            </h2>
            {loadingInvitations ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.light }}>
                Cargando invitaciones...
              </div>
            ) : !invitations || invitations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.light, opacity: 0.7 }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>No tienes invitaciones pendientes</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Las academias pueden invitarte a colaborar con ellas
                </p>
              </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {invitations.map((inv: any) => (
                <InvitationItem
                  key={inv.id}
                  invitation={inv}
                  colors={colors}
                  onAccept={() => handleAcceptInvitation(Number(inv.id))}
                  onReject={() => handleRejectInvitation(Number(inv.id))}
                  onRemove={() => handleRemoveInvitation(Number(inv.id))}
                  isAccepting={respondToInvitation.isPending}
                  isRemoving={removeInvitation.isPending}
                />
              ))}
            </div>
          )}
          </div>
        )}

        {/* Grupos de Competencia */}
        {teacherId && (
          <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
            <div className="competition-group-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: colors.light, margin: 0 }}>
                🎯 Grupos de Competencia
              </h2>
              <button
                onClick={handleCreateGroup}
                className="create-group-button"
                aria-label="Crear nuevo grupo de competencia"
              >
                ➕ Crear Grupo
              </button>
            </div>

            {loadingGroups ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: colors.light }}>
                Cargando grupos...
              </div>
            ) : !myCompetitionGroups || myCompetitionGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: colors.light, opacity: 0.7 }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                <p>No has creado grupos de competencia aún</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Crea un grupo para organizar entrenamientos y competencias
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {ownedGroups.map((group: any) => (
                  <CompetitionGroupItem
                    key={group.id}
                    group={group}
                    colors={colors}
                    onView={() => handleViewGroup(group.id)}
                    onEdit={() => handleEditGroup(group.id)}
                    onDelete={() => handleDeleteGroup(group.id)}
                    isDeleting={deleteGroup.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Información para Estudiantes */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            💬 Información para Estudiantes
          </h2>

          <React.Suspense fallback={<div role="status" aria-live="polite">Cargando editor de FAQ...</div>}>
            <FAQEditor value={(form as any).faq || []} onChange={(v: any) => setField('faq' as any, v as any)} />
          </React.Suspense>
        </div>

        {/* Reseñas de Alumnos */}
       {/*  <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: colors.light }}>
            ⭐ Reseñas de Alumnos
          </h2>
          <p style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.72)', maxWidth: 560 }}>
            Añade testimonios de alumnos que han tomado clases contigo
          </p>
          <ReviewsEditor 
            value={(form as any).reseñas || []} 
            onChange={(v: any) => setField('reseñas' as any, v as any)} 
          />
        </div> */}

        {/* Cuenta Bancaria */}
        <div className="org-editor__card" style={{ marginBottom: '3rem' }}>
          <BankAccountEditor
            value={(form as any).cuenta_bancaria || {}}
            onChange={(v) => setField('cuenta_bancaria' as any, v as any)}
          />
        </div>

        {/* Gestión de Fotos - Dos Columnas */}
        <div className="photos-two-columns" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '3rem', alignItems: 'stretch' }}>
          {/* Columna 1: Avatar / Foto Principal */}
          <React.Suspense fallback={<div role="status" aria-live="polite">Cargando gestión de fotos...</div>}>
            <PhotoManagementSection
              media={media}
              uploading={{ p1: add.isPending }}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Gestión de Fotos"
              description="👤 Avatar / Foto Principal (p1)"
              slots={['p1']}
              isMainPhoto={true}
            />
          </React.Suspense>

          {/* Columna 2: Fotos Destacadas */}
          <React.Suspense fallback={<div role="status" aria-live="polite">Cargando gestión de fotos...</div>}>
            <PhotoManagementSection
              media={media}
              uploading={Object.fromEntries(['p2', 'p3'].map(slot => [slot, add.isPending]))}
              uploadFile={uploadFile}
              removeFile={removeFile}
              title="📷 Fotos Destacadas (p2 - p3)"
              description="Estas fotos se usan en las secciones destacadas de tu perfil"
              slots={['p2', 'p3']}
              isMainPhoto={false}
              verticalLayout={true}
            />
          </React.Suspense>
        </div>

        {/* Fotos Adicionales */}
        <React.Suspense fallback={<div role="status" aria-live="polite">Cargando gestión de fotos...</div>}>
          <PhotoManagementSection
            media={media}
            uploading={Object.fromEntries(PHOTO_SLOTS.slice(3).map(slot => [slot, add.isPending]))}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="📷 Fotos Adicionales (p4-p10)"
            description="Más fotos para mostrar diferentes aspectos de tu Maestro"
            slots={PHOTO_SLOTS.slice(3)} // p4-p10
          />
        </React.Suspense>

        {/* Gestión de Videos */}
        <React.Suspense fallback={<div role="status" aria-live="polite">Cargando gestión de videos...</div>}>
          <VideoManagementSection
            media={media}
            uploading={Object.fromEntries(VIDEO_SLOTS.map(slot => [slot, add.isPending]))}
            uploadFile={uploadFile}
            removeFile={removeFile}
            title="🎥 Gestión de Videos"
            description="Videos promocionales, clases de muestra, testimonios"
            slots={[...VIDEO_SLOTS]}
          />
        </React.Suspense>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
