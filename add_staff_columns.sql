-- Verificar y añadir nuevas columnas a la tabla staff
DO $$
DECLARE
  phone_exists BOOLEAN;
  email_exists BOOLEAN;
  status_exists BOOLEAN;
BEGIN
  -- Verificar si la columna phone existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff' 
    AND column_name = 'phone'
  ) INTO phone_exists;
  
  -- Verificar si la columna email existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff' 
    AND column_name = 'email'
  ) INTO email_exists;
  
  -- Verificar si la columna status existe
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff' 
    AND column_name = 'status'
  ) INTO status_exists;
  
  -- Añadir columna phone si no existe
  IF NOT phone_exists THEN
    ALTER TABLE public.staff ADD COLUMN phone VARCHAR(50);
    RAISE NOTICE 'Columna phone añadida a la tabla staff.';
  ELSE
    RAISE NOTICE 'La columna phone ya existe en la tabla staff.';
  END IF;
  
  -- Añadir columna email si no existe
  IF NOT email_exists THEN
    ALTER TABLE public.staff ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Columna email añadida a la tabla staff.';
  ELSE
    RAISE NOTICE 'La columna email ya existe en la tabla staff.';
  END IF;
  
  -- Añadir columna status si no existe
  IF NOT status_exists THEN
    ALTER TABLE public.staff ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    RAISE NOTICE 'Columna status añadida a la tabla staff.';
  ELSE
    RAISE NOTICE 'La columna status ya existe en la tabla staff.';
  END IF;
  
  RAISE NOTICE 'Actualización de la tabla staff completada.';
END $$; 