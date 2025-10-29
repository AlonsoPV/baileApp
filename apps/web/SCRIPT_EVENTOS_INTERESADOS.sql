-- Script para crear la tabla eventos_interesados y políticas RLS
-- Este script registra quién añadió un evento a su calendario

-- 1. Crear tabla eventos_interesados
CREATE TABLE IF NOT EXISTS eventos_interesados (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_eventos_interesados_event_id ON eventos_interesados(event_id);
CREATE INDEX IF NOT EXISTS idx_eventos_interesados_user_id ON eventos_interesados(user_id);
CREATE INDEX IF NOT EXISTS idx_eventos_interesados_created_at ON eventos_interesados(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE eventos_interesados ENABLE ROW LEVEL SECURITY;

-- 4. Política: Cualquiera puede leer los conteos (pero no datos personales)
DROP POLICY IF EXISTS "Anyone can read counts" ON eventos_interesados;
CREATE POLICY "Anyone can read counts"
  ON eventos_interesados
  FOR SELECT
  USING (true);

-- 5. Política: Usuarios autenticados pueden insertar su propio interés
DROP POLICY IF EXISTS "Authenticated users can insert their interest" ON eventos_interesados;
CREATE POLICY "Authenticated users can insert their interest"
  ON eventos_interesados
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: Usuarios solo pueden ver sus propios registros completos
DROP POLICY IF EXISTS "Users can view their own records" ON eventos_interesados;
CREATE POLICY "Users can view their own records"
  ON eventos_interesados
  FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Política: Usuarios pueden eliminar sus propios registros
DROP POLICY IF EXISTS "Users can delete their own records" ON eventos_interesados;
CREATE POLICY "Users can delete their own records"
  ON eventos_interesados
  FOR DELETE
  USING (auth.uid() = user_id);

-- Notas:
-- - event_id es TEXT para permitir IDs de diferentes formatos (string, número, etc.)
-- - UNIQUE constraint previene duplicados (mismo usuario + mismo evento)
-- - RLS protege los datos personales pero permite conteos públicos

