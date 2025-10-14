// client/src/pages/BazaarForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";
import FormField from "../components/FormField";
import { validateBazaar, isEditable } from "../utils/validation";
import "../events.theme.css";

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default function BazaarForm() {
  const { id } = useParams(); // Mongo _id when editing
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(editing); // only load when editing
  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    // local form state uses "name" but backend uses "title"
    name: "",
    location: "",
    shortDescription: "",
    startDateTime: "",
    endDateTime: "",
    registrationDeadline: "",
  });

  // lock if started (re-evaluates whenever start changes)
  const canEdit = useMemo(
    () => isEditable(data.startDateTime),
    [data.startDateTime]
  );

  // ---- Load existing bazaar on edit ----
  useEffect(() => {
    if (!editing) return;

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/bazaars/${id}`, {
          credentials: "omit",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const doc = await res.json(); // assume the route returns the bazaar document
        if (cancelled) return;

        setData({
          name: doc.title || doc.name || "",
          location: doc.location || "",
          shortDescription: doc.shortDescription || "",
          startDateTime: doc.startDateTime
            ? doc.startDateTime.slice(0, 16)
            : "",
          endDateTime: doc.endDateTime ? doc.endDateTime.slice(0, 16) : "",
          registrationDeadline: doc.registrationDeadline
            ? doc.registrationDeadline.slice(0, 16)
            : "",
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load bazaar");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editing, id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  }

  async function saveBazaar() {
    const errs = validateBazaar({ ...data });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Bazaars can’t be edited after the start time.");
      return;
    }

    // Build clean payload (omit optional date if empty)
    const payload = {
      title: (data.name || "").trim(),
      location: (data.location || "").trim(),
      shortDescription: (data.shortDescription || "").trim(),
      startDateTime: data.startDateTime
        ? new Date(data.startDateTime).toISOString()
        : null, // required
      endDateTime: data.endDateTime
        ? new Date(data.endDateTime).toISOString()
        : null, // required
      ...(data.registrationDeadline
        ? {
            registrationDeadline: new Date(
              data.registrationDeadline
            ).toISOString(),
          }
        : {}), // omit if empty
    };

    try {
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API}/api/bazaars/${id}` : `${API}/api/bazaars`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("Save bazaar failed:", res.status, txt);
        alert(
          `Failed to save bazaar (${res.status}). ${txt || "See console."}`
        );
        return;
      }

      navigate("/events", { replace: true });
    } catch (e) {
      console.error(e);
      alert("Failed to save bazaar");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Validate before opening confirm
    const errs = validateBazaar(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) {
      alert("Bazaars can’t be edited after the start time.");
      return;
    }

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
            Back
          </button>
        </div>

        {editing && loading ? (
          <div className="empty">Loading…</div>
        ) : (
          <>
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
                  <FormField
                    label="Start"
                    error={errors.startDateTime}
                    required
                  >
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

            {/* Confirm modal */}
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
                        saveBazaar();
                      }}
                    >
                      {editing ? "Save changes" : "Create bazaar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
