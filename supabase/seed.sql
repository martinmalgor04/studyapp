-- ============================================
-- SEED DATA
-- ============================================

-- ============================================
-- E2E TEST USER
-- Se crea un usuario fijo para los tests E2E.
-- El trigger on_auth_user_created crea automáticamente
-- las filas en public.users y public.user_stats.
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'test@studyapp.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      'authenticated',
      'authenticated',
      'test@studyapp.com',
      crypt('TestPassword123!', gen_salt('bf')),
      NOW(),
      '{"name": "Test User"}'::jsonb,
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- Insert sample achievements
INSERT INTO achievements (code, name, description, points) VALUES
  ('FIRST_SESSION', 'Primera Sesión', 'Completaste tu primera sesión de estudio', 10),
  ('STREAK_7', 'Semana de Fuego', '7 días consecutivos estudiando', 50),
  ('STREAK_30', 'Mes de Disciplina', '30 días consecutivos estudiando', 200),
  ('PERFECT_WEEK', 'Semana Perfecta', 'Completaste todas las sesiones de la semana', 100),
  ('MASTER_SUBJECT', 'Maestro de Materia', 'Alcanzaste nivel 10 en una materia', 300),
  ('EARLY_BIRD', 'Madrugador', 'Completaste 10 sesiones antes de las 9 AM', 75),
  ('NIGHT_OWL', 'Búho Nocturno', 'Completaste 10 sesiones después de las 9 PM', 75),
  ('CONSISTENT', 'Consistente', '30 días sin fallar una sesión', 250)
ON CONFLICT (code) DO NOTHING;
