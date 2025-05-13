
import React from "react";
import * as RechartsPrimitive from "recharts";

export const AreaChart: React.FC<React.PropsWithChildren<React.ComponentProps<typeof RechartsPrimitive.AreaChart>>> = ({ children, ...props }) => {
  return <RechartsPrimitive.AreaChart {...props}>{children}</RechartsPrimitive.AreaChart>;
};
