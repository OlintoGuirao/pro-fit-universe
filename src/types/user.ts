
export interface User {
  id: string;
  name: string;
  email: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  avatar?: string;
  displayName?: string;
  role?: string;
  uid?: string;
  weight?: number;
  height?: number;
  goals?: string[];
  students?: any[];
  maxStudents?: number;
}

export type UserType = User;

export interface UpdateProfileData {
  name?: string;
  email?: string;
  avatar?: string;
}
