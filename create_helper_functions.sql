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