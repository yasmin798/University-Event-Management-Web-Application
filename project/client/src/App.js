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
import VerifiedUsersPage from "./pages/VerifiedUsers";
import WalletSuccess from "./pages/WalletSuccess";
import WalletCancel from "./pages/WalletCancel";
// Dashboards
import StudentDashboard from "./pages/studentDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import TaDashboard from "./pages/TaDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import EventPaymentSuccess from "./pages/EventPaymentSuccess.jsx";

// Events pages
import EventsHome from "./pages/EventsHome";
import EventsHomeEventDetails from "./pages/EventsHomeEventDetails";
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
import LoyaltyVendors from "./pages/LoyaltyVendors";
import Notifications from "./pages/Notifications";

import GUCLoyaltyForm from "./pages/GUCLoyaltyForm";
// Professor & Workshop pages
import ProfessorDashboard from "./pages/ProfessorDashboard";
import CreateWorkshopPage from "./pages/CreateWorkshopPage";
import WorkshopsListPage from "./pages/WorkshopsListPage";
import EditWorkshopPage from "./pages/EditWorkshopPage";
import AttendeesReport from "./pages/AttendeesReport";
import AdminAttendeesReport from "./pages/AdminAttendeesReport";
import SalesReport from "./pages/SalesReport";
import AdminSalesReport from "./pages/AdminSalesReport";
import AdminAllEvents from "./pages/AdminAllEvents";
import AdminVendorBooths from "./pages/AdminVendorBooths";
import StudentLoyaltyVendors from "./pages/StudentLoyaltyVendors";
import TaLoyaltyVendors from "./pages/TaLoyaltyVendors";
import ProfessorLoyaltyVendors from "./pages/ProfessorLoyaltyVendors";
import AdminLoyaltyVendors from "./pages/AdminLoyaltyVendors";
import StaffLoyaltyVendors from "./pages/StaffLoyaltyVendors";

// Courts
import CourtsAvailability from "./pages/CourtsAvailability";
import ReserveCourt from "./pages/ReserveCourt";
import CourtsAvailabilityWrapper from "./pages/CourtsAvailabilityWrapper";
import EquipmentReservation from "./pages/EquipmentReservation.jsx";

import BazaarApplicationForm from "./pages/BazaarApplicationForm";
import BoothApplicationForm from "./pages/BoothApplicationForm";
import ChooseEventType from "./pages/ChooseEventType";
import MyApplications from "./pages/MyApplications";

import MyApplicationsByStatus from "./pages/MyApplicationsByStatus";

import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";

import CreatePoll from "./pages/CreatePollFromBooths";
import PollVoting from "./pages/PollVoting";

import EventReviewsPage from "./pages/EventReviewsPage"; // Adjust path if needed (e.g., "../pages/EventReviewsPage")
import PendingVerificationPage from "./pages/PendingVerification";
import AdminVendor from "./pages/AdminVendor";
//FavoriteList
import TaFavoriteList from "./pages/TaFavoriteList";
//workshops
import WorkshopParticipants from "./pages/WorkshopParticipants";
import WorkshopEditsPage from "./pages/WorkshopEditsPage";
import WalletPage from "./pages/WalletPage";
import WorkshopAttendance from "./pages/WorkshopAttendance";

import VendorDocumentsPage from "./pages/VendorDocumentsPage";
import DocumentsPage from "./pages/DocumentsPage";

import PollResults from "./pages/PollResults.js";

import StudentSuggestions from "./pages/StudentSuggestions";

