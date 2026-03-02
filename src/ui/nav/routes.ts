/**
 * Canonical path builders for all game routes.
 * Use these everywhere instead of hard-coded strings so route changes
 * require only a single edit here.
 */
export const routes = {
  welcome: (): string => "/",
  seal: (): string => "/seal",
  vessels: (): string => "/vessels",
  bindVessel: (slotIndex?: number): string =>
    slotIndex !== undefined
      ? `/vessels/bind?slotIndex=${slotIndex}`
      : "/vessels/bind",
  shrine: (slotIndex: number): string => `/shrine?slotIndex=${slotIndex}`,
  combat: (slotIndex: number): string =>
    `/shrine/combat?slotIndex=${slotIndex}`,
} as const;
