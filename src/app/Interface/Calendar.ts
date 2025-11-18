export interface CitaSimple {
  idCita: number;
  nombrePaciente: string;
  imagenPaciente: string;
  hora: string;
  tipo: string;
  estado: string;
}

export interface CitaDia {
  fecha: string;
  totalCitas: number;
  citas: CitaSimple[];
}

export interface CalendarioMes {
  mes: number;
  anio: number;
  nombreMes: string;
  dias: CitaDia[];
}

export interface CalendarioAnual {
  anio: number;
  meses: CalendarioMes[];
  totalCitasAnio: number;
}
