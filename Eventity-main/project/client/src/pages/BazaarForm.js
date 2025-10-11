// client/src/pages/BazaarForm.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import FormField from "../components/FormField";
import { useLocalEvents } from "../hooks/useLocalEvents";
import { validateBazaar, isEditable, newId } from "../utils/validation";
import "../events.theme.css";

export default function BazaarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, upsert } = useLocalEvents();

  const editing = Boolean(id);
  const existing = editing ? get(id) : null;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [data, setData] = useState(
    existing || {
      id: newId(),
      type: "BAZAAR",
      name: "",
      location: "",
      shortDescription: "",
      startDateTime: "",
      endDateTime: "",
      registrationDeadline: "",
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

  // Save + go to Events home
  function saveBazaar() {
    // (Optional re-validate—safe if user changed before confirm)
    const errs = validateBazaar(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Bazaars can’t be edited after the start time.");
      return;
    }

    upsert(data);
    navigate("/events", { replace: true });
  }

  // One submit handler only – open confirm modal after validation
  function handleSubmit(e) {
    e.preventDefault();

    // Validate first
    const errs = validateBazaar(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Bazaars can’t be edited after the start time.");
      return;
    }

    // OPEN the confirm modal (for both create and edit)
    setConfirmOpen(true);
  }

  return (
    <div className="events-theme">
      <div className="container">
        <NavBar bleed />

        <div className="eo-head-row">
          <h1>{editing ? "Edit Bazaar" : "Create Bazaar"}</h1>
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
            This bazaar has started; editing is disabled.
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
                  placeholder="e.g., Spring Charity Bazaar"
                  value={data.name}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.name)}
                  disabled={!canEdit && editing}
                  autoComplete="off"
                />
                <div className="help">Use a clear, searchable title.</div>
              </FormField>

              <FormField label="Location" error={errors.location} required>
                <input
                  name="location"
                  placeholder="e.g., Main Hall, Building A"
                  value={data.location}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.location)}
                  disabled={!canEdit && editing}
                />
                <div className="help">Room, building, or address.</div>
              </FormField>

              <FormField
                label="Short Description"
                error={errors.shortDescription}
              >
                <textarea
                  name="shortDescription"
                  placeholder="One or two sentences about the bazaar."
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

          {/* Actions */}
          <div className="form-actions">
            <button
              className="btn"
              type="submit"
              disabled={editing && !canEdit}
            >
              {editing ? "Save Changes" : "Create Bazaar"}
            </button>
          </div>
        </form>

        {/* CONFIRM MODAL */}
        {confirmOpen && (
          <div className="confirm-overlay" role="dialog" aria-modal="true">
            <div className="confirm">
              <h2>{editing ? "Save changes?" : "Create this bazaar?"}</h2>
              <p>
                {editing ? (
                  <>
                    Are you sure you want to save these edits to{" "}
                    <strong>{data.name || "this bazaar"}</strong>?
                  </>
                ) : (
                  <>
                    Are you sure you want to create{" "}
                    <strong>{data.name || "this bazaar"}</strong>?
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
                    saveBazaar(); // save + navigate to /events
                  }}
                >
                  {editing ? "Save changes" : "Create bazaar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
