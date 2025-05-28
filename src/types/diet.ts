
export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
  time: string;
}

export interface DietPlan {
  id: string;
  name: string;
  studentId: string;
  meals: Meal[];
  totalCalories: number;
  waterGoal: number; // em litros
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}
