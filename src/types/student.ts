
export interface Student {
  id: string;
  name: string;
  email: string;
  weight?: number;
  height?: number;
  goals?: string[];
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
