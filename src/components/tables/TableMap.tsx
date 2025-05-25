import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Table, TableStatus, TableShape } from "@/hooks/use-tables";
import { orderEvents, OrderEvent } from "@/hooks/use-orders";
import { useSound } from "@/hooks/use-sound";

type TableMapProps = {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableMove?: (id: string, x: number, y: number) => void;
  editMode?: boolean;
  occupiedTableIds?: string[];
};

// Componente para una mesa individual
const TableItem = ({ 
  table, 
  onClick, 
  onDragEnd,
  editMode = false,
  isBlinking = false,
  animateOccupied = false
}: { 
  table: Table; 
  onClick: () => void;
  onDragEnd?: (x: number, y: number) => void;
  editMode?: boolean;
  isBlinking?: boolean;
  animateOccupied?: boolean;
}) => {
  const [position, setPosition] = useState({ x: table.x, y: table.y });
  const elementRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const elementPosRef = useRef({ x: 0, y: 0 });

  // Actualizar posición cuando cambian las props de tabla
  useEffect(() => {
    setPosition({ x: table.x, y: table.y });
  }, [table.x, table.y]);

  const statusClasses = {
    available: "bg-gradient-to-br from-green-50 to-green-100 border-green-500 hover:bg-green-200 shadow-sm",
    occupied: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-500 hover:bg-blue-200 shadow-md",
    reserved: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-500 hover:bg-amber-200 shadow-sm",
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!editMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.pageX;
    const startY = e.pageY;
    startPosRef.current = { x: startX, y: startY };
    elementPosRef.current = { x: position.x, y: position.y };
    setDragging(true);

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.pageX - startPosRef.current.x;
      const dy = e.pageY - startPosRef.current.y;
      
      const newX = elementPosRef.current.x + dx;
      const newY = elementPosRef.current.y + dy;
      
      setPosition({
        x: newX,
        y: newY
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Importante: Capturar la posición final antes de cambiar el estado
      const finalX = elementPosRef.current.x + (e.pageX - startPosRef.current.x);
      const finalY = elementPosRef.current.y + (e.pageY - startPosRef.current.y);
      
      if (onDragEnd) {
        // Usar las coordenadas finales calculadas
        onDragEnd(finalX, finalY);
      }
      
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragging || editMode) {
      e.stopPropagation();
      return;
    }
    onClick();
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute border-2 flex items-center justify-center",
        statusClasses[table.status],
        table.shape === "circle" 
          ? "rounded-full" 
          : table.shape === "square" 
            ? "rounded-lg" 
            : "rounded-md",
        editMode ? "cursor-move" : "cursor-pointer",
        dragging && "opacity-70 z-50",
        isBlinking && "animate-pulse",
        animateOccupied && table.status === "occupied" && "animate-tableOccupied"
      )}
      style={{
        width: `${table.width}px`,
        height: `${table.height}px`,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: dragging ? 'none' : 'all 0.3s ease',
        userSelect: 'none'
      }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
    >
      <div className="text-center pointer-events-none flex flex-col items-center justify-center w-full h-full">
        <div className="font-bold text-restaurant-dark text-lg">{table.number}</div>
        <div className="text-xs bg-white/40 dark:bg-black/10 px-2 py-0.5 rounded-full mt-1 text-muted-foreground flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-muted-foreground/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {table.capacity}
        </div>
        {table.status === 'occupied' && (
          <div className="absolute top-1 right-1 bg-blue-500 w-2 h-2 rounded-full animate-pulse" />
        )}
        {table.status === 'reserved' && (
          <div className="absolute top-1 right-1 bg-amber-500 w-2 h-2 rounded-full" />
        )}
      </div>
    </div>
  );
};

const TableMap = ({ 
  tables, 
  onTableClick, 
  onTableMove, 
  editMode = false,
  occupiedTableIds = []
}: TableMapProps) => {
  // Estado para controlar zoom y pan (versión simple)
  const [scale, setScale] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Estado para mesas parpadeantes cuando una orden está lista
  const [blinkingTables, setBlinkingTables] = useState<string[]>([]);
  
  // Estado para mesas que cambian a ocupadas
  const [occupiedTables, setOccupiedTables] = useState<string[]>([]);
  
  // Hook para reproducir sonidos
  const { playSound } = useSound();
  
  // Escuchar eventos de órdenes
  useEffect(() => {
    const handleOrderEvent = (event: OrderEvent) => {
      // Si una orden cambia a estado 'ready', hacer parpadear la mesa
      if (event.newStatus === 'ready') {
        // Reproducir sonido de notificación
        playSound('notification');
        
        // Agregar el tableId al array de mesas parpadeantes
        setBlinkingTables(prev => [...prev, event.tableId]);
        
        // Después de 10 segundos, detener el parpadeo
        setTimeout(() => {
          setBlinkingTables(prev => prev.filter(id => id !== event.tableId));
        }, 10000);
      }
    };
    
    // Suscribirse al evento
    const unsubscribe = orderEvents.addEventListener(handleOrderEvent);
    
    // Limpiar suscripción al desmontar
    return () => {
      unsubscribe();
    };
  }, [playSound]);

  // Detectar cambios en el estado de las mesas
  useEffect(() => {
    tables.forEach(table => {
      if (table.status === "occupied" && !occupiedTables.includes(table.id)) {
        // Nueva mesa ocupada detectada
        setOccupiedTables(prev => [...prev, table.id]);
        
        // Después de 3 segundos, quitar la animación
        setTimeout(() => {
          setOccupiedTables(prev => prev.filter(id => id !== table.id));
        }, 3000);
      }
    });
  }, [tables]);

  const handleTableDragEnd = (table: Table, x: number, y: number) => {
    if (onTableMove) {
      onTableMove(table.id, x, y);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-medium">Mapa del Restaurante</h3>
        <div className="flex space-x-2">
          {editMode && (
            <div className="mr-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
              Modo Edición
            </div>
          )}
          <button 
            className="bg-muted hover:bg-muted/80 px-2 py-1 rounded text-sm" 
            onClick={() => setScale(prev => Math.min(prev + 0.1, 1.5))}
          >
            +
          </button>
          <button 
            className="bg-muted hover:bg-muted/80 px-2 py-1 rounded text-sm" 
            onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
          >
            -
          </button>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div>
          <span className="ml-2 text-sm">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
          <span className="ml-2 text-sm">Ocupada</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-500"></div>
          <span className="ml-2 text-sm">Reservada</span>
        </div>
      </div>
      
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm" 
        ref={mapContainerRef}
      >
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5"></div>
        
        <div 
          className="relative w-full h-[600px] overflow-auto"
          style={{ transform: `scale(${scale})` }}
        >
          {/* Representamos las mesas */}
          {tables.map((table) => (
            <TableItem 
              key={table.id} 
              table={table} 
              onClick={() => onTableClick(table)}
              onDragEnd={(x, y) => handleTableDragEnd(table, x, y)}
              editMode={editMode}
              isBlinking={blinkingTables.includes(table.id)}
              animateOccupied={occupiedTables.includes(table.id) || occupiedTableIds.includes(table.id)}
            />
          ))}
          
          {/* Elementos decorativos */}
          <div className="absolute top-20 left-20 w-60 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
            Barra
          </div>
          
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            Entrada
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableMap;

export type { Table, TableStatus, TableShape };
