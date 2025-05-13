-- Script para actualizar o crear la tabla staff

-- Verificar si la tabla staff existe con la estructura antigua
DO $$
DECLARE
   table_exists BOOLEAN;
   column_exists BOOLEAN;
BEGIN
   -- Verificar si la tabla staff existe
   SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'staff'
   ) INTO table_exists;
   
   IF table_exists THEN
      -- Verificar si la columna user_id existe
      SELECT EXISTS (
         SELECT FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'staff' 
         AND column_name = 'user_id'
      ) INTO column_exists;
      
      IF NOT column_exists THEN
         -- Tabla existe pero con estructura antigua, respaldamos y creamos nueva
         RAISE NOTICE 'La tabla staff existe pero sin la columna user_id. Realizando backup y recreación.';
         
         -- Renombrar la tabla existente como backup
         ALTER TABLE public.staff RENAME TO staff_backup;
         
         -- Crear la nueva tabla con la estructura correcta
         CREATE TABLE public.staff (
             id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
             user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
             name VARCHAR(255) NOT NULL,
             role VARCHAR(50) NOT NULL,
             admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
             restaurant_id UUID,
             created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
             updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
             UNIQUE(user_id)
         );
         
         -- Intenta migrar datos si es posible (solo name, role, created_at, updated_at)
         BEGIN
            INSERT INTO public.staff (user_id, name, role, admin_id, created_at, updated_at)
            SELECT 
               -- Intentamos usar algún ID de auth.users existente para la migración
               (SELECT id FROM auth.users LIMIT 1), 
               name, 
               role, 
               NULL,
               created_at, 
               updated_at
            FROM public.staff_backup;
            EXCEPTION WHEN OTHERS THEN
               RAISE NOTICE 'No se pudieron migrar los datos antiguos: %', SQLERRM;
         END;
         
         RAISE NOTICE 'Tabla staff recreada con la estructura correcta. La tabla anterior está disponible como staff_backup.';
      ELSE
         RAISE NOTICE 'La tabla staff ya existe con la estructura correcta.';
      END IF;
   ELSE
      -- Tabla no existe, la creamos
      RAISE NOTICE 'La tabla staff no existe. Creándola...';
      
      CREATE TABLE public.staff (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          restaurant_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
      );
      
      RAISE NOTICE 'Tabla staff creada correctamente.';
   END IF;
   
   -- Asegurar que RLS está habilitado
   ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
   
   -- Crear o reemplazar políticas RLS
   DROP POLICY IF EXISTS "Usuarios pueden ver sus propios datos de staff" ON staff;
   DROP POLICY IF EXISTS "Administradores pueden ver datos de staff de sus usuarios" ON staff;
   DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios datos de staff" ON staff;
   DROP POLICY IF EXISTS "Administradores pueden actualizar datos de staff de sus usuarios" ON staff;
   DROP POLICY IF EXISTS "Administradores pueden crear datos de staff" ON staff;
   DROP POLICY IF EXISTS "Administradores pueden eliminar datos de staff de sus usuarios" ON staff;
   
   -- Crear políticas RLS
   CREATE POLICY "Usuarios pueden ver sus propios datos de staff" 
   ON staff FOR SELECT 
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Administradores pueden ver datos de staff de sus usuarios" 
   ON staff FOR SELECT 
   USING (auth.uid() = admin_id);
   
   CREATE POLICY "Usuarios pueden actualizar sus propios datos de staff" 
   ON staff FOR UPDATE 
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Administradores pueden actualizar datos de staff de sus usuarios" 
   ON staff FOR UPDATE 
   USING (auth.uid() = admin_id);
   
   CREATE POLICY "Administradores pueden crear datos de staff" 
   ON staff FOR INSERT 
   WITH CHECK (
     auth.uid() = admin_id OR 
     EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin')
   );
   
   CREATE POLICY "Administradores pueden eliminar datos de staff de sus usuarios" 
   ON staff FOR DELETE 
   USING (auth.uid() = admin_id);
   
   RAISE NOTICE 'Políticas RLS para la tabla staff creadas o actualizadas correctamente.';
END $$; 