import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import PrivateRoute from '@/components/Auth/PrivateRoute';
import TrainerDashboard from '@/components/Trainer/TrainerDashboard';
import StudentDashboard from '@/components/Student/StudentDashboard';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import PlansPage from '@/pages/PlansPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/student/dashboard" 
        element={
          <PrivateRoute>
            <StudentDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/trainer/dashboard" 
        element={
          <PrivateRoute>
            <TrainerDashboard />
          </PrivateRoute>
        } 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />
      <Route path="/plans" element={<PlansPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
} 