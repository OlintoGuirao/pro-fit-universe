export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  level: 1 | 2 | 3; // 1: Aluno, 2: Professor, 3: Admin
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Student extends User {
  level: 1;
  trainerId?: string;
  goals?: string[];
  measurements?: {
    weight?: number;
    height?: number;
    bodyFat?: number;
  };
}

export interface Trainer extends User {
  level: 2;
  specialties?: string[];
  certifications?: string[];
  students?: string[];
  maxStudents: number;
  isVerified: boolean;
}

export interface Admin extends User {
  level: 3;
}

export type UserType = Student | Trainer | Admin;
