
import React from "react";
import * as RechartsPrimitive from "recharts";

export const BarChart: React.FC<React.PropsWithChildren<React.ComponentProps<typeof RechartsPrimitive.BarChart>>> = ({ children, ...props }) => {
  return <RechartsPrimitive.BarChart {...props}>{children}</RechartsPrimitive.BarChart>;
};
