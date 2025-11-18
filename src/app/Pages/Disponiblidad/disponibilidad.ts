import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faTrash,
  faClock,
  faCalendar,
  faSave,
  faToggleOn,
  faToggleOff,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { DisponibilidadService } from '../../Services/Disponibilidad';
import {
  HorarioDoctorResponse,
  SaveHorarioRequest,
  SaveHorarioDetalle,
  HorarioStatsResponse,
} from '../../Interface/Disponibilidad';

interface TimeSlot {
  id: string | null;
  idHorarioDoctor: number | null;
  startTime: string;
  endTime: string;
}

interface DaySchedule {
  day: string;
  dayName: string;
  diaSemana: number; // 1=Lunes, 2=Martes, etc.
  enabled: boolean;
  timeSlots: TimeSlot[];
}

@Component({
  selector: 'app-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './disponibilidad.html',
})
export class Disponibilidad implements OnInit {
  // Services
  private disponibilidadService = inject(DisponibilidadService);

  // Icons
  faPlus = faPlus;
  faTrash = faTrash;
  faClock = faClock;
  faCalendar = faCalendar;
  faSave = faSave;
  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;
  faSpinner = faSpinner;

  // State
  schedule = signal<DaySchedule[]>(this.getDefaultSchedule());
  appointmentDuration = signal<number>(30);
  breakTime = signal<number>(15);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  // Stats
  statsLoading = signal<boolean>(false);
  stats = signal<HorarioStatsResponse | null>(null);

  // Obtener idDoctor del usuario actual (ajusta según tu implementación)
  private idDoctor = 51; // TODO: Obtener del AuthService o del usuario logueado

  ngOnInit() {
    this.loadHorarioDoctor();
    this.loadStats();
  }

  private getDefaultSchedule(): DaySchedule[] {
    return [
      { day: 'monday', dayName: 'Lunes', diaSemana: 1, enabled: false, timeSlots: [] },
      { day: 'tuesday', dayName: 'Martes', diaSemana: 2, enabled: false, timeSlots: [] },
      { day: 'wednesday', dayName: 'Miércoles', diaSemana: 3, enabled: false, timeSlots: [] },
      { day: 'thursday', dayName: 'Jueves', diaSemana: 4, enabled: false, timeSlots: [] },
      { day: 'friday', dayName: 'Viernes', diaSemana: 5, enabled: false, timeSlots: [] },
      { day: 'saturday', dayName: 'Sábado', diaSemana: 6, enabled: false, timeSlots: [] },
      { day: 'sunday', dayName: 'Domingo', diaSemana: 7, enabled: false, timeSlots: [] },
    ];
  }

