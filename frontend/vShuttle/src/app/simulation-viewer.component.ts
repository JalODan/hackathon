import { Component, OnDestroy, effect, signal, computed, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SimulationStoreService } from './simulation-store.service';

@Component({
  standalone: true,
  selector: 'app-simulation-viewer',
  imports: [CommonModule],
  template: `
    <div class="page" [ngClass]="getActionClass()">
      <header class="page__header">
        <h1>Simulation Viewer</h1>
        <button type="button" class="close" (click)="back()" aria-label="Go back">
          ← Back
        </button>
        <div class="countdown-timer">
          {{ countdown() }}s
        </div>
      </header>

      <div class="page__content">
        <ng-container [ngSwitch]="apiResult()?.action">
          <ng-container *ngSwitchCase="'GO'">
            <div class="action-text">GO</div>
          </ng-container>
          <ng-container *ngSwitchCase="'STOP'">
            <div class="action-text">STOP</div>
          </ng-container>
          <ng-container *ngSwitchCase="'HUMAN_CONFIRMATION'">
            <div class="action-text">HUMAN CONFIRMATION</div>
            <div class="button-row">
              <button class="confirm-btn" (click)="nextItem()">Confirm</button>
              <button class="override-btn" (click)="nextItem()">Override</button>
            </div>
          </ng-container>
          <ng-container *ngSwitchDefault>
            <div class="item">
              <div class="item__key">{{ currentKey }}</div>
              <pre class="item__value">{{ apiResult() | json }}</pre>
            </div>
          </ng-container>
        </ng-container>
      </div>

      <div class="page__content collapsible scrollable">
        <button class="collapse-toggle" (click)="toggleCollapse()">
          {{ collapsed ? 'Show request/response details' : 'Hide request/response details' }}
        </button>
        <div *ngIf="!collapsed" class="columns">
          <div class="column">
            <h3>Request</h3>
            <pre>{{ currentValue | json }}</pre>
          </div>
          <div class="column">
            <h3>Response</h3>
            <pre>{{ apiResult() | json }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
        box-sizing: border-box;
        background: #f4f6fb;
        padding-top: 3.5rem;
        transition: background 0.3s;
      }
      .page.go {
        background: #2ecc40 !important;
      }
      .page.stop {
        background: #e74c3c !important;
      }
      .page.human {
        background: #ffe066 !important;
      }
      .action-text {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        margin-top: 2rem;
        color: #222;
      }
      .button-row {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 2rem;
      }
      .confirm-btn {
        background: #2ecc40;
        color: white;
        font-size: 1.5rem;
        padding: 1rem 3rem;
        border: none;
        border-radius: 1rem;
        cursor: pointer;
        font-weight: bold;
      }
      .override-btn {
        background: #e74c3c;
        color: white;
        font-size: 1.5rem;
        padding: 1rem 3rem;
        border: none;
        border-radius: 1rem;
        cursor: pointer;
        font-weight: bold;
      }
      .countdown-timer {
        position: absolute;
        top: 4.5rem;
        right: 1rem;
        font-size: 1.25rem;
        font-weight: 600;
        color: #3a3a3a;
        background: #eaf0fa;
        padding: 0.4rem 1rem;
        border-radius: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        z-index: 1;
      }
      .page__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.25rem;
        position: relative;
      }
      .page__header h1 {
        margin: 0;
        font-size: 1.75rem;
      }
      .close {
        padding: 0.5rem 0.75rem;
        border: 1px solid hsl(220 12% 78%);
        background: white;
        border-radius: 0.5rem;
        cursor: pointer;
      }
      .page__content {
        flex: 1;
        overflow: auto;
        background: white;
        border-radius: 1rem;
        padding: 1.25rem;
        margin-bottom: 1.25rem;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
      }
      .page__content:last-child {
       flex: 0.25;
      }
      .item__key {
        font-weight: 700;
        margin-bottom: 0.75rem;
      }
      pre {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
          'Courier New', monospace;
        font-size: 0.9rem;
        white-space: pre-wrap;
        word-break: break-word;
      }
      .columns {
        display: flex;
        gap: 2rem;
      }
      .column {
        flex: 1;
        background: #f8f8fa;
        border-radius: 1rem;
        padding: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .column h3 {
        margin-top: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
      }
      .column pre {
        background: none;
        border: none;
        font-size: 1rem;
        color: #222;
      }
      .collapsible {
        margin-bottom: 1.25rem;
      }
      .collapse-toggle {
        background: #eaf0fa;
        color: #3a3a3a;
        border: none;
        border-radius: 0.5rem;
        padding: 0.5rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .scrollable {
        max-height: 350px;
        overflow-y: auto;
      }
      .action-btn {
        display: block;
        margin: 2rem auto 0 auto;
        background: #222;
        color: #fff;
        font-size: 2rem;
        font-weight: bold;
        border: none;
        border-radius: 1rem;
        padding: 1rem 3rem;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
    `
  ]
})
export class SimulationViewerComponent implements OnDestroy {
  private readonly items = signal<[string, unknown][]>([]);
  private readonly currentIndex = signal(0);
  countdown = signal(4);
  private countdownIntervalId: number | null = null;
  private lastSentIndex: number | null = null;
  apiResult: WritableSignal<any> = signal(null);
  collapsed = true;

