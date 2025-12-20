import React from 'react';
import { useTranslation } from 'react-i18next';
import SeoHead from '../../components/SeoHead';

export default function LegalScreen() {
  const { t } = useTranslation();
  const lastUpdateDate = t('privacy_last_update_date');
  const supportEmail = 'info@dondebailar.com.mx';
  const websiteUrl = 'https://dondebailar.com.mx';

  return (
    <>
      <SeoHead
        title={t('privacy_title')}
        description={t('privacy_description')}
        keywords={[t('privacy_keyword_1'), t('privacy_keyword_2'), t('privacy_keyword_3'), t('privacy_keyword_4')]}
      />
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #0b1020 100%)',
        color: '#e5e7eb',
        padding: '32px 16px'
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
              marginBottom: 8
            }}>
              🔒 {t('privacy_title_full')}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              margin: 0
            }}>
              {t('where_dance')}
            </p>
            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.85rem',
              margin: '8px 0 0 0'
            }}>
              {t('privacy_last_update_label')}: {lastUpdateDate}
            </p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
            padding: '32px 24px',
            lineHeight: 1.8,
            fontSize: '0.95rem'
          }}>
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>
              {t('privacy_intro')}
            </p>
            <p style={{ marginBottom: 24, color: 'rgba(255,255,255,0.9)' }}>
              {t('privacy_regulates')}
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 24, color: 'rgba(255,255,255,0.85)' }}>
              <li>{t('privacy_source_1')}: <a href={websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{websiteUrl}</a></li>
              <li>{t('privacy_source_2')}</li>
              <li>{t('privacy_source_3')}</li>
            </ul>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_1_title')}
              </h2>
              <div style={{ paddingLeft: 16, borderLeft: '3px solid rgba(96,165,250,0.5)' }}>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  <strong>{t('privacy_responsible_label')}:</strong> {t('where_dance')}
                </p>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  <strong>{t('privacy_address_label')}:</strong> {t('privacy_address')}
                </p>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  <strong>{t('privacy_contact_email_label')}:</strong> <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline' }}>{supportEmail}</a>
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_2_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_section_2_applies_to')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_applies_to_1')}</li>
                <li>{t('teachers')}</li>
                <li>{t('academies')}</li>
                <li>{t('organizers')}</li>
                <li>{t('brands')}</li>
                <li>{t('privacy_applies_to_6')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_section_2_includes')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_3_title')}
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_1_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_1_1')}</li>
                  <li>{t('privacy_data_3_1_2')}</li>
                  <li>{t('privacy_data_3_1_3')}</li>
                  <li>{t('privacy_data_3_1_4')}</li>
                  <li>{t('privacy_data_3_1_5')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_2_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_2_1')}</li>
                  <li>{t('privacy_data_3_2_2')}</li>
                  <li>{t('privacy_data_3_2_3')}</li>
                  <li>{t('privacy_data_3_2_4')}</li>
                  <li>{t('privacy_data_3_2_5')}</li>
                  <li>{t('privacy_data_3_2_6')}</li>
                  <li>{t('privacy_data_3_2_7')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_3_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_3_1')}</li>
                  <li>{t('privacy_data_3_3_2')}</li>
                  <li>{t('privacy_data_3_3_3')}</li>
                  <li>{t('privacy_data_3_3_4')}</li>
                  <li>{t('privacy_data_3_3_5')}</li>
                  <li>{t('privacy_data_3_3_6')}</li>
                  <li>{t('privacy_data_3_3_7')}</li>
                  <li>{t('privacy_data_3_3_8')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_4_title')}
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  {t('privacy_data_3_4_intro')}
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_4_1')}</li>
                  <li>{t('privacy_data_3_4_2')}</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.9)', padding: '12px 16px', background: 'rgba(255,193,7,0.1)', borderRadius: 8, border: '1px solid rgba(255,193,7,0.2)' }}>
                  ⚠️ <strong>{t('important')}:</strong> {t('privacy_data_3_4_warning')}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_5_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_5_1')}</li>
                  <li>{t('privacy_data_3_5_2')}</li>
                  <li>{t('privacy_data_3_5_3')}</li>
                  <li>{t('privacy_data_3_5_4')}</li>
                  <li>{t('privacy_data_3_5_5')}</li>
                </ul>
                <p style={{ marginTop: 8, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  {t('privacy_data_3_5_note')}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_6_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_6_1')}</li>
                  <li>{t('privacy_data_3_6_2')}</li>
                  <li>{t('privacy_data_3_6_3')}</li>
                  <li>{t('privacy_data_3_6_4')}</li>
                  <li>{t('privacy_data_3_6_5')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_7_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_7_1')}</li>
                  <li>{t('privacy_data_3_7_2')}</li>
                  <li>{t('privacy_data_3_7_3')}</li>
                  <li>{t('privacy_data_3_7_4')}</li>
                  <li>{t('privacy_data_3_7_5')}</li>
                  <li>{t('privacy_data_3_7_6')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_3_8_title')}
                </h3>
                <p style={{ marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>
                  {t('privacy_data_3_8_intro')}
                </p>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_data_3_8_1')}</li>
                  <li>{t('privacy_data_3_8_2')}</li>
                  <li>{t('privacy_data_3_8_3')}</li>
                  <li>{t('privacy_data_3_8_4')}</li>
                </ul>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_4_title')}
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_4_1_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_purpose_4_1_1')}</li>
                  <li>{t('privacy_purpose_4_1_2')}</li>
                  <li>{t('privacy_purpose_4_1_3')}</li>
                  <li>{t('privacy_purpose_4_1_4')}</li>
                  <li>{t('privacy_purpose_4_1_5')}</li>
                  <li>{t('privacy_purpose_4_1_6')}</li>
                  <li>{t('privacy_purpose_4_1_7')}</li>
                  <li>{t('privacy_purpose_4_1_8')}</li>
                  <li>{t('privacy_purpose_4_1_9')}</li>
                  <li>{t('privacy_purpose_4_1_10')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_4_2_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_purpose_4_2_1')}</li>
                  <li>{t('privacy_purpose_4_2_2')}</li>
                  <li>{t('privacy_purpose_4_2_3')}</li>
                  <li>{t('privacy_purpose_4_2_4')}</li>
                </ul>
                <p style={{ marginTop: 12, marginBottom: 0, color: 'rgba(255,255,255,0.85)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                  {t('privacy_purpose_4_2_oppose')}: <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>📧 {supportEmail}</a>
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_5_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_moderation_intro')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_moderation_1')}</li>
                <ul style={{ paddingLeft: 24, marginTop: 8, marginBottom: 8 }}>
                  <li>{t('privacy_moderation_reason_1')}</li>
                  <li>{t('privacy_moderation_reason_2')}</li>
                  <li>{t('privacy_moderation_reason_3')}</li>
                  <li>{t('privacy_moderation_reason_4')}</li>
                  <li>{t('privacy_moderation_reason_5')}</li>
                  <li>{t('privacy_moderation_reason_6')}</li>
                </ul>
                <li>{t('privacy_moderation_2')}</li>
                <li>{t('privacy_moderation_3')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)', padding: '12px 16px', background: 'rgba(96,165,250,0.1)', borderRadius: 8, border: '1px solid rgba(96,165,250,0.2)' }}>
                {t('privacy_moderation_goal')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_6_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_payments_1')}
              </p>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_payments_2')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_payments_3')}</li>
                <li>{t('privacy_payments_4')}</li>
                <li>{t('privacy_payments_5')}</li>
                <li>{t('privacy_payments_6')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_payments_7')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_7_title')}
              </h2>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_legal_basis_1')}</li>
                <li>{t('privacy_legal_basis_2')}</li>
                <li>{t('privacy_legal_basis_3')}</li>
                <li>{t('privacy_legal_basis_4')}</li>
              </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_8_title')}
              </h2>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_sensitive_data')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_9_title')}
              </h2>
              
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_9_1_title')}
                </h3>
                <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                  <li>{t('privacy_transfer_9_1_1')}</li>
                  <li>{t('privacy_transfer_9_1_2')}</li>
                  <li>{t('privacy_transfer_9_1_3')}</li>
                </ul>
              </div>

              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_9_2_title')}
                </h3>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  {t('privacy_transfer_9_2')}
                </p>
              </div>

              <div style={{ marginBottom: 0 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: 12 }}>
                  {t('privacy_section_9_3_title')}
                </h3>
                <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                  {t('privacy_transfer_9_3')}
                </p>
              </div>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_10_title')}
              </h2>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_cookies_1')}</li>
                <li>{t('privacy_cookies_2')}</li>
                <li>{t('privacy_cookies_3')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_cookies_note')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_11_title')}
              </h2>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_security_1')}</li>
                <li>{t('privacy_security_2')}</li>
                <li>{t('privacy_security_3')}</li>
                <li>{t('privacy_security_4')}</li>
                <li>{t('privacy_security_5')}</li>
              </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_12_title')}
              </h2>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_retention_1')}</li>
                <li>{t('privacy_retention_2')}</li>
                <li>{t('privacy_retention_3')}</li>
              </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_13_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_arco_intro')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_arco_1')}</li>
                <li>{t('privacy_arco_2')}</li>
                <li>{t('privacy_arco_3')}</li>
                <li>{t('privacy_arco_4')}</li>
                <li>{t('privacy_arco_5')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                <a href={`mailto:${supportEmail}`} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 600 }}>📧 {supportEmail}</a>
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_14_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_breach_intro')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_breach_1')}</li>
                <li>{t('privacy_breach_2')}</li>
                <li>{t('privacy_breach_3')}</li>
                <li>{t('privacy_breach_4')}</li>
              </ul>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_15_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_liability_intro')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_liability_1')}</li>
                <li>{t('privacy_liability_2')}</li>
                <li>{t('privacy_liability_3')}</li>
                <li>{t('privacy_liability_4')}</li>
              </ul>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_liability_exception')}
              </p>
            </section>

            <section style={{ marginBottom: 32 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_16_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_changes_intro')}
              </p>
              <p style={{ marginBottom: 0, color: 'rgba(255,255,255,0.9)' }}>
                <a href={`${websiteUrl}/aviso-de-privacidad`} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>🔗 {websiteUrl}/aviso-de-privacidad</a>
              </p>
            </section>

            <section style={{ marginBottom: 0 }}>
              <h2 style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: 16,
                marginTop: 32,
                textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                borderBottom: '2px solid rgba(255,255,255,0.1)',
                paddingBottom: 8
              }}>
                {t('privacy_section_17_title')}
              </h2>
              <p style={{ marginBottom: 12, color: 'rgba(255,255,255,0.9)' }}>
                {t('privacy_acceptance_intro')}
              </p>
              <ul style={{ paddingLeft: 24, marginBottom: 0, color: 'rgba(255,255,255,0.85)' }}>
                <li>{t('privacy_acceptance_1')}</li>
                <li>{t('privacy_acceptance_2')}</li>
              </ul>
            </section>

            <div style={{
              marginTop: 48,
              padding: '24px',
              background: 'rgba(96,165,250,0.1)',
              borderRadius: 12,
              border: '1px solid rgba(96,165,250,0.2)',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem' }}>
                {t('privacy_questions')}
              </p>
              <p style={{ margin: '8px 0 0 0' }}>
                <a href={`mailto:${supportEmail}`} style={{
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}>
                  {t('privacy_contact_us')} {supportEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
