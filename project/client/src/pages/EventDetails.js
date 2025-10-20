import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { useServerEvents } from "../hooks/useServerEvents";
import { workshopAPI } from "../api/workshopApi";
import workshopPlaceholder from "../images/workshop.png";
import tripImage from "../images/trip.jpeg";
import bazaarImage from "../images/bazaar.jpeg";
import conferenceImage from "../images/conference.jpg";
import boothImage from "../images/booth.jpg";
import { boothAPI } from "../api/boothApi";



const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [booths, setBooths] = useState([]);
const [boothsLoading, setBoothsLoading] = useState(true);
 const location = useLocation();
const fromAdmin = location.state?.fromAdmin || false;

  // Use EXACTLY same hooks as StudentDashboard
  const { events: otherEvents } = useServerEvents({ refreshMs: 0 });
  const [workshops, setWorkshops] = useState([]);
  const [workshopsLoading, setWorkshopsLoading] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) navigate("/");
  };
  //fetch booths
useEffect(() => {
  const fetchBooths = async () => {
    setBoothsLoading(true);
    try {
      const data = await boothAPI.getAllBooths(); // fetch all accepted booths

      // Only keep the fields you want to display
const normalizedBooths = data.map(b => ({
  _id: b._id,
  type: "BOOTH",
  bazaarId: b.bazaar?._id,
  title: `${b.bazaar?.title} Booth`,
  attendees: b.attendees?.map(a => a.name || "Unknown") || [],
  boothSize: b.boothSize,
  durationWeeks: b.durationWeeks,
  platformSlot: b.platformSlot,
  status: b.status,
  description: b.description || "",
  image: b.image || boothImage, // ✅ Changed from workshopPlaceholder → boothImage
}));


      setBooths(normalizedBooths);
    } catch (err) {
      console.error("Error fetching booths:", err);
      setBooths([]);
    } finally {
      setBoothsLoading(false);
    }
  };
  fetchBooths();
}, []);


  // Fetch workshops EXACTLY like StudentDashboard
  useEffect(() => {
    const fetchWorkshops = async () => {
      setWorkshopsLoading(true);
      try {
        const data = await workshopAPI.getAllWorkshops();
        const normalizedWorkshops = data.map((w) => {
  const start = w.startDateTime ? new Date(w.startDateTime) : new Date();
  const end = w.endDateTime ? new Date(w.endDateTime) : start;
  return {
    ...w,
    _id: w._id,
    type: "WORKSHOP",
    title: w.workshopName,
    name: w.workshopName,
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    startDate: start.toISOString(),
    date: start.toISOString(),
    image: w.image || workshopPlaceholder,
    description: w.shortDescription,
    professorsParticipating: w.professorsParticipating || "",
  };
});

        setWorkshops(normalizedWorkshops);
      } catch (error) {
        console.error("Error fetching workshops:", error);
        setWorkshops([]);
      } finally {
        setWorkshopsLoading(false);
      }
    };

    fetchWorkshops();
  }, []);









  
  // Find event after data loads - EXACTLY like StudentDashboard logic
  useEffect(() => {
  if (loading || boothsLoading) return; // wait until both loaded

  const allEvents = [
    ...otherEvents.filter(e => !e.status || e.status === "published"),
    ...workshops,
    ...booths,
  ];

  const foundEvent = allEvents.find(e => e._id === id);

  if (foundEvent) {
    // attach booths only for Bazaar
    if (foundEvent.type === "BAZAAR") {
      const eventBooths = booths.filter(b => b.bazaarId === id && b.status === "accepted");
      foundEvent.booths = eventBooths;
    } else if (foundEvent.type === "BOOTH") {
    // standalone booth: attach itself as array
    foundEvent.booths = [foundEvent];
  }


    setEvent(foundEvent);
    setError("");
  } else {
    setEvent(null);
    setError("Event not found");
  }
}, [id, otherEvents, workshops, booths, loading, boothsLoading]);

  // Set loading based on both data sources
 useEffect(() => {
  const stillLoading = workshopsLoading || (otherEvents.length === 0 && workshops.length === 0);
  setLoading(stillLoading);
}, [otherEvents, workshopsLoading,  workshops.length]);


  const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (n) => {
    if (n == null || n === "") return "—";
    const num = Number(n);
    return new Intl.NumberFormat(undefined, { 
      style: "currency", 
      currency: "EGP",
      maximumFractionDigits: 0 
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <div className="text-center">
          <p className="text-[#567c8d] mb-4">Loading event details...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#567c8d] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex h-screen bg-[#f5efeb] items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Event Not Found</h2>
          <p className="text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate(-1)} 
            className="bg-[#567c8d] hover:bg-[#45687a] text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  const type = event.type?.toUpperCase() || "EVENT";
  const title = event.title || event.name || event.workshopName || "Untitled Event";
  const isTrip = type === "TRIP";
  const isWorkshop = type === "WORKSHOP";
  const isBazaar = type === "BAZAAR";
  const isConference = type === "CONFERENCE";
  const isBooth=type ==="BOOTH";
  const hasPassed = new Date(event.startDateTime || event.startDate) < new Date();


let eventImage = event.image;

if (!eventImage || eventImage === "") {
  switch (type) {
    case "TRIP":
      eventImage = tripImage;
      break;
    case "WORKSHOP":
      eventImage = workshopPlaceholder;
      break;
    case "BAZAAR":
      eventImage = bazaarImage;
      break;
    case "CONFERENCE":
      eventImage = conferenceImage;
      break;
    case "BOOTH":
      eventImage = boothImage; // ✅ Added booth image support
      break;
    default:
      eventImage = workshopPlaceholder;
      break;
  }
}


  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeSidebar}></div>
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2f4156] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button onClick={closeSidebar} className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors">
            <Menu size={20} />
          </button>
        </div>
        <div className="flex-1 px-4 mt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4 flex items-center justify-between">
          <button onClick={toggleSidebar} className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
            <Menu size={24} className="text-[#2f4156]" />
          </button>
          <div className="flex items-center gap-2 md:gap-4 ml-4">
            <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
              <Bell size={20} className="text-[#567c8d]" />
            </button>
            <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
              <User size={20} className="text-[#2f4156]" />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-[#567c8d] hover:text-[#2f4156]"
          >
            ← Back to Events
          </button>

          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#2f4156] mb-2">{title}</h1>
                {hasPassed && <p className="text-red-500 text-sm">This event has passed</p>}
              </div>
              <span className="bg-[#c8d9e6] text-[#2f4156] px-4 py-2 rounded-full text-sm font-medium">
                {type}
              </span>
            </div>

            <div className="h-64 w-full bg-gray-200 rounded-lg mb-6 overflow-hidden">
             <img 
  src={eventImage} 
  alt={title} 
  className="h-full w-full object-cover"
  onError={(e) => {
    if (isTrip) e.target.src = tripImage;
    else if (isWorkshop) e.target.src = workshopPlaceholder;
    else if (isBazaar) e.target.src = bazaarImage;
    else if (isConference) e.target.src = conferenceImage;
  }}
/>


            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Date & Time</h2>
                <div className="space-y-2 text-[#567c8d]">
                  <p><strong>Starts:</strong> {formatDate(event.startDateTime || event.startDate || event.date)}</p>
                  {event.endDateTime && <p><strong>Ends:</strong> {formatDate(event.endDateTime)}</p>}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Details</h2>
                <div className="space-y-2 text-[#567c8d]">
                  {event.location && <p><strong>Location:</strong> {event.location}</p>}
                  {event.capacity && <p><strong>Capacity:</strong> {event.capacity} spots</p>}
                  {isTrip && event.price != null && <p><strong>Price:</strong> {formatMoney(event.price)}</p>}
                  {isWorkshop && event.requiredBudget && <p><strong>Budget:</strong> {formatMoney(event.requiredBudget)}</p>}
                  {isConference && event.website && (
                    <p>
                      <strong>Website:</strong>{' '}
                      <a href={event.website} target="_blank" rel="noopener noreferrer" className="underline">
                        Visit site
                      </a>
                    </p>
                  )}
                                    {isBazaar && (
                      <>
                        <p><strong>Bazaar Type:</strong> {event.bazaarType}</p>
                        <p><strong>Number of Booths:</strong> {event.booths?.length || 0}</p>
                      </>
                    )}
                    {isBooth && (
                      <>
                        <p><strong>Booth Size:</strong> {event.boothSize}</p>
                        <p><strong>Platform Slot:</strong> {event.platformSlot}</p>
                        <p><strong>Duration:</strong> {event.durationWeeks} week(s)</p>
                        <p><strong>Status:</strong> {event.status}</p>
                         <p><strong>Attendees:</strong> {(event.attendees || []).join(", ")}</p>
                      </>
                    )}
                  {event.professorsParticipating && (
                    <p><strong>Professors:</strong> {event.professorsParticipating}</p>
                  )}
                </div>
              </div>
            </div>

            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Description</h2>
                <p className="text-[#567c8d] leading-relaxed">{event.description}</p>
              </div>
            )}{event.booths && event.booths.length > 0 && (
  <div className="mb-8">
    <h2 className="text-xl font-semibold text-[#2f4156] mb-4">Booths</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {event.booths.map((b) => (
        <div key={b._id} className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl p-4">
          <p className="text-[#567c8d] mb-2"><strong>Booth Size:</strong> {b.boothSize}</p>
          <p className="text-[#567c8d] mb-2"><strong>Duration:</strong> {b.durationWeeks} week(s)</p>
          <p className="text-[#567c8d] mb-2"><strong>Slot:</strong> {b.platformSlot}</p>
          <p className="text-[#567c8d] mb-2"><strong>Status:</strong> {b.status}</p>
          <p className="text-[#567c8d] mb-2"><strong>Attendees:</strong> {(b.attendees || []).join(", ")}</p>
        </div>
      ))}
    </div>
  </div>
)}

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#c8d9e6]">
              {!hasPassed&& !fromAdmin  && (isTrip || isWorkshop) && (
                <button
                  className="flex-1 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  onClick={() => navigate(`/events/register/${id}`)}
                >
                  Register Now
                </button>
              )}
              <button
                className="flex-1 bg-[#567c8d] hover:bg-[#45687a] text-white py-3 px-6 rounded-lg font-medium transition-colors"
                onClick={() => navigate(-1)}
              >
                Back to Events
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EventDetails;