import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
import ProfessorSignup from "./pages/ProfessorSignup";
import TASignup from "./pages/TASignup";
import VendorSignup from "./pages/VendorSignup";

// Events pages
import EventsHome from "./pages/EventsHome"; // NEW dashboard page
import EventList from "./pages/EventList"; // All events list page
import BazaarForm from "./pages/BazaarForm";
import TripForm from "./pages/TripForm";

function App() {
  return (
    <Router>
      <Routes>
        {/* Non-events routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/staff" element={<StaffSignup />} />
        <Route path="/signup/professor" element={<ProfessorSignup />} />
        <Route path="/signup/ta" element={<TASignup />} />
        <Route path="/signup/vendor" element={<VendorSignup />} />
        {/* Events */}
        <Route path="/events" element={<EventsHome />} />
        <Route path="/events/list" element={<EventList />} />

        {/* Bazaar */}
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
      </Routes>
    </Router>
  );
}

export default App;
