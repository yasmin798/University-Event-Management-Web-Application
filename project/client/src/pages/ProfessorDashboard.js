import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Bell, User, ChevronLeft, ChevronRight, Calendar, Clock, Users, FileText, LogOut, X, MapPin } from 'lucide-react';
import workshopPlaceholder from "../images/workshop.png";
import { workshopAPI } from '../api/workshopApi';

const ProfessorDashboard = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(new Date());
  const [workshops, setWorkshops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const data = await workshopAPI.getAllWorkshops();
        setWorkshops(data);
      } catch (error) {
        console.error('Error fetching workshops:', error);
      }
    };
    
    fetchWorkshops();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/');
    }
  };

  const formatDate = (date) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getMonthYear = (date) => {
    const options = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    const startDate = new Date(year, month, 1 - firstDay);
    
    for (let i = 0; i < 35; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toDateString();
      const hasWorkshop = workshops.some(workshop => {
        const workshopDate = new Date(workshop.startDate);
        return workshopDate.toDateString() === dateString;
      });
      
      days.push({
        date: date.getDate(),
        fullDate: date,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateString === new Date().toDateString(),
        hasWorkshop: hasWorkshop
      });
    }
    
    return days;
  };

  const filteredWorkshops = workshops.filter((workshop) =>
    Object.values(workshop)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeModal = () => setSelectedWorkshop(null);

  return (
    <div className="flex h-screen bg-[#f5efeb]">
      {/* Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Workshop Details Modal */}
      {selectedWorkshop && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#c8d9e6] p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-[#2f4156]">{selectedWorkshop.workshopName}</h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <X size={24} className="text-[#567c8d]" />
              </button>
            </div>

            <div className="p-6">
              {/* Date and Time */}
              <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Calendar size={20} className="text-[#567c8d] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Date & Time</p>
                    <p className="text-[#567c8d]">
                      {new Date(selectedWorkshop.startDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-[#567c8d]">
                      {selectedWorkshop.startTime} - {selectedWorkshop.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <MapPin size={20} className="text-[#567c8d] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Location</p>
                    <p className="text-[#567c8d]">{selectedWorkshop.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <Users size={20} className="text-[#567c8d] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Professor(s)</p>
                    <p className="text-[#567c8d]">{selectedWorkshop.professorsParticipating}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-[#567c8d] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-[#2f4156]">Registration Deadline</p>
                    <p className="text-[#567c8d]">
                      {new Date(selectedWorkshop.registrationDeadline).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-[#2f4156] mb-2">Description</h3>
                <p className="text-[#567c8d] leading-relaxed">{selectedWorkshop.shortDescription}</p>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Faculty</p>
                  <p className="font-semibold text-[#2f4156]">{selectedWorkshop.facultyResponsible}</p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Capacity</p>
                  <p className="font-semibold text-[#2f4156]">{selectedWorkshop.capacity} participants</p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Budget</p>
                  <p className="font-semibold text-[#2f4156]">{selectedWorkshop.requiredBudget} EGP</p>
                </div>
                <div className="bg-[#f5efeb] rounded-lg p-4">
                  <p className="text-sm text-[#567c8d] mb-1">Funding</p>
                  <p className="font-semibold text-[#2f4156]">{selectedWorkshop.fundingSource}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    closeModal();
                    navigate(`/professor/workshops/edit/${selectedWorkshop._id}`);
                  }}
                  className="flex-1 px-6 py-3 bg-[#567c8d] text-white rounded-lg hover:bg-[#2f4156] transition-colors"
                >
                  Edit Workshop
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-[#c88585] hover:bg-[#b87575] text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-[#2f4156] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#567c8d] rounded-full"></div>
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <button 
            onClick={closeSidebar}
            className="p-2 hover:bg-[#567c8d] rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4">
          <button 
            onClick={() => {
              navigate('/professor/dashboard');
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#567c8d] text-white mb-2"
          >
            <Menu size={20} />
            <span>Dashboard</span>
          </button>
          
          <button 
            onClick={() => {
              navigate('/professor/workshops');
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <Calendar size={20} />
            <span>My Workshops</span>
          </button>
          
          <button 
            onClick={() => {
              navigate('/professor/workshops/create');
              closeSidebar();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors"
          >
            <FileText size={20} />
            <span>Create Workshop</span>
          </button>
          
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#567c8d] mb-2 transition-colors">
            <Bell size={20} />
            <span>Notifications</span>
          </button>
        </nav>

        <div className="p-4 m-4 border-t border-[#567c8d]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-[#c88585] hover:bg-[#b87575] text-white py-3 px-4 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-[#c8d9e6] px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={toggleSidebar}
                className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors"
              >
                <Menu size={24} className="text-[#2f4156]" />
              </button>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#567c8d]" size={20} />
                <input
                  type="text"
                  placeholder="Search workshops"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-[#c8d9e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#567c8d]"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:block text-[#567c8d] text-sm">Today, {formatDate(currentDate)}</span>
              <button className="p-2 hover:bg-[#f5efeb] rounded-lg transition-colors">
                <Bell size={20} className="text-[#567c8d]" />
              </button>
              <div className="w-10 h-10 bg-[#c8d9e6] rounded-full flex items-center justify-center">
                <User size={20} className="text-[#2f4156]" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-[#2f4156] mb-1">
                  Welcome back, Professor! 👋
                </h1>
              </div>

              <div className="bg-white rounded-xl p-4 md:p-6 border border-[#c8d9e6] mb-8">
                <h2 className="text-xl font-bold text-[#2f4156] mb-6">My Workshops</h2>

                {filteredWorkshops.length === 0 ? (
                  <div className="text-center text-[#567c8d] py-6">No workshops found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredWorkshops.map((workshop) => (
                      <div
                        key={workshop._id}
                        className="bg-[#fdfdfd] border border-[#c8d9e6] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/professor/workshops/edit/${workshop._id}`)}
                      >
                        <div className="h-40 w-full bg-gray-200">
                          <img
                            src={workshop.image || workshopPlaceholder}
                            alt={workshop.workshopName}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="p-4">
                          <h3 className="font-semibold text-lg text-[#2f4156] truncate">
                            {workshop.workshopName}
                          </h3>
                          <div className="flex items-center text-sm text-[#567c8d] mt-2">
                            <Calendar size={16} className="mr-1" />
                            <span>
                              {new Date(workshop.startDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-[#567c8d] mt-1">
                            <Clock size={16} className="mr-1" />
                            <span className="truncate">
                              Deadline:{" "}
                              {workshop.registrationDeadline
                                ? new Date(workshop.registrationDeadline).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Calendar & Upcoming Events */}
            <div className="w-full lg:w-96">
              <div className="bg-white rounded-xl p-6 mb-6 border border-[#c8d9e6]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#2f4156]">{getMonthYear(currentDate)}</h3>
                  <div className="flex gap-2">
                    <button className="p-1 hover:bg-[#f5efeb] rounded transition-colors">
                      <ChevronLeft size={20} className="text-[#567c8d]" />
                    </button>
                    <button className="p-1 hover:bg-[#f5efeb] rounded transition-colors">
                      <ChevronRight size={20} className="text-[#567c8d]" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-[#567c8d] py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {getCalendarDays().map((day, idx) => {
                    let bgColor = 'hover:bg-[#f5efeb]';
                    let textColor = day.isCurrentMonth ? 'text-[#2f4156]' : 'text-[#c8d9e6]';
                    
                    if (day.isToday) {
                      bgColor = 'bg-[#567c8d]';
                      textColor = 'text-white font-bold';
                    }
                    else if (day.hasWorkshop && day.isCurrentMonth) {
                      bgColor = 'bg-[#c8d9e6] hover:bg-[#b8c9d6]';
                      textColor = 'text-[#2f4156] font-semibold';
                    }
                    
                    return (
                      <button
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors relative
                          ${bgColor} ${textColor}
                        `}
                        title={day.hasWorkshop ? 'Workshop scheduled' : ''}
                      >
                        {day.date}
                        {day.hasWorkshop && day.isCurrentMonth && !day.isToday && (
                          <span className="absolute bottom-1 w-1 h-1 bg-[#567c8d] rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-[#c8d9e6]">
                <h3 className="text-lg font-bold text-[#2f4156] mb-4">Upcoming Workshops</h3>
                {workshops.filter(w => new Date(w.startDate) > new Date()).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-[#c8d9e6] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock size={24} className="text-[#567c8d]" />
                    </div>
                    <p className="text-[#567c8d] text-sm">No upcoming workshops</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {workshops
                      .filter(w => new Date(w.startDate) > new Date())
                      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                      .slice(0, 3)
                      .map((w) => (
                        <li
                          key={w._id}
                          className="p-4 border border-[#c8d9e6] rounded-lg hover:bg-[#f5efeb] transition-colors cursor-pointer flex justify-between items-center"
                          onClick={() => setSelectedWorkshop(w)}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#2f4156] truncate">{w.workshopName}</h4>
                            <p className="text-sm text-[#567c8d] truncate">
                              {w.location} • {new Date(w.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Calendar size={18} className="text-[#567c8d] ml-2 flex-shrink-0" />
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProfessorDashboard;