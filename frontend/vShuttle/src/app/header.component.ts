import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="vshuttle-header">
      <span class="vshuttle-title" (click)="goHome()">vShuttle</span>
    </header>
  `,
  styles: [`
    .vshuttle-header {
      width: 100vw;
      height: 3.5rem;
      background: white;
      display: flex;
      align-items: center;
      padding-left: 2rem;
      box-sizing: border-box;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 100;
    }
    .vshuttle-title {
      font-family: "Inter Tight", sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: black;
      cursor: pointer;
      user-select: none;
      letter-spacing: -0.05rem;
      transition: text-shadow 0.2s;
    }
    .vshuttle-title:hover {
      text-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
  `]
})
export class HeaderComponent {
  constructor(private router: Router) {}
  goHome() {
    this.router.navigate(['/']);
  }
}