  constructor(private readonly store: SimulationStoreService, private readonly router: Router) {
    effect(() => {
      const raw = this.store.data();
      const entries: [string, unknown][] = Array.isArray(raw)
        ? raw.map((value, index) => [String(index), value])
        : raw && typeof raw === 'object'
        ? Object.entries(raw as Record<string, unknown>)
        : [];

      this.items.set(entries);
      this.currentIndex.set(0);
      this.restartRotation();
    });

    // Watch for currentValue changes and send to API
    effect(() => {
      const idx = this.currentIndex();
      if (this.lastSentIndex === idx) return;
      this.lastSentIndex = idx;
      const value = this.currentValue;
      if (value != null) {
        this.apiResult.set('Loading...');
        fetch('http://127.0.0.1:8000/api/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value)
        })
          .then(r => r.json())
          .then(data => {
            this.apiResult.set(data);
            this.startCountdown();
          })
          .catch(e => {
            this.apiResult.set({ error: e.message });
            this.startCountdown();
          });
      } else {
        this.apiResult.set(null);
        this.stopCountdown();
      }
    });
  }

  get currentKey() {
    return this.items()[this.currentIndex()]?.[0] ?? '';
  }

  get currentValue() {
    return this.items()[this.currentIndex()]?.[1] ?? null;
  }

  private startCountdown() {
    this.stopCountdown();
    const action = this.apiResult()?.action;
    const startValue = action === 'HUMAN_CONFIRMATION' ? 2 : 4;
    this.countdown.set(startValue);
    this.countdownIntervalId = window.setInterval(() => {
      const value = this.countdown();
      if (value > 1) {
        this.countdown.set(value - 1);
      } else {
        const next = (this.currentIndex() + 1) % this.items().length;
        this.currentIndex.set(next);
        this.countdown.set(startValue);
        this.stopCountdown(); // stop until next response
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownIntervalId !== null) {
      window.clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.countdown.set(4);
  }

  private restartRotation() {
    this.stopCountdown();
    if (!this.items().length) {
      return;
    }
    this.currentIndex.set(0);
    // countdown will start after API response
  }

  back() {
    this.stopCountdown();
    this.store.clear();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  getActionClass() {
    const action = this.apiResult()?.action;
    if (action === 'GO') return 'go';
    if (action === 'STOP') return 'stop';
    if (action === 'HUMAN_CONFIRMATION') return 'human';
    return '';
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  nextItem() {
    const next = (this.currentIndex() + 1) % this.items().length;
    this.currentIndex.set(next);
    this.stopCountdown(); // stop timer until API response
  }
}