  loadStats() {
    this.statsLoading.set(true);
    this.disponibilidadService.getHorarioStats(this.idDoctor).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.statsLoading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.statsLoading.set(false);
      },
    });
  }

  loadHorarioDoctor() {
    this.loading.set(true);
    this.disponibilidadService.getHorarioDoctor(this.idDoctor).subscribe({
      next: (response) => {
        this.mapResponseToSchedule(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar horario:', error);
        this.loading.set(false);
      },
    });
  }

  private mapResponseToSchedule(response: HorarioDoctorResponse) {
    this.appointmentDuration.set(response.duracionCita);
    this.breakTime.set(response.tiempoDescanso);

    const newSchedule = this.getDefaultSchedule();

    // Agrupar horarios por día
    const horariosPorDia = new Map<number, typeof response.horarios>();
    response.horarios.forEach((horario) => {
      if (!horariosPorDia.has(horario.diaSemana)) {
        horariosPorDia.set(horario.diaSemana, []);
      }
      horariosPorDia.get(horario.diaSemana)!.push(horario);
    });

    // Actualizar el schedule
    newSchedule.forEach((day) => {
      const horariosDelDia = horariosPorDia.get(day.diaSemana);
      if (horariosDelDia && horariosDelDia.length > 0) {
        day.enabled = true;
        day.timeSlots = horariosDelDia.map((h) => ({
          id: h.idHorarioDoctor?.toString() || null,
          idHorarioDoctor: h.idHorarioDoctor,
          startTime: this.formatTimeFromBackend(h.horaInicio),
          endTime: this.formatTimeFromBackend(h.horaFin),
        }));
      }
    });

    this.schedule.set(newSchedule);
  }

  private formatTimeFromBackend(time: string): string {
    // Convierte "08:00:00" a "08:00"
    return time.substring(0, 5);
  }

  private formatTimeForBackend(time: string): string {
    // Convierte "08:00" a "08:00:00"
    return `${time}:00`;
  }

  toggleDay(daySchedule: DaySchedule) {
    const currentSchedule = this.schedule();
    const updatedSchedule = currentSchedule.map((day) => {
      if (day.day === daySchedule.day) {
        return {
          ...day,
          enabled: !day.enabled,
          timeSlots:
            !day.enabled && day.timeSlots.length === 0
              ? [
                  {
                    id: null,
                    idHorarioDoctor: null,
                    startTime: '08:00',
                    endTime: '17:00',
                  },
                ]
              : day.timeSlots,
        };
      }
      return day;
    });
    this.schedule.set(updatedSchedule);
  }

  addTimeSlot(daySchedule: DaySchedule) {
    // Límite máximo de 2 horarios por día
    if (daySchedule.timeSlots.length >= 2) {
      alert('Solo puedes agregar un máximo de 2 horarios por día (mañana y tarde)');
      return;
    }

    const currentSchedule = this.schedule();
    const updatedSchedule = currentSchedule.map((day) => {
      if (day.day === daySchedule.day) {
        const lastSlot = day.timeSlots[day.timeSlots.length - 1];
        const newStartTime = lastSlot ? this.addMinutes(lastSlot.endTime, 60) : '08:00';
        const newEndTime = this.addMinutes(newStartTime, 240);

        return {
          ...day,
          timeSlots: [
            ...day.timeSlots,
            {
              id: null,
              idHorarioDoctor: null,
              startTime: newStartTime,
              endTime: newEndTime,
            },
          ],
        };
      }
      return day;
    });
    this.schedule.set(updatedSchedule);
  }

  canAddMoreTimeSlots(daySchedule: DaySchedule): boolean {
    return daySchedule.enabled && daySchedule.timeSlots.length < 2;
  }

  removeTimeSlot(daySchedule: DaySchedule, slotId: string | null) {
    const currentSchedule = this.schedule();
    const updatedSchedule = currentSchedule.map((day) => {
      if (day.day === daySchedule.day) {
        return {
          ...day,
          timeSlots: day.timeSlots.filter(
            (slot) => (slot.id || slot.idHorarioDoctor?.toString()) !== slotId
          ),
        };
      }
      return day;
    });
    this.schedule.set(updatedSchedule);
  }

  updateTimeSlot(
    daySchedule: DaySchedule,
    slotId: string | null,
    field: 'startTime' | 'endTime',
    value: string
  ) {
    const currentSchedule = this.schedule();
    const updatedSchedule = currentSchedule.map((day) => {
      if (day.day === daySchedule.day) {
        return {
          ...day,
          timeSlots: day.timeSlots.map((slot) =>
            (slot.id || slot.idHorarioDoctor?.toString()) === slotId
              ? { ...slot, [field]: value }
              : slot
          ),
        };
      }
      return day;
    });
    this.schedule.set(updatedSchedule);
  }

  copyScheduleToAll(sourceDaySchedule: DaySchedule) {
    const currentSchedule = this.schedule();
    const updatedSchedule = currentSchedule.map((day) => {
      if (day.day === sourceDaySchedule.day || !day.enabled) {
        return day;
      }

      return {
        ...day,
        timeSlots: sourceDaySchedule.timeSlots.map((slot) => ({
          id: null,
          idHorarioDoctor: null,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
      };
    });
    this.schedule.set(updatedSchedule);
  }

  saveSchedule() {
    this.saving.set(true);

    const horarios: SaveHorarioDetalle[] = [];

    this.schedule().forEach((day) => {
      if (day.enabled && day.timeSlots.length > 0) {
        day.timeSlots.forEach((slot) => {
          horarios.push({
            idHorarioDoctor: slot.idHorarioDoctor,
            diaSemana: day.diaSemana,
            horaInicio: this.formatTimeForBackend(slot.startTime),
            horaFin: this.formatTimeForBackend(slot.endTime),
            activo: true,
          });
        });
      }
    });

    const request: SaveHorarioRequest = {
      idDoctor: this.idDoctor,
      duracionCita: this.appointmentDuration(),
      tiempoDescanso: this.breakTime(),
      horarios,
    };

    this.disponibilidadService.saveHorarioDoctor(request).subscribe({
      next: (response) => {
        console.log('Horario guardado exitosamente:', response);
        alert('Horario guardado exitosamente');
        this.mapResponseToSchedule(response);
        this.loadStats(); // Recargar estadísticas
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error al guardar horario:', error);
        alert('Error al guardar el horario. Por favor intente nuevamente.');
        this.saving.set(false);
      },
    });
  }

  // Métodos de cálculo
  getTotalHoursPerWeek(): number {
    if (this.stats()) {
      return this.stats()!.horasSemanales;
    }

    let total = 0;
    this.schedule().forEach((day) => {
      if (day.enabled) {
        day.timeSlots.forEach((slot) => {
          const start = this.timeToMinutes(slot.startTime);
          const end = this.timeToMinutes(slot.endTime);
          total += (end - start) / 60;
        });
      }
    });
    return Math.round(total * 10) / 10;
  }

  getAppointmentsPerDay(daySchedule: DaySchedule): number {
    if (!daySchedule.enabled) return 0;

    let totalMinutes = 0;
    daySchedule.timeSlots.forEach((slot) => {
      const start = this.timeToMinutes(slot.startTime);
      const end = this.timeToMinutes(slot.endTime);
      totalMinutes += end - start;
    });

    const slotDuration = this.appointmentDuration() + this.breakTime();
    return Math.floor(totalMinutes / slotDuration);
  }

  getTotalAppointmentsPerWeek(): number {
    if (this.stats()) {
      return this.stats()!.citasSemanales;
    }

    let total = 0;
    this.schedule().forEach((day) => {
      total += this.getAppointmentsPerDay(day);
    });
    return total;
  }

  getActiveDaysCount(): number {
    if (this.stats()) {
      return this.stats()!.diasActivos;
    }

    return this.schedule().filter((d) => d.enabled).length;
  }

  getSlotDuration(startTime: string, endTime: string): string {
    const minutes = this.timeToMinutes(endTime) - this.timeToMinutes(startTime);
    return (minutes / 60).toFixed(1);
  }

  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private addMinutes(time: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(time) + minutes;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const mins = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  validateTimeSlot(slot: TimeSlot): boolean {
    return this.timeToMinutes(slot.startTime) < this.timeToMinutes(slot.endTime);
  }
}
