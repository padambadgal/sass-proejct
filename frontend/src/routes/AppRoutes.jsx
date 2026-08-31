import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Landing from '../pages/Landing/Landing';
import Pricing from '../pages/Subscription/Pricing';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

// Public Booking (Customer)
import BusinessListPage from '../pages/PublicBooking/BusinessListPage';
import PublicBookingWizard from '../pages/PublicBooking/PublicBookingWizard';
import CustomerReschedule from '../pages/PublicBooking/CustomerReschedule';

// Protected Pages (require login)
import Checkout from '../pages/Subscription/Checkout';
import PaymentSuccess from '../pages/Subscription/PaymentSuccess';
import ProtectedRoute from '../components/ProtectedRoute';
import SubscriptionGuard from '../components/SubscriptionGuard';
import Layout from '../components/Layout/Layout';

// Dashboard & Business Management
import Dashboard from '../pages/Dashboard/Dashboard';
import BusinessList from '../pages/Business/BusinessList';
import BusinessForm from '../pages/Business/BusinessForm';
import ServiceList from '../pages/Services/ServiceList';
import ServiceForm from '../pages/Services/ServiceForm';
import StaffList from '../pages/Staff/StaffList';
import StaffDetail from '../pages/Staff/StaffDetail';
import StaffForm from '../pages/Staff/StaffForm';
import AvailabilitySchedule from '../pages/Availability/AvailabilitySchedule';
import CustomerList from '../pages/Customers/CustomerList';
import CustomerDetail from '../pages/Customers/CustomerDetail';
import CustomerForm from '../pages/Customers/CustomerForm';
import BookingList from '../pages/Bookings/BookingList';
import BookingDetail from '../pages/Bookings/BookingDetail';
import SubscriptionStatus from '../pages/Subscription/SubscriptionStatus';



const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Booking (Customer) */}
        <Route path="/book" element={<BusinessListPage />} />
        <Route path="/book/:slug" element={<PublicBookingWizard />} />
        <Route path="/reschedule/:reference" element={<CustomerReschedule />} />


        {/* ========== PROTECTED ROUTES (login required) ========== */}
        <Route element={<ProtectedRoute />}>
          {/* These routes need login but NOT subscription */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* These routes need login AND active subscription */}
          <Route element={<Layout />}>
            <Route element={<SubscriptionGuard />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business" element={<BusinessList />} />
              <Route path="/business/new" element={<BusinessForm />} />
              <Route path="/business/:id/edit" element={<BusinessForm />} />
              <Route path="/services" element={<ServiceList />} />
              <Route path="/services/new" element={<ServiceForm />} />
              <Route path="/services/:id/edit" element={<ServiceForm />} />
              <Route path="/staff" element={<StaffList />} />
              <Route path="/staff/:id" element={<StaffDetail />} />
              <Route path="/staff/new" element={<StaffForm />} />
              <Route path="/staff/:id/edit" element={<StaffForm />} />
              <Route path="/availability" element={<AvailabilitySchedule />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/customers/:id/edit" element={<CustomerForm />} />
              <Route path="/bookings" element={<BookingList />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
              <Route path="/subscription" element={<SubscriptionStatus />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;