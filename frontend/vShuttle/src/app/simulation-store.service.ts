import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SimulationStoreService {
  private readonly _data = signal<Record<string, unknown> | unknown[] | null>(null);

  readonly data = this._data;

  setData(value: Record<string, unknown> | unknown[] | null) {
    this._data.set(value);
  }

  clear() {
    this._data.set(null);
  }
}
