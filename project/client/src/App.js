import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Import all your pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import VendorSignup from "./pages/VendorSignup";
import Admin from "./pages/Admin"; // ✅ Added admin page
import VendorRequests from "./pages/VendorRequests";
// Events pages
import EventsHome from "./pages/EventsHome"; // NEW dashboard page
import EventList from "./pages/EventList"; // All events list page
import BazaarForm from "./pages/BazaarForm";
import TripForm from "./pages/TripForm";
import ConferenceForm from "./pages/ConferenceForm"; // ✅ NEW IMPORT
import ProfessorDashboard from "./pages/ProfessorDashboard";
import CreateWorkshopPage from "./pages/CreateWorkshopPage";
import WorkshopsListPage from "./pages/WorkshopsListPage";
import EditWorkshopPage from "./pages/EditWorkshopPage";
import VendorsPage from "./pages/Vendorspage";
import EventRegistrationForm from "./pages/EventRegistrationForm"; // Added for testing registration
import StudentDashboard from "./pages/studentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TaDashboard from "./pages/TaDashboard";
import AdminDashboard from "./pages/AdminDashboard";
// Simple 404
// Simple 404
// Simple 404
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
<Route path="/student/dashboard" element={<StudentDashboard />} />
<Route path="/staff/dashboard" element={<StaffDashboard />} />
<Route path="/ta/dashboard" element={<TaDashboard />} />
<Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 🗓️ Events overview */}
        {/* 👨‍🏫 Professor Dashboard and Workshop Management */}
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

        {/* Events */}
        <Route path="/events" element={<EventsHome />} />
        <Route path="/events/list" element={<EventList />} />

      {/* Events - Registration */}
        <Route path="/events/register/:eventId" element={<EventRegistrationForm />} /> {/* New route for testing registration */}
        
        {/* Bazaar */}
        <Route
          path="/bazaars/:id/vendor-requests"
          element={<VendorRequests />}
        />
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

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

        <Route path="/vendors" element={<VendorsPage />} />



      </Routes>
    </Router>
  );
}
export default App;
