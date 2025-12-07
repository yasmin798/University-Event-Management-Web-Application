export function handleVoiceCommand(text, navigate, setSearchTerm) {
  const cmd = text.toLowerCase();

  // NAVIGATION COMMANDS
  if (cmd.includes("gym")) return navigate("/gym-sessions");
  if (cmd.includes("loyalty")) return navigate("/vendors/loyalty");
  if (cmd.includes("registered events")) return navigate("/events/registered");
  if (cmd.includes("favorites")) return navigate("/favorites");
  if (cmd.includes("bazaar")) return navigate("/events?filter=BAZAAR");
  if (cmd.includes("workshop")) return navigate("/events?filter=WORKSHOP");
  if (cmd.includes("conference")) return navigate("/events?filter=CONFERENCE");
  if (cmd.includes("booth")) return navigate("/events?filter=BOOTH");

  // SEARCH COMMAND: "search workshops", "search sports events", etc.
  if (cmd.startsWith("search")) {
    const query = cmd.replace("search", "").trim();
    if (setSearchTerm) setSearchTerm(query);
    return;
  }

  alert("Voice command not recognized: " + text);
}
