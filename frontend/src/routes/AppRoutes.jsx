import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Dashboard from '../pages/Dashboard/Dashboard';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout/Layout';
import BusinessList from '../pages/Business/BusinessList';
import BusinessForm from '../pages/Business/BusinessForm';
import ServiceList from '../pages/Services/ServiceList';
import ServiceForm from '../pages/Services/ServiceForm';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />

        
        {/* Protected routes with Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/business" element={<BusinessList />} />
          <Route path="/business/new" element={<BusinessForm />} />
          <Route path="/business/:id/edit" element={<BusinessForm />} />
          
          
          {/* Routes that require an active subscription */}
          <Route element={<SubscriptionGuard />}>
            <Route path="/services" element={<ServiceList />} />
            <Route path="/services/new" element={<ServiceForm />} />
            <Route path="/services/:id/edit" element={<ServiceForm />} />
          </Route>
          {/* Future routes will be added here */}
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;