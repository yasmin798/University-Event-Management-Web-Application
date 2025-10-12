import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import FormField from "../components/FormField";
import { useLocalEvents } from "../hooks/useLocalEvents";
import { validateTrip, isEditable, newId } from "../utils/validation";
import "../events.theme.css";

export default function TripForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, upsert } = useLocalEvents();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const editing = Boolean(id);
  const existing = editing ? get(id) : null;

  const [data, setData] = useState(
    existing || {
      id: newId(),
      type: "TRIP",
      name: "",
      location: "",
      shortDescription: "",
      startDateTime: "",
      endDateTime: "",
      registrationDeadline: "",
      price: "",
      capacity: "",
    }
  );
  const [errors, setErrors] = useState({});

  const canEdit = isEditable(data.startDateTime);

  useEffect(() => {
    if (existing) setData(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  }
  // --- keep your imports and state as-is (you can remove showSuccess if unused) ---

  function saveTrip() {
    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can’t be edited after the start time.");
      return;
    }

    upsert(data);
    navigate("/events", { replace: true }); // go to Events home
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Validate BEFORE opening the confirm modal
    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can’t be edited after the start time.");
      return;
    }

    // Open the confirmation modal for BOTH create and edit
    setConfirmOpen(true);
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (editing) {
      setConfirmOpen(true);
    } else {
      saveTrip();
    }
  }
  function handleSubmit(e) {
    e.preventDefault();

    // validate first
    const errs = validateTrip(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Trips can’t be edited after the start time.");
      return;
    }

    // OPEN the confirm modal (for both create and edit)
    setConfirmOpen(true);
  }
  function saveTrip() {
    // (optional) you can skip re-validating if you validated in handleSubmit
    upsert(data);
    navigate("/events", { replace: true });
  }

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        {/* Title left, Back right */}
        <div className="eo-head-row">
          <h1>{editing ? "Edit Trip" : "Create Trip"}</h1>
          <button
            type="button"
            className="btn btn-outline eo-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>
        </div>

        {!canEdit && editing && (
          <div className="lock">
            This trip has started; editing is disabled.
          </div>
        )}

        <form onSubmit={handleSubmit} className="form form-pro" noValidate>
          {/* Basic info */}
          <fieldset className="form-sec">
            <legend>Basic details</legend>

            <div className="form-grid">
              <FormField label="Name" error={errors.name} required>
                <input
                  name="name"
                  placeholder="e.g., Mountain Hiking Adventure"
                  value={data.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  disabled={!canEdit && editing}
                  autoComplete="off"
                />
                <div className="help">Use a clear, descriptive title.</div>
              </FormField>

              <FormField label="Location" error={errors.location} required>
                <input
                  name="location"
                  placeholder="e.g., Blue Ridge Mountains, NC"
                  value={data.location}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.location)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Destination or meeting point.</div>
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
              >
                <textarea
                  name="shortDescription"
                  placeholder="Brief overview of the trip experience."
                  value={data.shortDescription}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.shortDescription)}
                  rows={3}
                  disabled={!canEdit && editing}
                />
                <div className="help">This appears in the events list.</div>
              </FormField>
            </div>
          </fieldset>

          {/* Scheduling */}
          <fieldset className="form-sec">
            <legend>Schedule</legend>

            <div className="form-grid form-grid-3">
              <FormField label="Start" error={errors.startDateTime} required>
                <input
                  type="datetime-local"
                  name="startDateTime"
                  value={data.startDateTime}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.startDateTime)}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField label="End" error={errors.endDateTime} required>
                <input
                  type="datetime-local"
                  name="endDateTime"
                  value={data.endDateTime}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.endDateTime)}
                  disabled={editing && !canEdit}
                />
              </FormField>

              <FormField
                label="Registration Deadline"
                error={errors.registrationDeadline}
              >
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={data.registrationDeadline}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.registrationDeadline)}
                  disabled={editing && !canEdit}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Capacity & pricing */}
          <fieldset className="form-sec">
            <legend>Capacity & pricing</legend>

            <div className="form-grid form-grid-2">
              <FormField label="Price" error={errors.price}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  placeholder="e.g., 150.00"
                  value={data.price}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.price)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Leave 0 for free trips.</div>
              </FormField>

              <FormField label="Capacity" error={errors.capacity} required>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="capacity"
                  placeholder="e.g., 40"
                  value={data.capacity}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.capacity)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Maximum number of attendees.</div>
              </FormField>
            </div>
          </fieldset>
          {confirmOpen && (
            <div className="confirm-overlay" role="dialog" aria-modal="true">
              <div className="confirm">
                <h2>{editing ? "Save changes?" : "Create this trip?"}</h2>
                <p>
                  {editing ? (
                    <>
                      Are you sure you want to save these edits to{" "}
                      <strong>{data.name || "this trip"}</strong>?
                    </>
                  ) : (
                    <>
                      Are you sure you want to create{" "}
                      <strong>{data.name || "this trip"}</strong>?
                    </>
                  )}
                </p>
                <div className="confirm-actions">
                  <button
                    className="btn btn-outline"
                    onClick={() => setConfirmOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      setConfirmOpen(false);
                      saveTrip(); // ← only here do we save + navigate
                    }}
                  >
                    {editing ? "Save changes" : "Create trip"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              className="btn"
              type="submit"
              disabled={editing && !canEdit}
            >
              {editing ? "Save Changes" : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}