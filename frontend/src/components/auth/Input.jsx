import { labelStyle, inputStyle, errorStyle } from "../../styles/authStyles";
export function Input({ label, error, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}:</label>
      <input {...props} style={inputStyle} />
      {error && <div style={errorStyle}>{error}</div>}
    </div>
  );
}