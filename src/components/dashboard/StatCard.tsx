import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
};

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType = "neutral",
  description,
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 px-3 md:px-6 pt-3 md:pt-4">
        <CardTitle className="text-xs md:text-sm font-medium truncate max-w-[80%]">{title}</CardTitle>
        <div className="text-restaurant-primary h-4 w-4 flex-shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="px-3 md:px-6 pb-3 md:pb-4">
        <div className="text-lg md:text-2xl font-bold truncate">{value}</div>
        {change && (
          <div className="text-[10px] md:text-xs flex flex-wrap items-center mt-1">
            <span
              className={
                changeType === "positive"
                  ? "text-green-600"
                  : changeType === "negative"
                  ? "text-red-600"
                  : "text-muted-foreground"
              }
            >
              {change}
            </span>
            {description && (
              <span className="text-muted-foreground ml-1 truncate">
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
