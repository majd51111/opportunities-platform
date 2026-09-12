"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import { getPageCopy } from "@/languages/page-copy";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { dir, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const copy = getPageCopy(language).forgot;

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });

    setLoading(false);
    setMessage(error ? copy.error : copy.success);
  }

  return (
    <main dir={dir} className="forgot-page">
      <style>{`
        .forgot-page { display: grid; place-items: center; min-height: 100%; padding: 24px; box-sizing: border-box; color: #14183d; }
        .forgot-card { width: min(100%, 470px); box-sizing: border-box; padding: 44px; border: 1px solid #f0f0fa; border-radius: 20px; background: rgba(255,255,255,.96); box-shadow: 0 16px 35px rgba(31,34,86,.1); }
        .forgot-card h1 { margin: 0 0 12px; text-align: center; font-size: 30px; }
        .forgot-card p { margin: 0 0 28px; color: #777b98; text-align: center; font-size: 15px; line-height: 1.7; }
        .forgot-form { display: grid; gap: 14px; }
        .forgot-form label { color: #34375b; font-size: 13px; font-weight: 700; }
        .forgot-form input { width: 100%; height: 50px; box-sizing: border-box; margin-top: 8px; border: 1px solid #bfc1d4; border-radius: 10px; padding: 0 15px; outline: none; color: #171a3d; background: #fff; font-size: 15px; }
        .forgot-submit { height: 52px; border: 0; border-radius: 10px; color: #fff; background: linear-gradient(100deg,#6c5cf5,#4c3ecb); font-size: 15px; font-weight: 800; cursor: pointer; }
        .forgot-back { border: 0; color: #6252e9; background: transparent; cursor: pointer; font-size: 13px; }
        .forgot-message { padding: 10px; border-radius: 8px; color: #3b3971; background: #f0efff; text-align: center; font-size: 13px; line-height: 1.6; }
        @media (max-width: 520px) { .forgot-card { padding: 28px 22px; } }
      `}</style>
      <section className="forgot-card">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
        <form className="forgot-form" onSubmit={handleForgotPassword}>
          <label>
            {copy.email}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          {message && <div className="forgot-message">{message}</div>}
          <button className="forgot-submit" type="submit" disabled={loading}>
            {loading ? copy.sending : copy.send}
          </button>
        </form>
        <button className="forgot-back" type="button" onClick={() => router.push("/login")}>
          {copy.back}
        </button>
      </section>
    </main>
  );
}
