export type UnitType = 'length' | 'weight' | 'science' | 'currency' | 'temperature' | 'volume';

export interface Unit {
  name: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface Category {
  id: UnitType;
  name: string;
  units: Unit[];
  isCurrency?: boolean;
}

export interface HistoryItem {
  value: string;
  from: string;
  to: string;
  result: string;
}
