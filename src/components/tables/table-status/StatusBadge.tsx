import { TableStatus } from "@/hooks/use-tables";

type StatusBadgeProps = {
  status: TableStatus;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusText = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "reserved":
        return "Reservada";
      default:
        return status;
    }
  };

  const getStatusClass = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "table-available";
      case "occupied":
        return "table-occupied";
      case "reserved":
        return "table-reserved";
      default:
        return "";
    }
  };

  return (
    <span className={`status-pill ${getStatusClass(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

export default StatusBadge;
