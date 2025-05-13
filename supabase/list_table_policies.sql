-- Función para listar todas las políticas de la tabla tables
CREATE OR REPLACE FUNCTION list_table_policies()
RETURNS TABLE (
  schema_name text,
  table_name text,
  policy_name text,
  action text,
  roles text[],
  cmd text,
  definition text
) 
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT 
    schemaname::text as schema_name,
    tablename::text as table_name,
    policyname::text as policy_name,
    permissive::text as action,
    roles::text[] as roles,
    cmd::text as cmd,
    qual::text as definition
  FROM 
    pg_policies
  WHERE 
    tablename = 'tables'
  ORDER BY 
    policyname;
$$; 