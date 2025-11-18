export interface DoctorStats {
  citasHoy: number;
  pacientesTotales: number;
  horasDisponibles: number;
  tasaAsistencia: number;
}

export interface ProximaCita {
  idCita: number;
  nombrePaciente: string;
  imagenPaciente: string;
  fecha: string;
  hora: string;
  razon: string;
  estado: string;
}
