export type ReplayStep = number | ['b', number] | ['r'] | ['c'];
export class GameEngine {
  constructor(options?: { random?: () => number; onEvent?: (event: Record<string, unknown>) => void; record?: boolean; orders?: boolean });
  state: 'ready' | 'playing' | 'paused' | 'finished';
  score: number;
  served: number;
  elapsed: number;
  history: ReplayStep[];
  start(seed?: number): void;
  update(dt: number): void;
  beginCharge(lane: number): boolean;
  releaseCharge(): boolean;
  cancelCharge(): void;
}
