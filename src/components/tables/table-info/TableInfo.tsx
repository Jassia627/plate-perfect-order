import { Clock, Users, Calendar } from "lucide-react";
import { Table } from "@/hooks/use-tables";

type TableInfoProps = {
  table: Table;
};

const TableInfo = ({ table }: TableInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Users size={18} className="mr-2 text-muted-foreground" />
        <span>{table.capacity} personas</span>
      </div>
      
      {table.status === "occupied" && table.startTime && (
        <div className="flex items-center">
          <Clock size={18} className="mr-2 text-muted-foreground" />
          <span>Desde: {table.startTime}</span>
        </div>
      )}
      
      {table.status === "reserved" && (
        <div className="flex items-center">
          <Calendar size={18} className="mr-2 text-muted-foreground" />
          <span>Reserva: Hoy, 20:00</span>
        </div>
      )}
      
      {table.status === "occupied" && table.server && (
        <div className="flex items-center">
          <span className="mr-2 text-muted-foreground">Mesero:</span>
          <span>{table.server}</span>
        </div>
      )}
    </div>
  );
};

export default TableInfo;
