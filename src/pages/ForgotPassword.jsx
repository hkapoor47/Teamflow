import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, LockKeyhole } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://65.0.11.153:5001/api";

export default function ForgotPassword() {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = async (path, body) => {
    const response = await fetch(`${API_BASE}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed. Please try again.");
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (step === "reset" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (step === "reset" && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (step === "email") {
        const data = await request("forgot-password", { email });
        setMessage(data.message || "If an account exists, an OTP has been sent.");
        setStep("otp");
      } else if (step === "otp") {
        const data = await request("verify-reset-otp", { email, otp });
        setMessage(data.message || "OTP verified.");
        setStep("reset");
      } else {
        const data = await request("reset-password", { email, password });
        setMessage(data.message || "Password reset successfully.");
        setStep("done");
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const title = step === "email" ? "Forgot your password?" : step === "otp" ? "Verify your email" : step === "reset" ? "Create a new password" : "Password reset complete";
  const description = step === "email" ? "Enter the email address associated with your account." : step === "otp" ? `Enter the six-digit code sent to ${email}.` : step === "reset" ? "Choose a strong password with at least 8 characters." : "Your password has been updated. You can now sign in.";

  const fieldStyle = { width: "100%", border: "1px solid #cbd5e1", borderRadius: 10, padding: "13px 14px", fontSize: 15, outlineColor: "#0d9488" };
  const buttonStyle = { width: "100%", border: 0, borderRadius: 10, padding: "13px 16px", background: "#0d9488", color: "#fff", fontWeight: 700, fontSize: 15, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f8fafc", fontFamily: "Inter, Arial, sans-serif" }}>
      <section style={{ width: "100%", maxWidth: 440, padding: 32, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, boxShadow: "0 18px 50px rgba(15,23,42,.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: 10, background: "#14b8a6", color: "#fff", fontWeight: 800, fontSize: 19 }}>T</div>
          <div><strong style={{ fontSize: 18 }}>TeamFlow</strong><div style={{ fontSize: 10, color: "#0d9488", letterSpacing: 2, fontWeight: 800 }}>AI</div></div>
        </div>
        <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", background: "#ccfbf1", color: "#0f766e", marginBottom: 18 }}>
          {step === "email" ? <Mail /> : step === "otp" ? <ShieldCheck /> : <LockKeyhole />}
        </div>
        <h1 style={{ fontSize: 26, margin: "0 0 10px", color: "#0f172a" }}>{title}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>{description}</p>

        {message && <div role="status" style={{ padding: 12, marginBottom: 16, borderRadius: 9, color: "#0f766e", background: "#f0fdfa", fontSize: 14 }}>{message}</div>}
        {error && <div role="alert" style={{ padding: 12, marginBottom: 16, borderRadius: 9, color: "#b91c1c", background: "#fef2f2", fontSize: 14 }}>{error}</div>}

        {step !== "done" ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            {step === "email" && <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 600 }}>Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} /></label>}
            {step === "otp" && <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 600 }}>6-digit OTP<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" style={{ ...fieldStyle, letterSpacing: 7, textAlign: "center", fontSize: 20 }} /></label>}
            {step === "reset" && <>
              <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 600 }}>New password<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={fieldStyle} /></label>
              <label style={{ display: "grid", gap: 8, fontSize: 13, fontWeight: 600 }}>Confirm new password<input type="password" minLength={8} required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" style={fieldStyle} /></label>
            </>}
            <button type="submit" disabled={busy} style={buttonStyle}>{busy ? "Please wait..." : step === "email" ? "Send OTP" : step === "otp" ? "Verify OTP" : "Reset password"}</button>
          </form>
        ) : <Link to="/login" style={{ ...buttonStyle, display: "block", textAlign: "center", textDecoration: "none" }}>Go to sign in</Link>}

        {step === "otp" && <button type="button" onClick={async () => { setError(""); setMessage(""); setBusy(true); try { const data = await request("forgot-password", { email }); setMessage(data.message || "If an account exists, an OTP has been sent."); } catch (err) { setError(err.message); } finally { setBusy(false); } }} disabled={busy} style={{ width: "100%", marginTop: 12, border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, background: "#fff", color: "#334155", fontWeight: 600, cursor: "pointer" }}>Resend OTP</button>}
        <Link to="/login" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 24, color: "#0f766e", fontSize: 14, fontWeight: 600, textDecoration: "none" }}><ArrowLeft size={16} /> Back to sign in</Link>
      </section>
    </main>
  );
}
