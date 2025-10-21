import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showBackButton?: boolean;
}

const colors = {
  coral: '#FF3D57',
  light: '#F5F5F5',
};

export function Breadcrumbs({ items, showBackButton = true }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '24px',
    }}>
      {/* Back Button - Minimalista */}
      {showBackButton && (
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          style={{
            padding: '6px 0',
            border: 'none',
            background: 'transparent',
            color: `${colors.light}99`,
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.light;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = `${colors.light}99`;
          }}
          title="Volver"
        >
          <span style={{ fontSize: '1rem' }}>←</span>
          <span>Volver</span>
        </motion.button>
      )}

      {/* Separador vertical sutil */}
      {showBackButton && (
        <div style={{
          width: '1px',
          height: '16px',
          background: `${colors.light}22`,
        }} />
      )}

      {/* Breadcrumb Items - Minimalistas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.875rem',
      }}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span style={{ 
                color: `${colors.light}44`, 
                fontSize: '0.75rem',
                userSelect: 'none',
                fontWeight: '300',
              }}>
                /
              </span>
            )}
            
            {item.href ? (
              <Link
                to={item.href}
                style={{
                  color: index === items.length - 1 ? colors.light : `${colors.light}77`,
                  textDecoration: 'none',
                  fontWeight: index === items.length - 1 ? '600' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (index !== items.length - 1) {
                    e.currentTarget.style.color = colors.coral;
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== items.length - 1) {
                    e.currentTarget.style.color = `${colors.light}77`;
                  }
                }}
              >
                {item.icon && (
                  <span style={{ 
                    fontSize: '0.9rem',
                    opacity: 0.8,
                  }}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span
                style={{
                  color: colors.light,
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {item.icon && (
                  <span style={{ 
                    fontSize: '0.9rem',
                    opacity: 0.8,
                  }}>
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}