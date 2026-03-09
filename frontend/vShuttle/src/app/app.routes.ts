import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { SimulationViewerComponent } from './simulation-viewer.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'simulation', component: SimulationViewerComponent },
];
