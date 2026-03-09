import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SimulationStoreService } from './simulation-store.service';

@Component({
  standalone: true,
  selector: 'app-home',
  template: `
    <main class="main">
      <div class="cover-photo-container">
        <img class="cover-photo" src="cover-photo.png" alt="Cover Photo" />
      </div>
      <div class="content">
        <div>
          <input #fileInput type="file" accept=".json" hidden (change)="onFileSelected($event, fileInput)" />
          <div class="pill-group">
            <button type="button" class="pill" (click)="fileInput.click()">
              <span>Load Simulation File</span>
              <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        --bright-blue: oklch(51.01% 0.274 263.83);
        --electric-violet: oklch(53.18% 0.28 296.97);
        --french-violet: oklch(47.66% 0.246 305.88);
        --vivid-pink: oklch(69.02% 0.277 332.77);
        --hot-red: oklch(61.42% 0.238 15.34);
        --orange-red: oklch(63.32% 0.24 31.68);

        --gray-900: oklch(19.37% 0.006 300.98);
        --gray-700: oklch(36.98% 0.014 302.71);
        --gray-400: oklch(70.9% 0.015 304.04);

        --red-to-pink-to-purple-vertical-gradient: linear-gradient(
          180deg,
          var(--orange-red) 0%,
          var(--vivid-pink) 50%,
          var(--electric-violet) 100%
        );

        --red-to-pink-to-purple-horizontal-gradient: linear-gradient(
          90deg,
          var(--orange-red) 0%,
          var(--vivid-pink) 50%,
          var(--electric-violet) 100%
        );

        --pill-accent: var(--bright-blue);

        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
          "Segoe UI Symbol";
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        display: block;
        height: 100dvh;
      }

      h1 {
        font-size: 3.125rem;
        color: var(--gray-900);
        font-weight: 500;
        line-height: 100%;
        letter-spacing: -0.125rem;
        margin: 0;
        font-family: "Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
          "Segoe UI Symbol";
      }

      p {
        margin: 0;
        color: var(--gray-700);
      }

      main {
        width: 100%;
        min-height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        box-sizing: inherit;
        position: relative;
      }

      .angular-logo {
        max-width: 9.2rem;
      }

      .content {
        display: flex;
        justify-content: space-around;
        width: 100%;
        max-width: 700px;
        margin-bottom: 3rem;
        position: absolute;
        bottom: 2rem;
        left: 0;
        width: 100vw;
        z-index: 2;
      }

      .content h1 {
        margin-top: 1.75rem;
      }

      .content p {
        margin-top: 1.5rem;
      }

      .divider {
        width: 1px;
        background: var(--red-to-pink-to-purple-vertical-gradient);
        margin-inline: 0.5rem;
      }

      .pill-group {
        display: flex;
        flex-direction: column;
        align-items: start;
        flex-wrap: wrap;
        gap: 1.25rem;
        margin-top: 0;
      }

      .pill {
        display: flex;
        align-items: center;
        --pill-accent: var(--bright-blue);
        background: color-mix(in srgb, var(--pill-accent) 5%, transparent);
        color: var(--pill-accent);
        padding-inline: 1.5rem;
        padding-block: 0.75rem;
        border-radius: 2.75rem;
        border: 0;
        transition: background 0.3s ease;
        font-family: var(--inter-font);
        font-size: 1.50rem;
        font-style: normal;
        font-weight: 500;
        line-height: 2.8rem;
        letter-spacing: -0.00875rem;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
      }

      .pill:hover {
        background: color-mix(in srgb, var(--pill-accent) 15%, transparent);
      }

      .pill-group .pill:nth-child(6n + 1) {
        --pill-accent: var(--bright-blue);
      }
      .pill-group .pill:nth-child(6n + 2) {
        --pill-accent: var(--electric-violet);
      }
      .pill-group .pill:nth-child(6n + 3) {
        --pill-accent: var(--french-violet);
      }

      .pill-group .pill:nth-child(6n + 4),
      .pill-group .pill:nth-child(6n + 5),
      .pill-group .pill:nth-child(6n + 6) {
        --pill-accent: var(--hot-red);
      }

      .pill-group svg {
        margin-inline-start: 0.25rem;
      }

      .social-links {
        display: flex;
        align-items: center;
        gap: 0.73rem;
        margin-top: 1.5rem;
      }

      .social-links path {
        transition: fill 0.3s ease;
        fill: var(--gray-400);
      }

      .social-links a:hover svg path {
        fill: var(--gray-900);
      }

      @media screen and (max-width: 650px) {
        .content {
          flex-direction: column;
          width: max-content;
        }

        .divider {
          height: 1px;
          width: 100%;
          background: var(--red-to-pink-to-purple-horizontal-gradient);
          margin-block: 1.5rem;
        }
      }

      .cover-photo-container {
      }

      .cover-photo {
        width: 100vw;
        height: auto;
        display: block;
      }
    `
  ]
})
export class HomeComponent {
  protected readonly title = 'vShuttle';

  constructor(private readonly store: SimulationStoreService, private readonly router: Router) {}

  onFileSelected(event: Event, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const json = JSON.parse(text);
        this.store.setData(json);
        this.router.navigate(['/simulation']);
      } catch (e) {
        console.error('Failed to parse simulation JSON', e);
      }
    };
    reader.readAsText(file);

    input.value = '';
  }
}
