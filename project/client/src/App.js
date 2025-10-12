import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ✅ Import all your pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import VendorSignup from "./pages/VendorSignup";
import Admin from "./pages/Admin";

// Events pages
import EventsHome from "./pages/EventsHome";
import EventList from "./pages/EventList";
import BazaarForm from "./pages/BazaarForm";
import TripForm from "./pages/TripForm";
import ConferenceForm from "./pages/ConferenceForm"; // ✅ NEW IMPORT

function App() {
  return (
    <Router>
      <Routes>
        {/* 🏠 Main routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 👩‍🎓 Signup routes */}
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/staff" element={<StaffSignup />} />
        <Route path="/signup/vendor" element={<VendorSignup />} />

        {/* 🧑‍💼 Admin page */}
        <Route path="/admin" element={<Admin />} />

        {/* 🗓️ Events overview */}
        <Route path="/events" element={<EventsHome />} />
        <Route path="/events/list" element={<EventList />} />

        {/* 🛍️ Bazaar */}
        <Route path="/bazaars/new" element={<BazaarForm />} />
        <Route path="/bazaars/:id" element={<BazaarForm />} />
        <Route path="/bazaars/:id/edit" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id" element={<BazaarForm />} />
        <Route path="/events/bazaars/:id/edit" element={<BazaarForm />} />

        {/* 🚌 Trip */}
        <Route path="/trips/new" element={<TripForm />} />
        <Route path="/trips/:id" element={<TripForm />} />
        <Route path="/trips/:id/edit" element={<TripForm />} />
        <Route path="/events/trips/:id" element={<TripForm />} />
        <Route path="/events/trips/:id/edit" element={<TripForm />} />

        {/* 🎓 Conference ✅ NEW ROUTES */}
        <Route path="/conferences/new" element={<ConferenceForm />} />
        <Route path="/conferences/:id" element={<ConferenceForm />} />
        <Route path="/conferences/:id/edit" element={<ConferenceForm />} />
        <Route path="/events/conferences/:id" element={<ConferenceForm />} />
        <Route path="/events/conferences/:id/edit" element={<ConferenceForm />} />
      </Routes>
    </Router>
  );
}

export default App;
