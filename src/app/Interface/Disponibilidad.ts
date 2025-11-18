export interface HorarioDetalle {
  idHorarioDoctor: number | null;
  diaSemana: number;
  diaNombre: string;
  horaInicio: string;
  horaFin: string;
  duracionHoras: number;
  citasDisponibles: number;
}

export interface HorarioDoctorResponse {
  duracionCita: number;
  tiempoDescanso: number;
  horarios: HorarioDetalle[];
}

export interface HorarioStatsResponse {
  horasSemanales: number;
  diasActivos: number;
  citasSemanales: number;
}

export interface SaveHorarioRequest {
  idDoctor: number;
  duracionCita: number;
  tiempoDescanso: number;
  horarios: SaveHorarioDetalle[];
}

export interface SaveHorarioDetalle {
  idHorarioDoctor: number | null;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}
