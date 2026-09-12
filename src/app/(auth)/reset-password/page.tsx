"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { dir, language } = useLanguage();
  const copy = getPageCopy(language).reset;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setMessage(copy.error);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(copy.error);
      return;
    }

    setLoading(true);

    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(copy.error);
      return;
    }

    setMessage(copy.success);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <main
      dir={dir}
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #edf9ff 0%, #dff4ff 42%, #eefaff 72%, #d8f0fc 100%)",
        padding: "20px",
      }}
    >
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
            marginBottom: "10px",
            color: "#111827",
          }}
        >
          {copy.title}
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#6b7280",
            marginBottom: "25px",
          }}
        >
          {copy.password}
        </p>

        <form
          onSubmit={handleResetPassword}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <input
            type="password"
            placeholder={copy.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder={copy.confirm}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
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
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            {loading ? copy.saving : copy.save}
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
          {copy.back}
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