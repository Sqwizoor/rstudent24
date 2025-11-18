/**
 * MINIMAL TEST PAGE - NO AUTH, NO IMPORTS
 * This page has ZERO dependencies to test if React rendering works at all
 */
export default function MinimalTest() {
  return (
    <div style={{ padding: "40px", backgroundColor: "#10b981", color: "white" }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "16px" }}>
        ✅ React is Working!
      </h1>
      <p style={{ fontSize: "18px" }}>
        If you can see this green page with this text, React rendering is working fine.
      </p>
      <p style={{ fontSize: "14px", marginTop: "16px" }}>
        Current time: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
