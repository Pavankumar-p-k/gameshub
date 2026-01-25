// Unique vibrant colors for each number 1-9
export const NUMBER_COLORS: Record<number, string> = {
  1: "#E63946", // Vibrant Red
  2: "#00D9FF", // Vibrant Cyan
  3: "#FFD60A", // Vibrant Gold
  4: "#00B4D8", // Vibrant Blue
  5: "#F72585", // Vibrant Magenta
  6: "#FF006E", // Vibrant Hot Pink
  7: "#06FFA5", // Vibrant Emerald
  8: "#FF9F1C", // Vibrant Orange
  9: "#9D4EDD", // Vibrant Purple
};

// Light versions for background with better contrast
export const NUMBER_COLORS_LIGHT: Record<number, string> = {
  1: "#FFE5E5",
  2: "#E0F7FF",
  3: "#FFFACD",
  4: "#E0F7FF",
  5: "#FFE5F5",
  6: "#FFE5F0",
  7: "#E0FFED",
  8: "#FFF0E5",
  9: "#F5E5FF",
};

export function getNumberColor(num: number): string {
  return NUMBER_COLORS[num] || "#000000";
}

export function getNumberColorLight(num: number): string {
  return NUMBER_COLORS_LIGHT[num] || "#FFFFFF";
}
