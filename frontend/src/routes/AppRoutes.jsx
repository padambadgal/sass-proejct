import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Public
import Landing from '../pages/Landing/Landing';
import Pricing from '../pages/Subscription/Pricing';
import Checkout from '../pages/Subscription/Checkout';
import PaymentSuccess from '../pages/Subscription/PaymentSuccess';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';

// Customer Booking (Public)
import BusinessListPage from '../pages/PublicBooking/BusinessListPage';
import PublicBookingWizard from '../pages/PublicBooking/PublicBookingWizard';
import CustomerReschedule from '../pages/PublicBooking/CustomerReschedule';

// Guards / Layout
import ProtectedRoute from '../components/ProtectedRoute';
import SubscriptionGuard from '../components/SubscriptionGuard';
import Layout from '../components/Layout/Layout';

// Owner Dashboard
import Dashboard from '../pages/Dashboard/Dashboard';
import BusinessList from '../pages/Business/BusinessList';
import BusinessForm from '../pages/Business/BusinessForm';
import ServiceList from '../pages/Services/ServiceList';
import ServiceForm from '../pages/Services/ServiceForm';
import StaffList from '../pages/Staff/StaffList';
import StaffForm from '../pages/Staff/StaffForm';
import StaffDetail from '../pages/Staff/StaffDetail';
import AvailabilitySchedule from '../pages/Availability/AvailabilitySchedule';
import CustomerList from '../pages/Customers/CustomerList';
import CustomerDetail from '../pages/Customers/CustomerDetail';
import CustomerForm from '../pages/Customers/CustomerForm';
import BookingList from '../pages/Bookings/BookingList';
import BookingDetail from '../pages/Bookings/BookingDetail';
import SubscriptionStatus from '../pages/Subscription/SubscriptionStatus';

// Customer (Logged-in)
import MyBookings from '../pages/Customers/MyBookings';
import ChangePassword from '../pages/Auth/ChangePassword';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============ PUBLIC ============ */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ChangePassword />} />

        {/* Customer Booking — public browse */}
        <Route path="/book" element={<BusinessListPage />} />

        {/* Customer Reschedule — public with reference */}
        <Route
          path="/reschedule/:reference"
          element={<CustomerReschedule />}
        />

        {/* Customer booking is public; no customer login or subscription required */}
        <Route path="/book/:slug" element={<PublicBookingWizard />} />

        {/* ============ LOGGED IN ============ */}
        <Route element={<ProtectedRoute />}>
          {/* Checkout / Payment */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* Customer My Bookings */}
          <Route path="/my-bookings" element={<MyBookings />} />

          {/* ============ OWNER (login + subscription) ============ */}
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
              <Route path="/staff/new" element={<StaffForm />} />
              <Route path="/staff/:id" element={<StaffDetail />} />
              <Route path="/staff/:id/edit" element={<StaffForm />} />

              <Route
                path="/availability"
                element={<AvailabilitySchedule />}
              />

              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route
                path="/customers/:id/edit"
                element={<CustomerForm />}
              />

              <Route path="/bookings" element={<BookingList />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />

              <Route
                path="/subscription"
                element={<SubscriptionStatus />}
              />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;