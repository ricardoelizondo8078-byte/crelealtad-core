export interface GrupoEntity {
  id: string;
  name: string;
  advisorName?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  status: string;
}
