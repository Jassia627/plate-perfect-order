import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Obtener las credenciales de Supabase desde variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente de Supabase con clave de servicio para tener permisos administrativos
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log('Leyendo script SQL...');
    
    // Leer el contenido del archivo SQL
    const sqlFilePath = join(process.cwd(), 'fix_tables_rls.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('Ejecutando script SQL para corregir políticas RLS de mesas...');
    
    // Ejecutar el script SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error al ejecutar script SQL:', error);
      process.exit(1);
    }
    
    console.log('¡Script SQL ejecutado con éxito! Las políticas RLS han sido actualizadas.');
    
    // Verificar que la función de diagnóstico se haya creado correctamente
    const { data: fnExists, error: fnError } = await supabase.rpc('function_exists', { 
      function_name: 'debug_table_access' 
    });
    
    if (fnError) {
      console.error('Error al verificar función de diagnóstico:', fnError);
    } else if (fnExists) {
      console.log('Función de diagnóstico creada correctamente.');
    } else {
      console.warn('Advertencia: La función de diagnóstico no se creó correctamente.');
    }
    
  } catch (err) {
    console.error('Error inesperado:', err);
    process.exit(1);
  }
}

// Ejecutar el script principal
main();

// Nota: Es posible que necesites crear las funciones 'exec_sql' y 'function_exists' en Supabase
// Si no existen, aquí están las definiciones para crearlas:

/*
-- Función para ejecutar SQL arbitrario (¡usar con precaución!)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para comprobar si existe otra función
CREATE OR REPLACE FUNCTION function_exists(function_name text) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = function_name
  );
END;
$$ LANGUAGE plpgsql;
*/ 