import { Routes } from '@angular/router';
import { Home } from './Pages/Home/home';
import { Citas } from './Pages/Citas/citas';
import { Calendar } from './Pages/Calendar/calendar';
import { Disponibilidad } from './Pages/Disponiblidad/disponibilidad';
import { authGuard } from './Guards/Auth';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Inicio',
    canActivate: [authGuard],
  },
  {
    path: 'citas',
    component: Citas,
    title: 'Mis Citas',
    canActivate: [authGuard],
  },
  {
    path: 'calendario',
    component: Calendar,
    title: 'Calendario',
    canActivate: [authGuard],
  },
  {
    path: 'disponibilidad',
    component: Disponibilidad,
    title: 'Disponibilidad',
    canActivate: [authGuard],
  },
];
