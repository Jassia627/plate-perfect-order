import { supabase } from "./client";
import { toast } from "sonner";

// Función simplificada que ofrece guía al usuario
export async function initializeDatabase() {
  try {
    // Verificar si las tablas existen
    const { error: tablesExistError } = await supabase
      .from('tables')
      .select('id')
      .limit(1);
    
    // Si hay error, las tablas no existen
    if (tablesExistError) {
      console.log("Las tablas necesarias no existen");
      toast.error("Es necesario crear las tablas en Supabase", {
        description: "Abriremos el panel SQL para que puedas ejecutar las consultas necesarias",
        action: {
          label: "Abrir Panel SQL",
          onClick: () => window.open('https://supabase.com/dashboard/project/qszflpzaiyijwqlcmopv/sql', '_blank')
        },
        duration: 10000
      });
      return false;
    }
    
    console.log("Las tablas necesarias ya existen");
    return true;
  } catch (err) {
    console.error("Error al verificar la base de datos:", err);
    toast.error("Error al verificar la base de datos");
    return false;
  }
}

// Función para generar el SQL necesario para crear las tablas
export function getCreateTablesSql() {
  return `
    -- Tabla para gestionar las mesas del restaurante
    CREATE TABLE IF NOT EXISTS tables (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      number INTEGER NOT NULL,
      capacity INTEGER NOT NULL, 
      shape TEXT NOT NULL CHECK (shape IN ('circle', 'square', 'rectangle')),
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('available', 'occupied', 'reserved')),
      server TEXT,
      start_time TEXT,
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla para gestionar las reservas
    CREATE TABLE IF NOT EXISTS reservations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      table_id UUID REFERENCES tables(id),
      customer_name TEXT NOT NULL,
      people INTEGER NOT NULL,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      contact TEXT,
      notes TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla para gestionar categorías del menú
    CREATE TABLE IF NOT EXISTS menu_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla para gestionar productos del menú
    CREATE TABLE IF NOT EXISTS menu_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      category_id UUID REFERENCES menu_categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      image_url TEXT,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla para gestionar pedidos
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      table_id UUID REFERENCES tables(id),
      server TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
      total DECIMAL(10, 2) NOT NULL DEFAULT 0,
      notes TEXT,
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla para gestionar items de pedidos
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id UUID REFERENCES menu_items(id),
      name TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Índices para búsquedas frecuentes
    CREATE INDEX IF NOT EXISTS tables_status_idx ON tables(status);
    CREATE INDEX IF NOT EXISTS tables_user_idx ON tables(user_id);
    CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(date);
    CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status);
    CREATE INDEX IF NOT EXISTS reservations_user_idx ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS menu_categories_user_idx ON menu_categories(user_id);
    CREATE INDEX IF NOT EXISTS menu_items_user_idx ON menu_items(user_id);
    CREATE INDEX IF NOT EXISTS orders_table_idx ON orders(table_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
    CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id);
    CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS order_items_status_idx ON order_items(status);
    CREATE INDEX IF NOT EXISTS order_items_user_idx ON order_items(user_id);

    -- Configurar Row Level Security para menu_categories
    ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propias categorías" 
    ON menu_categories FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propias categorías" 
    ON menu_categories FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propias categorías" 
    ON menu_categories FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propias categorías" 
    ON menu_categories FOR DELETE 
    USING (auth.uid() = user_id);
    
    -- Configurar Row Level Security para menu_items
    ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propios productos" 
    ON menu_items FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propios productos" 
    ON menu_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propios productos" 
    ON menu_items FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propios productos" 
    ON menu_items FOR DELETE 
    USING (auth.uid() = user_id);

    -- Configurar Row Level Security para tables
    ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propias mesas" 
    ON tables FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propias mesas" 
    ON tables FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propias mesas" 
    ON tables FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propias mesas" 
    ON tables FOR DELETE 
    USING (auth.uid() = user_id);
    
    -- Configurar Row Level Security para reservations
    ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propias reservas" 
    ON reservations FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propias reservas" 
    ON reservations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propias reservas" 
    ON reservations FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propias reservas" 
    ON reservations FOR DELETE 
    USING (auth.uid() = user_id);
    
    -- Configurar Row Level Security para orders
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propios pedidos" 
    ON orders FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propios pedidos" 
    ON orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propios pedidos" 
    ON orders FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propios pedidos" 
    ON orders FOR DELETE 
    USING (auth.uid() = user_id);
    
    -- Configurar Row Level Security para order_items
    ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Usuarios pueden ver sus propios ítems de pedidos" 
    ON order_items FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden insertar sus propios ítems de pedidos" 
    ON order_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden actualizar sus propios ítems de pedidos" 
    ON order_items FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Usuarios pueden eliminar sus propios ítems de pedidos" 
    ON order_items FOR DELETE 
    USING (auth.uid() = user_id);
  `;
}

