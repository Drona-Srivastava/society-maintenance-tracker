import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UserRound,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import {
  register as registerRequest,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from "../api/auth";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const loggedInUser = await login(
        email.trim(),
        password,
      );

      if (loggedInUser.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to log in. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      return;
    }

    if (cleanAddress.length < 5) {
      setError("Please enter your address.");
      return;
    }

    setSubmitting(true);

    try {
      await registerRequest({
        name: cleanName,
        email: cleanEmail,
        password,
        phone: cleanPhone,
        address: cleanAddress,
      });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setAddress("");

      setSuccess(
        "Account created successfully. You can now sign in.",
      );

      setMode("login");
    } catch (error) {
      const detail = error.response?.data?.detail;

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg)
            .join(" "),
        );
      } else {
        setError(
          detail ||
            "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await forgotPassword(cleanEmail);

      setEmail(cleanEmail);
      setOtp("");
      setMode("forgot-otp");

      setSuccess(
        response?.message ||
          "If an account exists with this email, a verification code has been sent.",
      );
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to send verification code. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();

    const cleanOTP = otp.trim();

    if (!/^\d{6}$/.test(cleanOTP)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await verifyResetOTP(
        email.trim(),
        cleanOTP,
      );

      setOtp(cleanOTP);
      setMode("forgot-password");

      setSuccess(
        response?.message ||
          "Verification successful. You can now set a new password.",
      );
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Invalid or expired verification code.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await resetPassword(
        email.trim(),
        otp.trim(),
        password,
      );

      setPassword("");
      setConfirmPassword("");
      setOtp("");

      setMode("login");

      setSuccess(
        response?.message ||
          "Password reset successfully. You can now sign in.",
      );
    } catch (error) {
      setError(
        error.response?.data?.detail ||
          "Unable to reset your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <LockKeyhole size={20} />
          </div>

          <p className="auth-eyebrow">
            Society Maintenance Tracker
          </p>

          <h1>
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
                ? "Create your account"
                : mode === "forgot-email"
                  ? "Forgot your password?"
                  : mode === "forgot-otp"
                    ? "Check your email"
                    : "Create a new password"}
          </h1>

          <p className="auth-description">
            {mode === "login"
              ? "Sign in to manage your society maintenance requests."
              : mode === "register"
                ? "Create your resident account to access the society portal."
                : mode === "forgot-email"
                  ? "Enter your email and we'll send you a verification code."
                  : mode === "forgot-otp"
                    ? `Enter the 6-digit code sent to ${email}.`
                    : "Choose a new password for your account."}
          </p>
        </div>

        {/* LOGIN */}
        {mode === "login" ? (
          <form
            onSubmit={handleLogin}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <Mail size={16} />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <button
                  type="button"
                  className="auth-link-button"
                  onClick={() => {
                    setMode("forgot-email");
                    setError("");
                    setSuccess("");
                    setPassword("");
                    setConfirmPassword("");
                    setOtp("");
                  }}
                  disabled={submitting}
                >
                  Forgot password?
                </button>
              </div>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {(error || success) && (
              <div
                className={`auth-message ${
                  error ? "error" : "success"
                }`}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? "Signing in..."
                : "Sign in"}
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <p className="auth-switch">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() =>
                  switchMode("register")
                }
                disabled={submitting}
              >
                Create account
              </button>
            </p>
          </form>

        ) : mode === "register" ? (
          /* REGISTER */
          <form
            onSubmit={handleRegister}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="register-name">
                Full name
              </label>

              <div className="auth-input-wrapper">
                <UserRound size={16} />

                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your full name"
                  autoComplete="name"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <Mail size={16} />

                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-phone">
                Phone number
              </label>

              <div className="auth-input-wrapper">
                <Phone size={16} />

                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+91 9876543210"
                  autoComplete="tel"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-address">
                Address
              </label>

              <div className="auth-address-wrapper">
                <MapPin
                  size={16}
                  className="auth-address-icon"
                />

                <textarea
                  id="register-address"
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  placeholder="Enter your society / flat address"
                  autoComplete="street-address"
                  disabled={submitting}
                  required
                  rows={3}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">
                Password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="register-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  disabled={submitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {(error || success) && (
              <div
                className={`auth-message ${
                  error ? "error" : "success"
                }`}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? "Creating account..."
                : "Create account"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() =>
                  switchMode("login")
                }
                disabled={submitting}
              >
                Sign in
              </button>
            </p>

            <button
              type="button"
              className="auth-back-button"
              onClick={() =>
                switchMode("login")
              }
              disabled={submitting}
            >
              <ArrowLeft size={15} />
              Back to login
            </button>
          </form>

        ) : mode === "forgot-email" ? (
          /* FORGOT PASSWORD - EMAIL */
          <form
            onSubmit={handleForgotPassword}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="forgot-email">
                Email address
              </label>

              <div className="auth-input-wrapper">
                <Mail size={16} />

                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {(error || success) && (
              <div
                className={`auth-message ${
                  error ? "error" : "success"
                }`}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? "Sending code..."
                : "Send verification code"}
            </button>

            <button
              type="button"
              className="auth-back-button"
              onClick={() =>
                switchMode("login")
              }
              disabled={submitting}
            >
              <ArrowLeft size={15} />
              Back to login
            </button>
          </form>

        ) : mode === "forgot-otp" ? (
          /* FORGOT PASSWORD - OTP */
          <form
            onSubmit={handleVerifyOTP}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="reset-otp">
                Verification code
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }
                  placeholder="Enter 6-digit code"
                  autoComplete="one-time-code"
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            {(error || success) && (
              <div
                className={`auth-message ${
                  error ? "error" : "success"
                }`}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? "Verifying..."
                : "Verify code"}
            </button>

            <button
              type="button"
              className="auth-back-button"
              onClick={() => {
                setMode("forgot-email");
                setError("");
                setSuccess("");
                setOtp("");
              }}
              disabled={submitting}
            >
              <ArrowLeft size={15} />
              Change email
            </button>
          </form>

        ) : (
          /* FORGOT PASSWORD - NEW PASSWORD */
          <form
            onSubmit={handleResetPassword}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="reset-password">
                New password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="reset-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reset-confirm-password">
                Confirm password
              </label>

              <div className="auth-input-wrapper">
                <LockKeyhole size={16} />

                <input
                  id="reset-confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  disabled={submitting}
                  required
                />

                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value,
                    )
                  }
                  disabled={submitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            {(error || success) && (
              <div
                className={`auth-message ${
                  error ? "error" : "success"
                }`}
              >
                {error || success}
              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={submitting}
            >
              {submitting
                ? "Resetting password..."
                : "Reset password"}
            </button>

            <button
              type="button"
              className="auth-back-button"
              onClick={() =>
                switchMode("login")
              }
              disabled={submitting}
            >
              <ArrowLeft size={15} />
              Back to login
            </button>
          </form>
        )}
      </div>
    </main>
  );
}