
import * as React from "react";

// Format: { THEME_NAME: CSS_SELECTOR }
// Adding a safety check to ensure THEMES is not null or undefined
export const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};
