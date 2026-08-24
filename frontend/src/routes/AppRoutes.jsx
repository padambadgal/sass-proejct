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
import StaffList from '../pages/Staff/StaffList';
import StaffForm from '../pages/Staff/StaffForm';
import AvailabilitySchedule from '../pages/Availability/AvailabilitySchedule';
import CustomerList from '../pages/Customers/CustomerList';
import CustomerDetail from '../pages/Customers/CustomerDetail';
import CustomerForm from '../pages/Customers/CustomerForm';
import BookingList from '../pages/Bookings/BookingList';
import BookingDetail from '../pages/Bookings/BookingDetail';


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

          <Route path="/services" element={<ServiceList />} />
          <Route path="/services/new" element={<ServiceForm />} />
          <Route path="/services/:id/edit" element={<ServiceForm />} />

          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/new" element={<StaffForm />} />
          <Route path="/staff/:id/edit" element={<StaffForm />} />

          <Route path="/availability" element={<AvailabilitySchedule />} />

          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/customers/:id/edit" element={<CustomerForm />} />

          <Route path="/bookings" element={<BookingList />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />

          <Route path="/subscription" element={<div className="p-8"><h1 className="text-2xl font-bold">Subscription</h1><p className="text-gray-500 mt-2">Coming soon...</p></div>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
