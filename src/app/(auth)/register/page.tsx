"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";

export default function RegisterPage() {
  const router = useRouter();
  const { t, dir } = useLanguage();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage(t.messages.errorLabel);
      return;
    }

    if (password.length < 6) {
      setMessage(t.messages.errorLabel);
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(t.messages.registerSuccess);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main dir={dir} className="register-shell">
      <style>{`
        .w-full.max-w-md:has(> .register-shell) { max-width: none; height: 100dvh; padding: 0; }
        .register-shell { position: relative; isolation: isolate; box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; min-height: 100dvh; padding: 20px; overflow: hidden; background: linear-gradient(135deg, #edf9ff 0%, #dff4ff 42%, #eefaff 72%, #d8f0fc 100%); }
        .register-shell::before, .register-shell::after { position: absolute; z-index: -1; border-radius: 50%; content: ""; pointer-events: none; }
        .register-shell::before { top: -28%; left: -12%; width: 62vw; height: 58vh; background: rgba(255, 255, 255, .34); transform: rotate(-9deg); filter: blur(2px); }
        .register-shell::after { right: -16%; bottom: -32%; width: 70vw; height: 62vh; background: rgba(186, 229, 249, .34); transform: rotate(10deg); filter: blur(3px); }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          padding: "35px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "25px",
            color: "#111827",
          }}
        >
          {t.auth.register}
        </h1>

        <form
          onSubmit={handleRegister}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <input
            type="text"
            placeholder={t.auth.fullName}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder={t.auth.password}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
          />

          {message && (
            <div
              style={{
                padding: "10px",
                background: "#f3f4f6",
                borderRadius: "8px",
                textAlign: "center",
                color: "#111827",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? t.auth.register : t.auth.register}
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/login")}
          style={{
            width: "100%",
            marginTop: "18px",
            border: "none",
            background: "transparent",
            color: "#2563eb",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          {t.auth.login}
        </button>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px",
  border: "1px solid #9ca3af",
  borderRadius: "8px",
  fontSize: "16px",
  color: "#111827",
  background: "#ffffff",
};