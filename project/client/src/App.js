import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentSignup from "./pages/StudentSignup";
import StaffSignup from "./pages/StaffSignup";
//import ProfessorSignup from "./pages/ProfessorSignup";
//import TASignup from "./pages/TASignup";
import VendorSignup from "./pages/VendorSignup";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup/student" element={<StudentSignup />} />
        <Route path="/signup/staff" element={<StaffSignup />} />

<Route path="/signup/vendor" element={<VendorSignup />} />

      </Routes>
    </Router>
  );
}

export default App;
