
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  exercises: Exercise[];
  duration: number; // em minutos
  difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  createdBy: string;
  studentId?: string;
  createdAt: Date;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  studentId: string;
  workouts: Workout[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}
