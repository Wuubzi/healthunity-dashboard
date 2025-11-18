import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './Components/Sidebar/sidebar';
@Component({
  selector: 'app-root',
  template: ` <app-sidebar>
    <router-outlet></router-outlet>
  </app-sidebar>`,
  standalone: true,
  imports: [RouterOutlet, Sidebar],
})
export class App {
  protected readonly title = signal('HealthUnity');
}