// Función para crear datos de ejemplo
export async function createSampleData() {
  try {
    // Verificar si ya hay datos
    const { data: existingTables, error: checkError } = await supabase
      .from('tables')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error("Error al verificar datos existentes:", checkError);
      return false;
    }
    
    // Si ya hay datos, no creamos ejemplos
    if (existingTables && existingTables.length > 0) {
      console.log("Ya existen datos en la tabla 'tables'");
      await createStatsData(); // Crear datos para estadísticas si es necesario
      return true;
    }
    
    // Obtener el usuario actual
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (!userId) {
      console.error("No hay un usuario autenticado para crear datos de ejemplo");
      toast.error("Debes iniciar sesión para crear datos de ejemplo");
      return false;
    }

    // Datos de ejemplo para mesas
    const sampleTables = [
      {
        number: 1,
        capacity: 2,
        shape: "circle",
        width: 60,
        height: 60,
        x: 100,
        y: 100,
        status: "available",
        user_id: userId
      },
      {
        number: 2,
        capacity: 4,
        shape: "square",
        width: 80,
        height: 80,
        x: 200,
        y: 100,
        status: "available",
        user_id: userId
      },
      {
        number: 3,
        capacity: 4,
        shape: "square",
        width: 80,
        height: 80,
        x: 300,
        y: 100,
        status: "available",
        user_id: userId
      },
      {
        number: 4,
        capacity: 6,
        shape: "rectangle",
        width: 120,
        height: 80,
        x: 100,
        y: 200,
        status: "available",
        user_id: userId
      },
      {
        number: 5,
        capacity: 6,
        shape: "rectangle",
        width: 120,
        height: 80,
        x: 250,
        y: 200,
        status: "available",
        user_id: userId
      }
    ];
    
    // Insertar mesas de ejemplo
    const { data: tablesData, error: insertError } = await supabase
      .from('tables')
      .insert(sampleTables)
      .select();
    
    if (insertError) {
      console.error("Error al insertar datos de ejemplo:", insertError);
      toast.error("Error al crear datos de ejemplo");
      return false;
    }

    // Datos de ejemplo para categorías del menú
    const sampleCategories = [
      {
        name: "Entrantes",
        description: "Platos pequeños para compartir",
        sort_order: 1,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        name: "Platos Principales",
        description: "Platos principales para una comida completa",
        sort_order: 2,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        name: "Postres",
        description: "Dulces para terminar la comida",
        sort_order: 3,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        name: "Bebidas",
        description: "Refrescos, vinos y cervezas",
        sort_order: 4,
        user_id: userId  // Asignar el ID del usuario actual
      }
    ];

    // Insertar categorías
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('menu_categories')
      .insert(sampleCategories)
      .select();

    if (categoriesError) {
      console.error("Error al insertar categorías:", categoriesError);
      return false;
    }

    // Asignar IDs de categorías
    const entreesId = categoriesData[0].id;
    const mainsId = categoriesData[1].id;
    const dessertsId = categoriesData[2].id;
    const drinksId = categoriesData[3].id;

    // Datos de ejemplo para productos del menú
    const sampleMenuItems = [
      {
        category_id: entreesId,
        name: "Ensalada César",
        description: "Lechuga romana con aderezo César, crutones y queso parmesano",
        price: 8.50,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: entreesId,
        name: "Croquetas de Jamón",
        description: "Croquetas caseras de jamón ibérico",
        price: 7.50,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: mainsId,
        name: "Pasta Carbonara",
        description: "Espaguetis con salsa carbonara, bacon y queso parmesano",
        price: 12.50,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: mainsId,
        name: "Pizza Margarita",
        description: "Pizza con tomate, mozzarella y albahaca",
        price: 10.00,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: mainsId,
        name: "Risotto de Champiñones",
        description: "Risotto cremoso con champiñones y queso parmesano",
        price: 14.00,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: dessertsId,
        name: "Tiramisú",
        description: "Postre italiano con café, crema y cacao",
        price: 6.50,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: drinksId,
        name: "Agua Mineral",
        description: "Botella de agua mineral",
        price: 2.00,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      },
      {
        category_id: drinksId,
        name: "Refresco",
        description: "Refresco de cola, naranja o limón",
        price: 2.50,
        available: true,
        user_id: userId  // Asignar el ID del usuario actual
      }
    ];

    // Insertar productos
    const { data: menuItemsData, error: menuItemsError } = await supabase
      .from('menu_items')
      .insert(sampleMenuItems)
      .select();

    if (menuItemsError) {
      console.error("Error al insertar productos:", menuItemsError);
      return false;
    }

    // Crear datos para estadísticas (simulando pedidos)
    await createStatsData(tablesData, menuItemsData);
    
    toast.success("Datos de ejemplo creados correctamente");
    return true;
  } catch (err) {
    console.error("Error al crear datos de ejemplo:", err);
    toast.error("Error al crear datos de ejemplo");
    return false;
  }
}

