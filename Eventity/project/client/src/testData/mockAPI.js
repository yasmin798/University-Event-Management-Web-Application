export const getUsers = () =>
  Promise.resolve([
    {
      _id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "admin",
      roleSpecificId: "123",
      status: "active",
    },
    {
      _id: "2",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      role: "student",
      roleSpecificId: "456",
      status: "active",
    },
  ]);

export const registerForEvent = () =>
  Promise.resolve({ message: "Registered successfully" });
export const getMyRegisteredEvents = () =>
  Promise.resolve({
    upcoming: [
      { 
        _id: "1", 
        name: "Web Development Workshop", 
        startDate: "2025-11-15T10:00:00", 
        capacity: 50, 
        location: 'Room 101', 
        type: 'workshop'
      },
      { 
        _id: "2", 
        name: "Alexandria Trip", 
        startDate: "2025-10-20T08:00:00", 
        capacity: 30, 
        location: 'Campus Grounds', 
        type: 'trip'
      },
      { 
        _id: "3", 
        name: "AI Conference 2025", 
        startDate: "2025-12-05T09:00:00", 
        capacity: 200, 
        location: 'Main Auditorium', 
        type: 'conference'
      },
      { 
        _id: "4", 
        name: "Winter Bazaar", 
        startDate: "2025-11-25T11:00:00", 
        capacity: 100, 
        location: 'Student Center', 
        type: 'bazaar'
      },
      { 
        _id: "5", 
        name: "Career Fair Booth", 
        startDate: "2025-11-10T10:00:00", 
        capacity: 20, 
        location: 'Library Hall', 
        type: 'booth'
      },
      { 
        _id: "6", 
        name: "Mobile App Workshop", 
        startDate: "2025-10-30T14:00:00", 
        capacity: 40, 
        location: 'Lab 302', 
        type: 'workshop'
      },
    ],
    past: [
      { 
        _id: "7", 
        name: "Summer Coding Workshop", 
        startDate: "2025-09-15T10:00:00", 
        capacity: 40,  
        location: 'Lecture Hall A', 
        type: 'workshop'
      },
      { 
        _id: "8", 
        name: "Fayoum Trip", 
        startDate: "2025-08-10T07:00:00", 
        capacity: 25, 
        location: 'Park Area', 
        type: 'trip'
      },
      { 
        _id: "9", 
        name: "Tech Innovation Conference", 
        startDate: "2025-07-20T09:00:00", 
        capacity: 150, 
        location: 'Conference Center', 
        type: 'conference'
      },
      { 
        _id: "10", 
        name: "Spring Bazaar", 
        startDate: "2025-06-12T10:00:00", 
        capacity: 80, 
        location: 'Outdoor Area', 
        type: 'bazaar'
      },
      { 
        _id: "11", 
        name: "Book Fair Booth", 
        startDate: "2025-05-08T11:00:00", 
        capacity: 15, 
        location: 'Student Lounge', 
        type: 'booth'
      },
    ],
  });
