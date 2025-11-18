// calendar.component.ts - VERSIÓN CORREGIDA
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faCalendarDay,
  faClock,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { CalendarService } from '../../Services/Calendar';
import { SidebarService } from '../../Services/Sidebar';
import { CalendarioAnual, CitaSimple } from '../../Interface/Calendar';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  appointments: CitaSimple[];
  dateKey: string; // Agregamos la clave de fecha
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './calendar.html',
})
export class Calendar implements OnInit {
  private calendarService = inject(CalendarService);
  private sidebarService = inject(SidebarService);

  // Icons
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faCalendarDay = faCalendarDay;
  faClock = faClock;
  faUser = faUser;

  currentDate = signal(new Date());
  selectedDate = signal<Date | null>(null);
  calendarioData = signal<CalendarioAnual | null>(null);
  isLoading = signal(true);
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Mapa de citas por fecha (formato: 'YYYY-MM-DD')
  appointmentsByDate = signal<Map<string, CitaSimple[]>>(new Map());

  ngOnInit() {
    this.loadCalendar();
  }

  loadCalendar() {
    const idDoctor = this.sidebarService.getDoctorId();

    if (!idDoctor) {
      console.error('No se encontró el ID del doctor');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    this.calendarService.getCalendarioCitas(idDoctor).subscribe({
      next: (data) => {
        console.log('Datos del calendario recibidos:', data);
        this.calendarioData.set(data);
        this.processCalendarData(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error cargando calendario:', error);
        this.isLoading.set(false);
      },
    });
  }

  processCalendarData(data: CalendarioAnual) {
    const appointmentsMap = new Map<string, CitaSimple[]>();

    // Procesar todos los meses y días
    data.meses.forEach((mes) => {
      mes.dias.forEach((dia) => {
        // La fecha ya viene en formato YYYY-MM-DD del backend
        console.log(`Procesando fecha: ${dia.fecha} con ${dia.totalCitas} citas`);
        appointmentsMap.set(dia.fecha, dia.citas);
      });
    });

    console.log('Mapa de citas procesado:', appointmentsMap);
    this.appointmentsByDate.set(appointmentsMap);
  }

  // Función mejorada para formatear fecha a clave
  formatDateToKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    return key;
  }

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const currentYear = new Date().getFullYear();

    // Solo permitir navegar en el año actual
    if (year !== currentYear) {
      return [];
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      const dateKey = this.formatDateToKey(date);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        appointments: this.getAppointmentsForDate(date),
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = this.formatDateToKey(date);
      const appointments = this.getAppointmentsForDate(date);

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        dateKey,
        appointments,
      });
    }

    // Días del mes siguiente
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = this.formatDateToKey(date);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        dateKey,
        appointments: this.getAppointmentsForDate(date),
      });
    }

    return days;
  });

  currentMonthYear = computed(() => {
    const date = this.currentDate();
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  });

  selectedDateAppointments = computed(() => {
    const selected = this.selectedDate();
    if (!selected) return [];

    const dateKey = this.formatDateToKey(selected);
    const appointments = this.appointmentsByDate().get(dateKey) || [];

    console.log(`Citas para ${dateKey}:`, appointments);
    return appointments;
  });

  previousMonth() {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    const currentYear = new Date().getFullYear();

    // Solo permitir navegar dentro del año actual
    if (newDate.getFullYear() === currentYear) {
      this.currentDate.set(newDate);
    }
  }

  nextMonth() {
    const current = this.currentDate();
    const newDate = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    const currentYear = new Date().getFullYear();

    // Solo permitir navegar dentro del año actual
    if (newDate.getFullYear() === currentYear) {
      this.currentDate.set(newDate);
    }
  }

  goToToday() {
    this.currentDate.set(new Date());
    this.selectedDate.set(new Date());
  }

  selectDate(day: CalendarDay) {
    console.log('Fecha seleccionada:', day.dateKey, 'Citas:', day.appointments);
    this.selectedDate.set(day.date);
  }

  getAppointmentsForDate(date: Date): CitaSimple[] {
    const dateStr = this.formatDateToKey(date);
    const appointments = this.appointmentsByDate().get(dateStr) || [];
    return appointments;
  }

  formatTime(hora: string): string {
    const [hours, minutes] = hora.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getStatusColor(status: string): string {
    const statusLower = status.toLowerCase();
    const colors = {
      confirmada: 'bg-green-500',
      pendiente: 'bg-yellow-500',
      cancelada: 'bg-red-500',
      completada: 'bg-blue-500',
    };
    return colors[statusLower as keyof typeof colors] || 'bg-gray-500';
  }

  getStatusLabel(status: string): string {
    const statusLower = status.toLowerCase();
    const labels = {
      confirmada: 'Confirmada',
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
      completada: 'Completada',
    };
    return labels[statusLower as keyof typeof labels] || status;
  }

  formatSelectedDate(): string {
    const selected = this.selectedDate();
    if (!selected) return '';
    return selected.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  canGoToPreviousMonth(): boolean {
    const current = this.currentDate();
    const currentYear = new Date().getFullYear();
    return current.getMonth() > 0 || current.getFullYear() > currentYear;
  }

  canGoToNextMonth(): boolean {
    const current = this.currentDate();
    const currentYear = new Date().getFullYear();
    return current.getMonth() < 11 && current.getFullYear() === currentYear;
  }
}
