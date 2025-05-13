# Configuración de Storage en Supabase para Plate Perfect Order

Este documento contiene las instrucciones necesarias para configurar el almacenamiento de imágenes en Supabase para la aplicación Plate Perfect Order.

## Crear el bucket de imágenes

1. Ve al [Dashboard de Supabase](https://app.supabase.com) y selecciona tu proyecto.
2. En el menú lateral, haz clic en **Storage**.
3. Haz clic en el botón **+ Create Bucket**.
4. Introduce el nombre `images` para el bucket.
5. Marca la opción **Public** para permitir acceso público a las imágenes.
6. Haz clic en **Create Bucket** para finalizar.

## Configurar las políticas de acceso (RLS)

Para permitir que los usuarios puedan subir y acceder a las imágenes, necesitamos configurar políticas de Row Level Security (RLS) en el bucket:

1. En la sección de Storage, selecciona el bucket `images` que acabas de crear.
2. Ve a la pestaña **Policies**.
3. Haz clic en **New Policy** para crear una nueva política.
4. Selecciona **Custom Policy** para tener más control.
5. Configura cada política con los siguientes valores:

### Política para SELECT (Leer archivos)

- **Name**: `Public Access`
- **Definition**: `true`
- **Command**: `SELECT`

Esta política permite a cualquier persona ver las imágenes públicas.

### Política para INSERT (Subir archivos)

- **Name**: `Authenticated Upload`
- **Definition**: `auth.role() = 'authenticated'`
- **Command**: `INSERT`

Esta política permite a usuarios autenticados subir archivos.

### Política para UPDATE (Actualizar archivos)

- **Name**: `Authenticated Update`
- **Definition**: `auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`
- **Command**: `UPDATE`

### Política para DELETE (Eliminar archivos)

- **Name**: `Authenticated Delete`
- **Definition**: `auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text`
- **Command**: `DELETE`

## Verificación

Una vez configuradas las políticas, los usuarios autenticados podrán:
- Subir imágenes al bucket `images`
- Ver todas las imágenes públicas
- Editar o eliminar solo sus propias imágenes

Ahora la aplicación Plate Perfect Order debería ser capaz de cargar imágenes para los platos del menú sin errores. 