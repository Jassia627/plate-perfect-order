
import React from "react";
import * as RechartsPrimitive from "recharts";

export const LineChart: React.FC<React.PropsWithChildren<React.ComponentProps<typeof RechartsPrimitive.LineChart>>> = ({ children, ...props }) => {
  return <RechartsPrimitive.LineChart {...props}>{children}</RechartsPrimitive.LineChart>;
};
