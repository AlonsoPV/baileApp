import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';

export default function AppShell() {
  return (
    <div style={{ minHeight: '100vh', background: '#0b0d10', color: '#e5e7eb' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}


