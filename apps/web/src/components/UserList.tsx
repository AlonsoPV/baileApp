import React from "react";
import { motion } from "framer-motion";
import { UserProfileLink } from "./UserProfileLink";

const colors = {
  coral: '#FF3D57',
  orange: '#FF8C42',
  blue: '#1E88E5',
  dark: '#121212',
  light: '#F5F5F5',
};

interface User {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
}

interface UserListProps {
  users: User[];
  title?: string;
  variant?: 'chips' | 'cards' | 'simple';
}

export function UserList({ users, title, variant = 'cards' }: UserListProps) {
  if (!users || users.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: `${colors.light}66`,
        background: `${colors.dark}aa`,
        borderRadius: '16px',
        border: `1px dashed ${colors.light}22`,
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>👥</div>
        <p>No hay usuarios para mostrar</p>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: '32px' }}>
      {title && (
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '700',
          marginBottom: '16px',
          color: colors.light,
        }}>
          {title}
        </h3>
      )}

      {variant === 'chips' && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {users.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <UserProfileLink
                userId={user.user_id}
                displayName={user.display_name}
                avatarUrl={user.avatar_url}
                variant="chip"
              />
            </motion.div>
          ))}
        </div>
      )}

      {variant === 'cards' && (
        <div style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        }}>
          {users.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <UserProfileLink
                userId={user.user_id}
                displayName={user.display_name}
                avatarUrl={user.avatar_url}
                variant="card"
              />
            </motion.div>
          ))}
        </div>
      )}

      {variant === 'simple' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          {users.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                padding: '12px 16px',
                background: `${colors.dark}aa`,
                borderRadius: '8px',
                border: `1px solid ${colors.light}22`,
              }}
            >
              <UserProfileLink
                userId={user.user_id}
                displayName={user.display_name}
                avatarUrl={user.avatar_url}
                variant="simple"
              />
              {user.bio && (
                <p style={{
                  fontSize: '0.875rem',
                  opacity: 0.7,
                  marginTop: '4px',
                  marginBottom: 0,
                }}>
                  {user.bio.slice(0, 100)}{user.bio.length > 100 && '...'}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
