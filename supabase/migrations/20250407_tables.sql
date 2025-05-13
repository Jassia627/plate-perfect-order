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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS tables_status_idx ON tables(status);
CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(date);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON reservations(status); 