import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import VendorSignup from "./pages/VendorSignup";
import Admin from "./pages/Admin";

// Dashboards
import StudentDashboard from "./pages/studentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TaDashboard from "./pages/TaDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Events pages
import EventsHome from "./pages/EventsHome";
import EventList from "./pages/EventList";
import EventRegistrationForm from "./pages/EventRegistrationForm";

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

// Courts
import CourtsAvailability from "./pages/CourtsAvailability";

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

        {/* Dashboards */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/ta/dashboard" element={<TaDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 👨‍🏫 Professor & Workshop */}
        <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        <Route path="/professor/workshops" element={<WorkshopsListPage />} />
        <Route path="/professor/workshops/create" element={<CreateWorkshopPage />} />
        <Route path="/professor/workshops/edit/:id" element={<EditWorkshopPage />} />

        {/* 🗓️ Events */}
        <Route path="/events" element={<EventsHome />} />
        <Route path="/events/list" element={<EventList />} />
        <Route path="/events/register/:eventId" element={<EventRegistrationForm />} />

        {/* Bazaar */}
        <Route path="/bazaars/:id/vendor-requests" element={<VendorRequests />} />
        <Route path="/vendor-requests-booths" element={<VendorRequestsBooth />} />
        <Route path="/bazaars/new" element={<BazaarForm />} />
        <Route path="/bazaars/:id" element={<BazaarForm />} />
        <Route path="/bazaars/:id/edit" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id/edit" element={<BazaarForm />} />

        {/* Trip */}
        <Route path="/trips/new" element={<TripForm />} />
        <Route path="/trips/:id" element={<TripForm />} />
        <Route path="/trips/:id/edit" element={<TripForm />} />
        <Route path="/events/trips/:id" element={<TripForm />} />
        <Route path="/events/trips/:id/edit" element={<TripForm />} />

        {/* Conference */}
        <Route path="/conferences/new" element={<ConferenceForm />} />
        <Route path="/conferences/:id" element={<ConferenceForm />} />

        {/* Vendors */}
        <Route path="/vendors" element={<VendorsPage />} />

        {/* Courts */}
        <Route path="/courts-availability" element={<CourtsAvailability />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
