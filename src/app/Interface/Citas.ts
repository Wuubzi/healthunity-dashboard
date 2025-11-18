export interface CitaDetalle {
  idCita: number;
  nombrePaciente: string;
  imagenPaciente: string;
  contacto: string;
  email: string;
  edad: number;
  fecha: string;
  hora: string;
  tipo: string;
  estado: string;
}

export interface CitasPageResponse {
  citas: CitaDetalle[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface ResponseDTO {
  timestamp: string;
  message: string;
  Status: number;
  url: string;
}
