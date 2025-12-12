// utils/voiceCommands.js (or bottom of StudentDashboard.js)
export function handleVoiceCommand(
  text,
  navigate,
  {
    setSearchTerm,
    setEventTypeFilter,
    setSearchLocation,
    setProfessorFilter,
    setDateFilter,
     events, 
  } = {}
) {
   // Normalize once: lowercase, trim, remove trailing punctuation
  const cmd = text
    .toLowerCase()
    .trim()
    .replace(/[.!?]+$/g, "");

  // ------- GO BACK -------
  if (
    cmd === "go back" ||
    cmd === "back" ||
    cmd.includes("previous page")
  ) {
    navigate(-1);
    return "Going back to the previous page.";
  }
// ------- VIEW DETAILS -------
  // 1) "view details of ai workshop"
  if (cmd.startsWith("view details of")||cmd.startsWith("view details of")) {
   
    const name = cmd.replace("view details of", "").trim();
    if (events && events.length) {
      const found = events.find((e) =>
        (e.title || e.name || "").toLowerCase().includes(name)
      );
      if (found) {
        navigate(`/events/${found._id}`);
        return `Opening details for ${found.title || found.name || "this event"}.`;
      }
      return `I couldn't find an event matching ${name}.`;
    }
    return "I don't see any events to open right now.";
  }
  

  // 2) plain "view details" → just open first event in the list
  if (cmd === "view details" || cmd === "open details") {
    if (events && events.length) {
      const first = events[0];
      navigate(`/events/${first._id}`);
      return `Opening details for ${first.title || first.name || "the first event"}.`;
    }
    return "There are no events to show details for.";
  }

  // ------- NAVIGATION COMMANDS -------
  if (cmd.includes("gym")) {
    navigate("/gym-sessions", { state: { voiceActive: true } });
    return "Opening gym sessions.";
  }
   if (cmd.includes("court") || cmd.includes("courts availability")) {
    navigate("/courts-availability", { state: { voiceActive: true } });
    return "Opening courts availability.";
  }

  if (cmd.includes("loyalty")) {
    navigate("/vendors/loyalty", { state: { voiceActive: true } });
    return "Taking you to the loyalty vendors.";
  }

  if (cmd.includes("registered events") || cmd.includes("my events")) {
    navigate("/events/registered", { state: { voiceActive: true } });
    return "Showing your registered events.";
  }
  if (cmd.includes("go home") || cmd.includes("student dashboard")|| cmd.includes("dashboard")) {
    navigate("/student/dashboard", { state: { voiceActive: true } });
    return "going back to your dashboard showing all events.";
  }

  if (cmd.includes("favorites") || cmd.includes("favourites")) {
    navigate("/favorites", { state: { voiceActive: true } });
    return "Opening your favorite events.";
  }

  // ------- FILTER BY EVENT TYPE -------
  if (cmd.includes("bazaar")) {
    setEventTypeFilter?.("BAZAAR");
    return "Filtering to bazaar events.";
  }

  if (cmd.includes("workshop")) {
    setEventTypeFilter?.("WORKSHOP");
    return "Filtering to workshops.";
  }
  if (cmd.includes("trip")) {
    setEventTypeFilter?.("TRIP");
    return "Filtering to trips.";
  }

  if (cmd.includes("conference")) {
    setEventTypeFilter?.("CONFERENCE");
    return "Filtering to conferences.";
  }

  if (cmd.includes("booth")) {
    setEventTypeFilter?.("BOOTH");
    return "Filtering to booths.";
  }

  if (cmd.includes("show all events") || cmd.includes("reset filters")|| cmd.includes("reset filter")|| cmd.includes("go to all events")|| cmd.includes("all events")) {
    setEventTypeFilter?.("All");
    setSearchTerm?.("");
    setSearchLocation?.("");
    setProfessorFilter?.("");
    setDateFilter?.("");
    return "Resetting filters and showing all events.";
  }

  // ------- LOCATION FILTER -------
  // e.g. "show events in the auditorium"
  if (cmd.includes("in the") || cmd.includes("in ")|| cmd.includes("at ")|| cmd.includes("at the ")) {
    const match = cmd.match(/in (the )?(.+)/);
    if (match && setSearchLocation) {
      const loc = match[2].trim();
      setSearchLocation(loc);
      return `Filtering events in ${loc}.`;
    }
  }

  // ------- DATE FILTER -------
  // e.g. "show events today"
  if (cmd.includes("today")) {
    if (setDateFilter) {
      const today = new Date().toISOString().slice(0, 10);
      setDateFilter(today);
      return "Showing events happening today.";
    }
  }

  // ------- SEARCH COMMANDS -------
  // "search workshops", "search for ai", etc.
  if (cmd.startsWith("search for")) {
    const query = cmd.replace("search for", "").trim();
    if (query && setSearchTerm) {
      setSearchTerm(query);
      return `Searching for "${query}"`;
    }
  }

  if (cmd.startsWith("search")) {
    const query = cmd.replace("search", "").trim();
    if (query && setSearchTerm) {
      setSearchTerm(query);
      return `Searching for "${query}"`;
    }
  }
if (cmd.startsWith("searj")) {
    const query = cmd.replace("search", "").trim();
    if (query && setSearchTerm) {
      setSearchTerm(query);
      return `Searching for "${query}"`;
    }
  }
  // If nothing matched:
  return "Sorry, I didn't understand that command.";
}
