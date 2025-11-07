-- ============================================================================
-- SISTEMA DE CLASES COMPLETO PARA PRODUCCIÓN
-- ============================================================================
-- Sistema de clases para academias y maestros
-- Idempotente y seguro para ejecutar múltiples veces
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. TABLA ACADEMY_CLASSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.academy_classes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    academy_id bigint NOT NULL REFERENCES public.profiles_academy(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    descripcion text,
    nivel text CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'todos')),
    ritmos_seleccionados text[],
    dia_semana integer CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
    hora_inicio time,
    hora_fin time,
    costo numeric(10,2),
    ubicacion jsonb, -- {lugar, direccion, ciudad, zona, referencias}
    cupo_maximo integer,
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cancelado')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_academy_classes_academy ON public.academy_classes(academy_id);
CREATE INDEX IF NOT EXISTS idx_academy_classes_ritmos ON public.academy_classes USING gin(ritmos_seleccionados);
CREATE INDEX IF NOT EXISTS idx_academy_classes_dia ON public.academy_classes(dia_semana);

-- ============================================================================
-- 2. TABLA TEACHER_CLASSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.teacher_classes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id bigint NOT NULL REFERENCES public.profiles_teacher(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    descripcion text,
    nivel text CHECK (nivel IN ('principiante', 'intermedio', 'avanzado', 'todos')),
    ritmos_seleccionados text[],
    dia_semana integer CHECK (dia_semana BETWEEN 0 AND 6),
    hora_inicio time,
    hora_fin time,
    costo numeric(10,2),
    ubicacion jsonb,
    cupo_maximo integer,
    estado text DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'cancelado')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_classes_teacher ON public.teacher_classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_ritmos ON public.teacher_classes USING gin(ritmos_seleccionados);
CREATE INDEX IF NOT EXISTS idx_teacher_classes_dia ON public.teacher_classes(dia_semana);

-- ============================================================================
-- 3. TRIGGERS PARA updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_academy_classes_updated_at ON public.academy_classes;
CREATE TRIGGER trg_academy_classes_updated_at
    BEFORE UPDATE ON public.academy_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_teacher_classes_updated_at ON public.teacher_classes;
CREATE TRIGGER trg_teacher_classes_updated_at
    BEFORE UPDATE ON public.teacher_classes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.academy_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- Políticas para academy_classes
DROP POLICY IF EXISTS academy_classes_select_public ON public.academy_classes;
CREATE POLICY academy_classes_select_public ON public.academy_classes
    FOR SELECT USING (estado = 'activo');

DROP POLICY IF EXISTS academy_classes_insert_owner ON public.academy_classes;
CREATE POLICY academy_classes_insert_owner ON public.academy_classes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles_academy a
            WHERE a.id = academy_id AND a.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS academy_classes_update_owner ON public.academy_classes;
CREATE POLICY academy_classes_update_owner ON public.academy_classes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles_academy a
            WHERE a.id = academy_id AND a.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS academy_classes_delete_owner ON public.academy_classes;
CREATE POLICY academy_classes_delete_owner ON public.academy_classes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles_academy a
            WHERE a.id = academy_id AND a.user_id = auth.uid()
        )
    );

-- Políticas para teacher_classes
DROP POLICY IF EXISTS teacher_classes_select_public ON public.teacher_classes;
CREATE POLICY teacher_classes_select_public ON public.teacher_classes
    FOR SELECT USING (estado = 'activo');

DROP POLICY IF EXISTS teacher_classes_insert_owner ON public.teacher_classes;
CREATE POLICY teacher_classes_insert_owner ON public.teacher_classes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles_teacher t
            WHERE t.id = teacher_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS teacher_classes_update_owner ON public.teacher_classes;
CREATE POLICY teacher_classes_update_owner ON public.teacher_classes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles_teacher t
            WHERE t.id = teacher_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS teacher_classes_delete_owner ON public.teacher_classes;
CREATE POLICY teacher_classes_delete_owner ON public.teacher_classes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles_teacher t
            WHERE t.id = teacher_id AND t.user_id = auth.uid()
        )
    );

-- ============================================================================
-- 5. VISTAS PÚBLICAS
-- ============================================================================

-- Vista pública de clases de academias
DROP VIEW IF EXISTS public.v_academy_classes_public CASCADE;
CREATE VIEW public.v_academy_classes_public AS
SELECT
    ac.id,
    ac.academy_id,
    ac.nombre,
    ac.descripcion,
    ac.nivel,
    ac.ritmos_seleccionados,
    ac.dia_semana,
    ac.hora_inicio,
    ac.hora_fin,
    ac.costo,
    ac.ubicacion,
    ac.cupo_maximo,
    ac.created_at,
    a.nombre_publico as academy_nombre,
    a.avatar_url as academy_avatar
FROM public.academy_classes ac
JOIN public.profiles_academy a ON a.id = ac.academy_id
WHERE ac.estado = 'activo'
  AND a.estado_aprobacion = 'aprobado';

-- Vista pública de clases de maestros
DROP VIEW IF EXISTS public.v_teacher_classes_public CASCADE;
CREATE VIEW public.v_teacher_classes_public AS
SELECT
    tc.id,
    tc.teacher_id,
    tc.nombre,
    tc.descripcion,
    tc.nivel,
    tc.ritmos_seleccionados,
    tc.dia_semana,
    tc.hora_inicio,
    tc.hora_fin,
    tc.costo,
    tc.ubicacion,
    tc.cupo_maximo,
    tc.created_at,
    t.nombre_publico as teacher_nombre,
    t.avatar_url as teacher_avatar
FROM public.teacher_classes tc
JOIN public.profiles_teacher t ON t.id = tc.teacher_id
WHERE tc.estado = 'activo'
  AND t.estado_aprobacion = 'aprobado';

-- ============================================================================
-- 6. GRANTS
-- ============================================================================

GRANT SELECT ON public.academy_classes TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.academy_classes TO authenticated;

GRANT SELECT ON public.teacher_classes TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.teacher_classes TO authenticated;

GRANT SELECT ON public.v_academy_classes_public TO authenticated, anon;
GRANT SELECT ON public.v_teacher_classes_public TO authenticated, anon;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Ver estructura de academy_classes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'academy_classes'
ORDER BY ordinal_position;

-- Ver estructura de teacher_classes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'teacher_classes'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('academy_classes', 'teacher_classes')
ORDER BY tablename, policyname;

-- Ver vistas públicas
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name LIKE '%classes%'
ORDER BY table_name;

-- Contar clases
SELECT 
    (SELECT COUNT(*) FROM public.academy_classes) as total_academy_classes,
    (SELECT COUNT(*) FROM public.teacher_classes) as total_teacher_classes;

