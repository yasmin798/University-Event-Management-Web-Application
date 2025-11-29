import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import FormField from "../components/FormField";
import { validateBazaar, isEditable } from "../utils/validation";
import "../events.theme.css";

const API =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default function BazaarForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [filter, setFilter] = useState("All"); // for sidebar
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [errors, setErrors] = useState({});

  const [data, setData] = useState({
    name: "",
    location: "",
    shortDescription: "",
    startDateTime: "",
    endDateTime: "",
    registrationDeadline: "",
  });

  const canEdit = useMemo(
    () => isEditable(data.startDateTime),
    [data.startDateTime]
  );

  useEffect(() => {
    if (!editing) return;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/bazaars/${id}`);
        if (!res.ok) throw new Error("Failed to load bazaar");
        const doc = await res.json();

        setData({
          name: doc.title || "",
          location: doc.location || "",
          shortDescription: doc.shortDescription || "",
          startDateTime: doc.startDateTime?.slice(0, 16) || "",
          endDateTime: doc.endDateTime?.slice(0, 16) || "",
          registrationDeadline: doc.registrationDeadline?.slice(0, 16) || "",
        });
      } catch (e) {
        console.error(e);
        alert("Failed to load bazaar");
      } finally {
        setLoading(false);
      }
    })();
  }, [editing, id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
  }

  async function saveBazaar() {
    const errs = validateBazaar(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (!canEdit && editing) return alert("Cannot edit after start.");

    const payload = {
      title: data.name,
      location: data.location,
      shortDescription: data.shortDescription,
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
      ...(data.registrationDeadline
        ? {
            registrationDeadline: new Date(
              data.registrationDeadline
            ).toISOString(),
          }
        : {}),
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
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.error || "Failed to save";
        throw new Error(errorMsg);
      }

      navigate("/events");
    } catch (e) {
      alert(e.message || "Save failed");
      console.error(e);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validateBazaar(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setConfirmOpen(true);
  }

  return (
    <div
      className="events-theme"
      style={{ display: "flex", minHeight: "100vh" }}
    >
      {/* LEFT SIDEBAR */}
      <Sidebar filter={filter} setFilter={setFilter} />

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: "24px", marginLeft: "260px" }}>
        <h1 style={{ marginTop: 0 }}>
          {editing ? "Edit Bazaar" : "Create Bazaar"}
        </h1>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {!canEdit && editing && (
              <div className="lock">
                This bazaar has started — editing disabled.
              </div>
            )}

            <form onSubmit={handleSubmit} className="form form-pro">
              {/* BASIC DETAILS */}
              <fieldset className="form-sec">
                <legend>Basic details</legend>

                <div className="form-grid">
                  <FormField label="Name" error={errors.name} required>
                    <input
                      name="name"
                      value={data.name}
                      onChange={handleChange}
                      disabled={!canEdit && editing}
                    />
                  </FormField>

                  <FormField label="Location" error={errors.location} required>
                    <input
                      name="location"
                      value={data.location}
                      onChange={handleChange}
                      disabled={!canEdit && editing}
                    />
                  </FormField>

                  <FormField
                    label="Short Description"
                    error={errors.shortDescription}
                  >
                    <textarea
                      name="shortDescription"
                      value={data.shortDescription}
                      onChange={handleChange}
                      rows={3}
                      disabled={!canEdit && editing}
                    />
                  </FormField>
                </div>
              </fieldset>

              {/* SCHEDULE */}
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
                      disabled={!canEdit && editing}
                    />
                  </FormField>

                  <FormField label="End" error={errors.endDateTime} required>
                    <input
                      type="datetime-local"
                      name="endDateTime"
                      value={data.endDateTime}
                      onChange={handleChange}
                      disabled={!canEdit && editing}
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
                      disabled={!canEdit && editing}
                    />
                  </FormField>
                </div>
              </fieldset>

              <div className="form-actions">
                <button className="btn" type="submit">
                  {editing ? "Save Changes" : "Create Bazaar"}
                </button>
              </div>
            </form>

            {confirmOpen && (
              <div className="confirm-overlay">
                <div className="confirm">
                  <h2>{editing ? "Save changes?" : "Create this bazaar?"}</h2>

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
      </main>
    </div>
  );
}
