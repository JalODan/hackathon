import { Component, OnDestroy, effect, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SimulationStoreService } from './simulation-store.service';

@Component({
  standalone: true,
  selector: 'app-simulation-viewer',
  imports: [CommonModule],
  template: `
    <div class="page">
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
        <div class="item">
          <div class="item__key">{{ currentKey }}</div>
          <pre class="item__value">{{ currentValue | json }}</pre>
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
        /* Add top padding to offset header height */
        padding-top: 3.5rem;
      }
      @media (max-width: 600px) {
        .page {
          padding-top: 3.5rem;
        }
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

      .page__content {
        flex: 1;
        overflow: auto;
        background: white;
        border-radius: 1rem;
        padding: 1.25rem;
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
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
    `
  ]
})
export class SimulationViewerComponent implements OnDestroy {
  private readonly items = signal<[string, unknown][]>([]);
  private readonly currentIndex = signal(0);
  countdown = signal(4);
  private countdownIntervalId: number | null = null;

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
  }

  get currentKey() {
    return this.items()[this.currentIndex()]?.[0] ?? '';
  }

  get currentValue() {
    return this.items()[this.currentIndex()]?.[1] ?? null;
  }

  private restartRotation() {
    this.stopRotation();

    if (!this.items().length) {
      return;
    }

    this.currentIndex.set(0);
    this.countdown.set(4);
    this.countdownIntervalId = window.setInterval(() => {
      const value = this.countdown();
      if (value > 1) {
        this.countdown.set(value - 1);
      } else {
        const next = (this.currentIndex() + 1) % this.items().length;
        this.currentIndex.set(next);
        this.countdown.set(4);
      }
    }, 1000);
  }

  private stopRotation() {
    if (this.countdownIntervalId !== null) {
      window.clearInterval(this.countdownIntervalId);
      this.countdownIntervalId = null;
    }
    this.countdown.set(4);
  }

  back() {
    this.stopRotation();
    this.store.clear();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.stopRotation();
  }
}
