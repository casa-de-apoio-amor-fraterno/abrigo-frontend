/** Espelha HospitalResponse (abrigo-backend, app/features/hospitais/schemas.py). */
export interface HospitalDto {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface HospitalCreateDto {
  nome: string;
}

export type HospitalUpdateDto = HospitalCreateDto;
