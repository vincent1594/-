// Type definitions generated for project SPEC

export type OrderType = 'bid' | 'ask';

export interface Order {
  id: string;
  type: OrderType; // 'bid' or 'ask'
  price: number; // price per unit
  quantity: number; // quantity in MW
  owner?: string; // owner id or name
  timestamp: number; // unix ms
}

export interface MarketState {
  bids: Order[];
  asks: Order[];
  matchedOrders?: {
    buyId: string;
    sellId: string;
    price: number;
    quantity: number;
    timestamp: number;
  }[];
  clearingPrice?: number;
  clearingQuantity?: number;
}

export interface ForecastPoint {
  timestamp: number;
  value: number;
}

export interface ForecastCurve {
  horizonStart: number;
  horizonEnd: number;
  points: ForecastPoint[];
}

export interface DispatchSuggestion {
  resourceId: string;
  suggestedOutput: number; // MW
  minOutput?: number;
  maxOutput?: number;
  cost?: number;
}

export interface DREvent {
  id: string;
  active: boolean;
  rate: number; // payment rate or penalty
  affectedCustomers: { id: string; expectedReduction: number }[];
  startTime?: number;
  endTime?: number;
}

export interface Bus {
  id: string;
  name?: string;
  voltage?: number; // kV
  loadMw?: number;
}

export interface Line {
  id: string;
  from: string; // bus id
  to: string; // bus id
  capacityMw: number;
  flowMw?: number;
}

export interface NetworkModel {
  buses: Bus[];
  lines: Line[];
}

export interface AppState {
  market: MarketState;
  forecast?: ForecastCurve;
  dispatch?: DispatchSuggestion[];
  drEvent?: DREvent;
  network?: NetworkModel;
}
