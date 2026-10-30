import { api } from './api-client';

interface PendingReviewsResponse {
  total_pendientes: number;
  grupos: {
    expediente_id: string;
    grupo_id: string;
    grupo_nombre: string;
    integrantes_pendientes: number;
    solicitado_desde: string;
  }[];
}

export const getPendingReviews = (): Promise<PendingReviewsResponse> => (
  api.get<PendingReviewsResponse>(
    '/pendientes/revision-documental',
    { showProcessing: false },
  )
);
