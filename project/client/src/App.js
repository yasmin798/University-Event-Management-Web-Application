import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ✅ Pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import VendorSignup from "./pages/VendorSignup";
import Admin from "./pages/Admin";
import UsersView from "./pages/UsersView"; // New admin page
import EventDetails from "./pages/EventDetails";
//gymSessions
import GymSessions from "./pages/GymSessions";
import GymManager from "./pages/GymManager";
import GymSessionsForRegister from "./pages/GymSessionsForRegister";

// Dashboards
import StudentDashboard from "./pages/studentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TaDashboard from "./pages/TaDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Events pages
import EventsHome from "./pages/EventsHome";
import EventList from "./pages/EventList";
import EventRegistrationForm from "./pages/EventRegistrationForm";
import RegisteredEvents from "./pages/RegisteredEvents"; // New page
import FavoritesList from "./pages/FavoritesList";

// Bazaar/Trip/Conference forms
import BazaarForm from "./pages/BazaarForm";
import TripForm from "./pages/TripForm";
import ConferenceForm from "./pages/ConferenceForm";

// Vendor pages
import VendorRequests from "./pages/VendorRequests";
import VendorRequestsBooth from "./pages/VendorRequestsBooth";
import VendorsPage from "./pages/Vendorspage";

// Professor & Workshop pages
import ProfessorDashboard from "./pages/ProfessorDashboard";
import CreateWorkshopPage from "./pages/CreateWorkshopPage";
import WorkshopsListPage from "./pages/WorkshopsListPage";
import EditWorkshopPage from "./pages/EditWorkshopPage";
import AttendeesReport from "./pages/AttendeesReport";
import SalesReport from "./pages/SalesReport";

// Courts
import CourtsAvailability from "./pages/CourtsAvailability";
import ReserveCourt from "./pages/ReserveCourt";
import CourtsAvailabilityWrapper from "./pages/CourtsAvailabilityWrapper";


import BazaarApplicationForm from "./pages/BazaarApplicationForm";
import BoothApplicationForm from "./pages/BoothApplicationForm";
import ChooseEventType from "./pages/ChooseEventType";
import MyApplications from "./pages/MyApplications";

import MyApplicationsByStatus from "./pages/MyApplicationsByStatus";

import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";

// Simple 404
function NotFound() {
  return <div style={{ padding: 24 }}>Page not found.</div>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Main routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* 👩‍🎓 Student / Staff / Vendor signup */}
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/staff" element={<StaffSignup />} />
        <Route path="/signup/vendor" element={<VendorSignup />} />
        {/* 🧑‍💼 Admin page */}
        <Route path="/admin" element={<Admin />} />
        {/* New Admin Users View Page */}
        <Route path="/admin/users" element={<UsersView />} />
        {/* Dashboards */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/ta/dashboard" element={<TaDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        {/* 👨‍🏫 Professor & Workshop */}
        <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        <Route path="/professor/workshops" element={<WorkshopsListPage />} />
        <Route
          path="/professor/workshops/create"
          element={<CreateWorkshopPage />}
        />
        <Route
          path="/professor/workshops/edit/:id"
          element={<EditWorkshopPage />}
        />
        <Route path="/reports/attendees" element={<AttendeesReport />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        {/* 🗓️ Events */}
        <Route path="/events" element={<EventsHome />} />
        <Route path="/events/list" element={<EventList />} />
        <Route path="/events/choose-type" element={<ChooseEventType />} />
        <Route path="/favorites" element={<FavoritesList />} />
        {/* Events - Registration */}
        <Route
          path="/events/register/:eventId"
          element={<EventRegistrationForm />}
        />{" "}
        {/* New route for testing registration */}
        {/* New Registered Events Page */}
        <Route path="/events/registered" element={<RegisteredEvents />} />
        {/* Bazaar */}
        <Route
          path="/bazaars/:id/vendor-requests"
          element={<VendorRequests />}
        />
        <Route
          path="/vendor-requests-booths"
          element={<VendorRequestsBooth />}
        />
        <Route path="/bazaars/create" element={<BazaarForm />} />
        <Route path="/bazaars/:id" element={<BazaarForm />} />
        <Route path="/bazaars/:id/edit" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id/edit" element={<BazaarForm />} />
        {/* Trip */}
        <Route path="/trips/create" element={<TripForm />} />
        <Route path="/trips/:id" element={<TripForm />} />
        <Route path="/trips/:id/edit" element={<TripForm />} />
        <Route path="/events/trips/:id" element={<TripForm />} />
        <Route path="/events/trips/:id/edit" element={<TripForm />} />
        {/* Conference */}
        <Route path="/conferences/create" element={<ConferenceForm />} />
        <Route path="/conferences/:id" element={<ConferenceForm />} />
        {/* Vendors */}
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/apply/:bazaarId" element={<BazaarApplicationForm />} />
        {/* Courts */}
        <Route path="/student/courts-availability"element={<CourtsAvailabilityWrapper />}/>
        <Route path="/reserve/:courtId" element={<ReserveCourt />} />

        <Route path="/apply-booth" element={<BoothApplicationForm />} />
        <Route path="/gym-sessions" element={<GymSessions />} />
        <Route path="/gym-sessions-register" element={<GymSessionsForRegister />} />
        <Route path="/gym-manager" element={<GymManager />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<div>Payment Cancelled</div>} />

        <Route
          path="/my-applications/:status"
          element={<MyApplicationsByStatus />}
        />
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
