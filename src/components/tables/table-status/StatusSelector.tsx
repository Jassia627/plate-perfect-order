import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { TableStatus } from "@/hooks/use-tables";

type StatusSelectorProps = {
  onStatusChange: (status: TableStatus) => void;
};

const StatusSelector = ({ onStatusChange }: StatusSelectorProps) => {
  const [newStatus, setNewStatus] = useState<TableStatus | "">("");

  const handleStatusChange = () => {
    if (newStatus) {
      onStatusChange(newStatus);
      setNewStatus("");
    }
  };

  return (
    <div className="flex space-x-4 mt-4">
      <div className="flex-1">
        <Label htmlFor="change-status">Cambiar estado</Label>
        <Select 
          value={newStatus} 
          onValueChange={(value: TableStatus | "") => setNewStatus(value)}
        >
          <SelectTrigger id="change-status">
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="occupied">Ocupada</SelectItem>
            <SelectItem value="reserved">Reservada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button 
        className="mt-auto" 
        disabled={!newStatus} 
        onClick={handleStatusChange}
      >
        Actualizar
      </Button>
    </div>
  );
};

export default StatusSelector;
