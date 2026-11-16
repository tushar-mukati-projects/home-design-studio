export const FLAT = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

export const HAIRLINE = { strokeScaleEnabled: false, listening: false, ...FLAT } as const;
