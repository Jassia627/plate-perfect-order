
import * as React from "react";
import { ChartConfig, THEMES } from "./types";

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  // Early return if config is null, undefined, or empty
  if (!config || Object.keys(config).length === 0) {
    return null;
  }

  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  // Check if THEMES is defined before using Object.entries
  if (!THEMES || typeof THEMES !== 'object') {
    console.error('THEMES is undefined or not an object in ChartStyle');
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  );
};
