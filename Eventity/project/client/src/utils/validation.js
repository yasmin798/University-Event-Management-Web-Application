export function validateCommon(fields) {
    const errors = {};
    const {
      name,
      location,
      shortDescription,
      startDateTime,
      endDateTime,
      registrationDeadline,
    } = fields;
  
    if (!name) errors.name = "Required";
    if (!location) errors.location = "Required";
    if (shortDescription && shortDescription.length > 500)
      errors.shortDescription = "Max 500 chars";
    if (!startDateTime) errors.startDateTime = "Required";
    if (!endDateTime) errors.endDateTime = "Required";
    if (!registrationDeadline) errors.registrationDeadline = "Required";
  
    const start = startDateTime ? new Date(startDateTime) : null;
    const end = endDateTime ? new Date(endDateTime) : null;
    const reg = registrationDeadline ? new Date(registrationDeadline) : null;
  
    if (start && end && start >= end)
      errors.endDateTime = "End must be after Start";
    if (reg && start && reg > start)
      errors.registrationDeadline =
        "Registration deadline must be on/before Start";
  
    return errors;
  }

  // In client/src/utils/validation.js
// ... existing imports/exports (e.g., validateBazaar, isEditable, newId)

// Add this new export
export function validateConference(data) {
  const errors = {};

  // Required fields
  if (!data.name?.trim()) errors.name = "Name is required.";
  if (!data.shortDescription?.trim()) errors.shortDescription = "Short description is required.";
  if (!data.startDateTime) errors.startDateTime = "Start date/time is required.";
  if (!data.endDateTime) errors.endDateTime = "End date/time is required.";
  if (!data.fullAgenda?.trim()) errors.fullAgenda = "Full agenda is required.";
  if (!data.requiredBudget || data.requiredBudget < 0) errors.requiredBudget = "Valid budget (non-negative) is required.";
  if (!data.fundingSource) errors.fundingSource = "Funding source is required.";

  // Logical checks
  if (data.startDateTime && data.endDateTime && new Date(data.startDateTime) >= new Date(data.endDateTime)) {
    errors.endDateTime = "End must be after start.";
  }

  // Optional fields (URL format if provided)
  if (data.website && !/^https?:\/\//.test(data.website)) {
    errors.website = "Website must be a valid URL (e.g., https://example.com).";
  }

  return errors;
}

// ... rest of file
  
  export function validateBazaar(fields) {
    return validateCommon(fields);
  }
  
  export function validateTrip(fields) {
    const errors = validateCommon(fields);
    if (fields.price === "" || fields.price == null) errors.price = "Required";
    else if (Number(fields.price) < 0) errors.price = "Must be >= 0";
  
    if (fields.capacity === "" || fields.capacity == null)
      errors.capacity = "Required";
    else if (
      !Number.isInteger(Number(fields.capacity)) ||
      Number(fields.capacity) < 1
    )
      errors.capacity = "Must be an integer >= 1";
  
    return errors;
  }
  
  export function isEditable(startDateTime) {
    if (!startDateTime) return true;
    return new Date() < new Date(startDateTime);
  }
  
  export function newId() {
    return Math.random().toString(36).slice(2, 10);
  }