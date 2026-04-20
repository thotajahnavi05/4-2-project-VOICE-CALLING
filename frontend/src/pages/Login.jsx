import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { saveUser, isAuthenticated } from "../utils/auth";
import { COLLEGE_LOGO_URL, COLLEGE_NAME } from "../utils/brand";

export default function Login() {
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      saveUser({
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        provider: "google",
      });
      toast.success(`Welcome ${decoded.given_name || decoded.name}!`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error("Google login failed");
    }
  };

  const handleCreateAccount = () => {
    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }
    if (password.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }

    const accounts = JSON.parse(localStorage.getItem("localAccounts") || "{}");
    if (accounts[username]) {
      toast.error("Username already exists");
      return;
    }
    accounts[username] = password;
    localStorage.setItem("localAccounts", JSON.stringify(accounts));

    toast.success("Account created — please sign in");
    setIsCreating(false);
    setPassword("");
  };

  const handleLocalLogin = () => {
    if (!username || !password) {
      toast.error("Enter username and password");
      return;
    }
    const accounts = JSON.parse(localStorage.getItem("localAccounts") || "{}");
    if (accounts[username] && accounts[username] === password) {
      saveUser({ name: username, username, provider: "local" });
      toast.success(`Welcome ${username}!`);
      navigate("/", { replace: true });
    } else {
      toast.error("Invalid credentials");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") {
      isCreating ? handleCreateAccount() : handleLocalLogin();
    }
  };

  return (
    <div className="relative min-h-screen bg-bg flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#1e2942_1px,transparent_0)] [background-size:40px_40px] opacity-40"></div>

      {/* Glow */}
      <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px]"></div>
      <div className="absolute w-[360px] h-[360px] bg-accent/10 rounded-full blur-[140px] top-10 right-10"></div>

      {/* Card */}
      <div className="relative z-10 w-[420px] p-[2px] rounded-3xl bg-gradient-to-br from-primary via-primary-light to-accent">
        <div className="bg-bg-secondary/95 backdrop-blur-xl rounded-3xl p-8 border border-border shadow-2xl">
          {/* College Logo */}
          <div className="flex justify-center mb-4">
            <div className="p-[2px] rounded-2xl bg-gradient-to-br from-primary via-primary-light to-accent">
              <div className="bg-white rounded-2xl p-2 flex items-center justify-center">
                <img
                  src={COLLEGE_LOGO_URL}
                  alt={COLLEGE_NAME}
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-center bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent tracking-wide mb-1">
            Voice AI India
          </h1>
          <p className="text-center text-text-muted text-xs tracking-widest uppercase mb-2">
            {COLLEGE_NAME}
          </p>

          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white">
              {isCreating ? "Create your account" : "Welcome back"}
            </h2>
            <p className="text-text-muted text-sm mt-1">
              {isCreating
                ? "Sign up to access the Bolna dashboard"
                : "Sign in to continue to your dashboard"}
            </p>
          </div>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKey}
            className="w-full mb-3 px-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary text-white placeholder-text-muted transition"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
            className="w-full mb-4 px-4 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary text-white placeholder-text-muted transition"
          />

          {isCreating ? (
            <button
              onClick={handleCreateAccount}
              className="w-full bg-gradient-to-r from-primary to-primary-dark py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition mb-4 shadow-lg shadow-primary/25"
            >
              Create Account
            </button>
          ) : (
            <button
              onClick={handleLocalLogin}
              className="w-full bg-gradient-to-r from-primary to-primary-dark py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition mb-4 shadow-lg shadow-primary/25"
            >
              Sign In
            </button>
          )}

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-border"></div>
            <span className="px-4 text-text-muted text-xs tracking-wider">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          <div className="flex justify-center mb-5">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Google login failed")}
              theme="filled_black"
              shape="pill"
              text={isCreating ? "signup_with" : "signin_with"}
            />
          </div>

          <p className="text-center text-text-muted text-sm">
            {isCreating ? "Already have an account?" : "Don't have an account?"}{" "}
            <span
              onClick={() => {
                setIsCreating(!isCreating);
                setPassword("");
              }}
              className="text-primary-light cursor-pointer hover:underline font-medium"
            >
              {isCreating ? "Sign In" : "Create Account"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