// Función para crear datos de estadísticas
async function createStatsData(tablesData?: any[], menuItemsData?: any[]) {
  try {
    // Verificar si ya hay órdenes
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error("Error al verificar órdenes existentes:", countError);
      return false;
    }
    
    // Si ya hay suficientes órdenes, no creamos más
    if (count && count > 10) {
      console.log("Ya existen suficientes datos de órdenes");
      return true;
    }
    
    // Obtener el usuario actual
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    
    if (!userId) {
      console.error("No hay un usuario autenticado para crear datos de estadísticas");
      return false;
    }
    
    // Si no se proporcionaron mesas, obtenerlas
    if (!tablesData) {
      const { data: existingTables, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('user_id', userId); // Filtrar por usuario
      
      if (tablesError || !existingTables || existingTables.length === 0) {
        console.error("Error al obtener mesas:", tablesError);
        return false;
      }
      
      tablesData = existingTables;
    }
    
    // Si no se proporcionaron productos, obtenerlos
    if (!menuItemsData) {
      const { data: existingItems, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('user_id', userId); // Filtrar por usuario
      
      if (itemsError || !existingItems || existingItems.length === 0) {
        console.error("Error al obtener productos:", itemsError);
        return false;
      }
      
      menuItemsData = existingItems;
    }
    
    // Crear órdenes para los últimos 7 días
    const orders = [];
    const orderItems = [];
    
    // Lista de servidores
    const servers = ["Juan García", "María López", "Carlos Rodríguez", "Ana Martínez"];
    
    // Crear de 20 a 30 órdenes en los últimos 7 días
    const numOrders = Math.floor(Math.random() * 11) + 20; // Entre 20 y 30
    
    for (let i = 0; i < numOrders; i++) {
      // Seleccionar una fecha aleatoria en los últimos 7 días
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7)); // Hasta 7 días atrás
      date.setHours(
        12 + Math.floor(Math.random() * 10), // Entre 12:00 y 22:00
        Math.floor(Math.random() * 60),      // Minutos aleatorios
        Math.floor(Math.random() * 60)       // Segundos aleatorios
      );
      
      // Seleccionar una mesa aleatoria
      const table = tablesData[Math.floor(Math.random() * tablesData.length)];
      
      // Seleccionar un servidor aleatorio
      const server = servers[Math.floor(Math.random() * servers.length)];
      
      // Crear la orden
      const order = {
        table_id: table.id,
        server,
        status: "delivered",  // Todas las órdenes están entregadas para el dashboard
        total: 0,  // Se calculará en base a los items
        created_at: date.toISOString(),
        user_id: userId // Agregar el ID del usuario
      };
      
      orders.push(order);
    }
    
    // Insertar órdenes
    const { data: insertedOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(orders)
      .select();
    
    if (ordersError) {
      console.error("Error al insertar órdenes:", ordersError);
      return false;
    }
    
    // Crear items para cada orden
    for (const order of insertedOrders) {
      // Entre 2 y 6 items por orden
      const numItems = Math.floor(Math.random() * 5) + 2;
      let total = 0;
      
      for (let i = 0; i < numItems; i++) {
        // Seleccionar un producto aleatorio
        const menuItem = menuItemsData[Math.floor(Math.random() * menuItemsData.length)];
        
        // Cantidad entre 1 y 3
        const quantity = Math.floor(Math.random() * 3) + 1;
        
        // Precio del item
        const price = parseFloat(menuItem.price);
        
        // Sumatorio del total
        const itemTotal = price * quantity;
        total += itemTotal;
        
        const orderItem = {
          order_id: order.id,
          menu_item_id: menuItem.id,
          name: menuItem.name,
          price,
          quantity,
          status: "delivered",
          created_at: order.created_at,
          user_id: userId // Agregar el ID del usuario
        };
        
        orderItems.push(orderItem);
      }
      
      // Actualizar el total de la orden
      await supabase
        .from('orders')
        .update({ total })
        .eq('id', order.id);
    }
    
    // Insertar items de órdenes
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error("Error al insertar items de órdenes:", itemsError);
      return false;
    }
    
    console.log("Datos de estadísticas creados correctamente");
    return true;
  } catch (err) {
    console.error("Error al crear datos de estadísticas:", err);
    return false;
  }
} 