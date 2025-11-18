import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch,
  faFilter,
  faEllipsisV,
  faCalendar,
  faClock,
  faUser,
  faPhone,
  faEnvelope,
  faEdit,
  faTrash,
  faCheck,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faCancel,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { CitasService } from '../../Services/Citas';
import { SidebarService } from '../../Services/Sidebar';
import { CitaDetalle } from '../../Interface/Citas';

@Component({
  selector: 'app-mis-citas',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './citas.html',
})
export class Citas implements OnInit {
  private citasService = inject(CitasService);
  private sidebarService = inject(SidebarService);

  // Icons
  faSearch = faSearch;
  faFilter = faFilter;
  faEllipsisV = faEllipsisV;
  faCalendar = faCalendar;
  faClock = faClock;
  faUser = faUser;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faEdit = faEdit;
  faTrash = faTrash;
  faCheck = faCheck;
  faTimes = faTimes;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faCancel = faCancel;
  faSpinner = faSpinner;

  // State
  citas = signal<CitaDetalle[]>([]);
  isLoading = signal(true);
  selectedFilter = signal<string>('all');
  searchTerm = signal<string>('');
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);

  // Loading states para cada acción
  processingCitaId = signal<number | null>(null);
  actionType = signal<'cancelar' | 'completar' | null>(null);

  // ✅ Convertir a signal
  filterOptions = signal([
    { value: 'all', label: 'Todas', count: 0 },
    { value: 'pendiente', label: 'Pendientes', count: 0 },
    { value: 'completada', label: 'Completadas', count: 0 },
    { value: 'cancelada', label: 'Canceladas', count: 0 },
  ]);

  ngOnInit() {
    this.loadCitas();
  }

  loadCitas() {
    const idDoctor = this.sidebarService.getDoctorId();

    if (!idDoctor) {
      console.error('No se encontró el ID del doctor');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    const estado = this.selectedFilter() === 'all' ? undefined : this.selectedFilter();

    this.citasService
      .getCitasPaginadas(idDoctor, this.currentPage(), this.pageSize(), estado)
      .subscribe({
        next: (response) => {
          this.citas.set(response.citas);
          this.currentPage.set(response.currentPage);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
          this.pageSize.set(response.size);
          this.isLoading.set(false);

          // ✅ Llamar después de set isLoading
          setTimeout(() => {
            this.updateFilterCounts();
          }, 0);
        },
        error: (error) => {
          console.error('Error cargando citas:', error);
          this.isLoading.set(false);
        },
      });
  }

  updateFilterCounts() {
    const idDoctor = this.sidebarService.getDoctorId();
    if (!idDoctor) return;

    // Obtener conteos para todos los estados
    this.citasService.getCitasPaginadas(idDoctor, 0, 1000).subscribe({
      next: (response) => {
        const allCitas = response.citas;

        // ✅ Crear un nuevo array en lugar de mutar
        const updatedFilters = [
          { value: 'all', label: 'Todas', count: allCitas.length },
          {
            value: 'pendiente',
            label: 'Pendientes',
            count: allCitas.filter((c) => c.estado.toLowerCase() === 'pendiente').length,
          },
          {
            value: 'completada',
            label: 'Completadas',
            count: allCitas.filter((c) => c.estado.toLowerCase() === 'completada').length,
          },
          {
            value: 'cancelada',
            label: 'Canceladas',
            count: allCitas.filter((c) => c.estado.toLowerCase() === 'cancelada').length,
          },
        ];

        // ✅ Actualizar el signal con el nuevo array
        this.filterOptions.set(updatedFilters);
      },
    });
  }

  /**
   * Cancela una cita
   */
  cancelarCita(idCita: number, event: Event) {
    event.stopPropagation();

    if (
      !confirm('¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.')
    ) {
      return;
    }

    this.processingCitaId.set(idCita);
    this.actionType.set('cancelar');

    this.citasService.cancelarCita(idCita).subscribe({
      next: (response) => {
        console.log('Cita cancelada:', response);

        setTimeout(() => {
          this.showSuccessMessage(response.message || 'Cita cancelada exitosamente');
          this.processingCitaId.set(null);
          this.actionType.set(null);
          this.loadCitas();
        }, 0);
      },
      error: (error) => {
        console.error('Error al cancelar cita:', error);
        setTimeout(() => {
          this.showErrorMessage('Error al cancelar la cita. Por favor intente nuevamente.');
          this.processingCitaId.set(null);
          this.actionType.set(null);
        }, 0);
      },
    });
  }

  /**
   * Completa una cita
   */
  completarCita(idCita: number, event: Event) {
    event.stopPropagation();

    if (
      !confirm('¿Confirmas que esta cita ha sido completada? Esto marcará la cita como finalizada.')
    ) {
      return;
    }

    this.processingCitaId.set(idCita);
    this.actionType.set('completar');

    this.citasService.completarCita(idCita).subscribe({
      next: (response) => {
        console.log('Cita completada:', response);

        setTimeout(() => {
          this.showSuccessMessage(response.message || 'Cita completada exitosamente');
          this.processingCitaId.set(null);
          this.actionType.set(null);
          this.loadCitas();
        }, 0);
      },
      error: (error) => {
        console.error('Error al completar cita:', error);
        setTimeout(() => {
          this.showErrorMessage('Error al completar la cita. Por favor intente nuevamente.');
          this.processingCitaId.set(null);
          this.actionType.set(null);
        }, 0);
      },
    });
  }

  /**
   * Verifica si una cita se está procesando
   */
  isProcessing(idCita: number): boolean {
    return this.processingCitaId() === idCita;
  }

  /**
   * Verifica si se puede cancelar una cita
   */
  canCancelCita(cita: CitaDetalle): boolean {
    return cita.estado.toLowerCase() === 'pendiente';
  }

  /**
   * Verifica si se puede completar una cita
   */
  canCompleteCita(cita: CitaDetalle): boolean {
    return cita.estado.toLowerCase() === 'pendiente';
  }

  /**
   * Muestra mensaje de éxito (puedes reemplazar con un toast/snackbar)
   */
  private showSuccessMessage(message: string) {
    alert(message);
    // TODO: Implementar con un sistema de notificaciones más elegante
  }

  /**
   * Muestra mensaje de error (puedes reemplazar con un toast/snackbar)
   */
  private showErrorMessage(message: string) {
    alert(message);
    // TODO: Implementar con un sistema de notificaciones más elegante
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadCitas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFilterChange(filter: string) {
    this.selectedFilter.set(filter);
    this.currentPage.set(0);
    this.loadCitas();
  }

  onSearchChange(term: string) {
    this.searchTerm.set(term);
  }

  getFilteredAppointments(): CitaDetalle[] {
    let filtered = this.citas();

    if (this.searchTerm()) {
      const search = this.searchTerm().toLowerCase();
      filtered = filtered.filter(
        (cita) =>
          cita.nombrePaciente.toLowerCase().includes(search) ||
          cita.tipo.toLowerCase().includes(search) ||
          cita.email.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  getPaginatedAppointments(): CitaDetalle[] {
    return this.getFilteredAppointments();
  }

  formatTime(hora: string): string {
    const [hours, minutes] = hora.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDate(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const dateToCompare = new Date(date);
    dateToCompare.setHours(0, 0, 0, 0);

    if (dateToCompare.getTime() === today.getTime()) {
      return 'Hoy';
    } else if (dateToCompare.getTime() === tomorrow.getTime()) {
      return 'Mañana';
    } else {
      const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      const months = [
        'ene',
        'feb',
        'mar',
        'abr',
        'may',
        'jun',
        'jul',
        'ago',
        'sep',
        'oct',
        'nov',
        'dic',
      ];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    }
  }

  getStatusColor(estado: string): string {
    const estadoLower = estado.toLowerCase();
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-700',
      cancelada: 'bg-red-100 text-red-700',
      completada: 'bg-blue-100 text-blue-700',
    };
    return colors[estadoLower as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  }

  getStatusLabel(estado: string): string {
    const estadoLower = estado.toLowerCase();
    const labels = {
      pendiente: 'Pendiente',
      cancelada: 'Cancelada',
      completada: 'Completada',
    };
    return labels[estadoLower as keyof typeof labels] || estado;
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.onPageChange(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.onPageChange(this.currentPage() - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.onPageChange(page);
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 2) {
        pages.push(0, 1, 2, 3, -1, total - 1);
      } else if (current >= total - 3) {
        pages.push(0, -1, total - 4, total - 3, total - 2, total - 1);
      } else {
        pages.push(0, -1, current - 1, current, current + 1, -1, total - 1);
      }
    }

    return pages;
  }

  getStartIndex(): number {
    return this.currentPage() * this.pageSize() + 1;
  }

  getEndIndex(): number {
    const end = (this.currentPage() + 1) * this.pageSize();
    const total = this.totalElements();
    return end > total ? total : end;
  }

  getTotalPages(): number {
    return this.totalPages();
  }
}
