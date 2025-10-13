export default function FormField({ label, children, error }) {
    return (
      <div className="field">
        <label>{label}</label>
        {children}
        {error ? <div className="error">{error}</div> : null}
      </div>
    );
  }