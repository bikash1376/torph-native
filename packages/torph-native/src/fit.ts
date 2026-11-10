/** How far a value `width` wide must shrink to fit within `maxWidth`. Never grows. */
export function fitScale(width: number, maxWidth?: number): number {
  return maxWidth && width > maxWidth ? maxWidth / width : 1;
}