import EventsOfficeSuggestions from "./pages/EventsOfficeSuggestions";

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
        <Route path="/admin/verified-users" element={<VerifiedUsersPage />} />
        {/* New Admin Users View Page */}
        <Route path="/admin/users" element={<UsersView />} />
        {/* Dashboards */}
        <Route
          path="/pending-verification"
          element={<PendingVerificationPage />}
        />
        <Route path="/admin/events" element={<AdminAllEvents />} />
        <Route path="/admin/vendor-requests" element={<AdminVendor />} />
        <Route
          path="/admin/vendor-requests-booths"
          element={<AdminVendorBooths />}
        />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route
          path="/student/loyalty-vendors"
          element={<StudentLoyaltyVendors />}
        />
        <Route path="/ta/loyalty-vendors" element={<TaLoyaltyVendors />} />
        {/*favorite*/}
        <Route path="/ta/favorite" element={<TaFavoriteList />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/ta/dashboard" element={<TaDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin/loyalty-vendors"
          element={<AdminLoyaltyVendors />}
        />
        <Route
          path="/staff/loyalty-vendors"
          element={<StaffLoyaltyVendors />}
        />
        {/* 👨‍🏫 Professor & Workshop */}
        <Route path="/professor/dashboard" element={<ProfessorDashboard />} />
        <Route
          path="/professor/loyalty-vendors"
          element={<ProfessorLoyaltyVendors />}
        />
        <Route path="/professor/workshops" element={<WorkshopsListPage />} />
        <Route
          path="/professor/workshops/create"
          element={<CreateWorkshopPage />}
        />
        <Route
          path="/events/:eventId/register"
          element={<EventRegistrationForm />}
        />
        <Route
          path="/professor/workshops/edit/:id"
          element={<EditWorkshopPage />}
        />
        <Route path="/reports/attendees" element={<AttendeesReport />} />
        <Route
          path="/admin/attendees-report"
          element={<AdminAttendeesReport />}
        />
        <Route path="/guc-loyalty-apply" element={<GUCLoyaltyForm />} />
        <Route path="/admin/sales-report" element={<AdminSalesReport />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        {/* 🗓️ Events */}
        <Route path="/events" element={<EventsHome />} />
        <Route
          path="/events-home/:id/details"
          element={<EventsHomeEventDetails />}
        />
        <Route path="/events/list" element={<EventList />} />
        <Route path="/events/choose-type" element={<ChooseEventType />} />
        <Route path="/favorites" element={<FavoritesList />} />
        <Route
          path="/professor/workshops/participants/:workshopId"
          element={<WorkshopParticipants />}
        />
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
        <Route path="/vendors/loyalty" element={<LoyaltyVendors />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/apply/:bazaarId" element={<BazaarApplicationForm />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route
          path="/event-payment-success"
          element={<EventPaymentSuccess />}
        />
        {/* Courts */}
        <Route
          path="/courts-availability"
          element={<CourtsAvailabilityWrapper />}
        />
        <Route
          path="/equipment-reservation"
          element={<EquipmentReservation />}
        />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/success" element={<WalletSuccess />} /> ← ADD THIS
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/wallet/cancel" element={<WalletCancel />} />
        <Route path="/reserve/:courtId" element={<ReserveCourt />} />
        <Route path="/apply-booth" element={<BoothApplicationForm />} />
        <Route path="/gym-sessions" element={<GymSessions />} />
        <Route
          path="/gym-sessions-register"
          element={<GymSessionsForRegister />}
        />
        <Route path="/gym-manager" element={<GymManager />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route
          path="/payment/cancel"
          element={<Navigate to="/events/registered" replace />}
        />
        <Route
          path="/my-applications/:status"
          element={<MyApplicationsByStatus />}
        />
        //workshops
        <Route
          path="/professor/workshops/edits/:id"
          element={<WorkshopEditsPage />}
        />{" "}
        <Route path="/create-poll" element={<CreatePoll />} />
        <Route
          path="/professor/workshops/attendance/:workshopId"
          element={<WorkshopAttendance />}
        />
        <Route path="/poll-voting" element={<PollVoting />} />{" "}
        <Route path="/event-reviews/:id" element={<EventReviewsPage />} />
        <Route path="/vendor-documents" element={<VendorDocumentsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/poll-results" element={<PollResults />} />
        <Route path="/suggestions" element={<StudentSuggestions />} />
        <Route
          path="/events-office/suggestions"
          element={<EventsOfficeSuggestions />}
        />
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
