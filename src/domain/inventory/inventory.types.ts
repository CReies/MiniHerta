export interface Inventory {
  readonly characters: ReadonlyMap<string, number>;
  readonly lightCones: ReadonlyMap<string, number>;
}

export interface SerializedInventory {
  version?: number;
  exportedAt?: string;
  characters?: Record<string, number>;
  personajes?: Record<string, number>;
  lightCones?: Record<string, number>;
  light_cones?: Record<string, number>;
  conos?: Record<string, number>;
}

export interface MutableInventory {
  characters: Map<string, number>;
  lightCones: Map<string, number>;
}
