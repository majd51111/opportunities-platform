"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLanguage } from "@/providers/app-providers";
import type { LanguageCode } from "@/languages";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { env } from "@/config/env";

export default function LoginPage() {
  const router = useRouter();
  const { t, dir, language } = useLanguage();
  const isArabic = dir === "rtl";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("oauth_error");
    if (oauthError) {
      setMessage(isArabic ? "تعذر إكمال تسجيل الدخول عبر المزود. حاول مرة أخرى." : "The provider sign-in could not be completed. Please try again.");
    }
  }, [isArabic]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    let authData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["data"];
    let error: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["error"];
    try {
      ({ data: authData, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }));
    } catch (loginError) {
      setLoading(false);
      setMessage(loginError instanceof Error ? loginError.message : (isArabic ? "تعذر الاتصال بخدمة تسجيل الدخول." : "Could not connect to the sign-in service."));
      return;
    }
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    if (!authData.user) {
      setMessage(isArabic ? "تعذر إنشاء جلسة تسجيل الدخول." : "Could not create a sign-in session.");
      return;
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("status")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profile?.status === "suspended" || profile?.status === "banned") {
      await supabase.auth.signOut();
      setMessage(profile.status === "banned" ? (isArabic ? "تم حظر هذا الحساب." : "This account has been banned.") : (isArabic ? "تم تعليق هذا الحساب." : "This account has been suspended."));
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/opportunities";
    setMessage(t.messages.loginSuccess);
    router.replace(destination);
    router.refresh();
  }

  async function handleOAuthLogin(provider: Extract<Provider, "google" | "apple">) {
    setMessage("");
    setLoading(true);
    const callbackUrl = new URL("/auth/callback", env.appUrl);
    callbackUrl.searchParams.set("next", "/opportunities");
    const { error } = await getSupabaseBrowserClient().auth.signInWithOAuth({ provider, options: { redirectTo: callbackUrl.toString() } });
    if (error) { setLoading(false); setMessage(error.message); }
  }

  const copyByLanguage = {
    ar: { brandName: "بوابة الفرص", welcome: "مرحبًا بك", subtitle: "سجّل الدخول إلى حسابك للوصول إلى الفرص", remember: "تذكرني", forgot: "نسيت كلمة المرور؟", divider: "أو تابع باستخدام", newHere: "ليس لديك حساب؟", register: "إنشاء حساب جديد", heroTitle: "فرص حقيقية لعالم أفضل", heroBody: "منصة تجمع لك أفضل فرص الربح الموثوقة من مختلف المجالات، مع مراجعة دقيقة لضمان المصداقية والجودة.", verified: "فرص موثوقة", verifiedSmall: "مراجعة دقيقة قبل النشر", categories: "تصنيفات متنوعة", categoriesSmall: "اختر المجال المناسب لك", community: "مجتمع متعاون", communitySmall: "استفد من تجارب المستخدمين", statsUsers: "مستخدم سعيد", statsOpportunities: "فرصة متاحة", statsCountries: "دولة مدعومة" },
    en: { brandName: "Opportunity Gateway", welcome: "Welcome", subtitle: "Sign in to your account to access opportunities", remember: "Remember me", forgot: "Forgot password?", divider: "Or continue with", newHere: "New here?", register: "Create a new account", heroTitle: "Real opportunities for a better world", heroBody: "A platform that brings together trusted earning opportunities, carefully reviewed for quality and reliability.", verified: "Trusted opportunities", verifiedSmall: "Reviewed before publishing", categories: "Diverse categories", categoriesSmall: "Find the right field for you", community: "Helpful community", communitySmall: "Learn from user experiences", statsUsers: "Happy users", statsOpportunities: "Available opportunities", statsCountries: "Supported countries" },
    es: { brandName: "Portal de Oportunidades", welcome: "Bienvenido", subtitle: "Inicia sesión para acceder a las oportunidades", remember: "Recordarme", forgot: "¿Olvidaste tu contraseña?", divider: "O continúa con", newHere: "¿Eres nuevo?", register: "Crear una cuenta", heroTitle: "Oportunidades reales para un mundo mejor", heroBody: "Una plataforma que reúne oportunidades confiables, revisadas cuidadosamente por su calidad y fiabilidad.", verified: "Oportunidades confiables", verifiedSmall: "Revisadas antes de publicarse", categories: "Categorías diversas", categoriesSmall: "Encuentra el campo adecuado", community: "Comunidad útil", communitySmall: "Aprende de las experiencias", statsUsers: "Usuarios felices", statsOpportunities: "Oportunidades disponibles", statsCountries: "Países disponibles" },
    fr: { brandName: "Portail des opportunités", welcome: "Bienvenue", subtitle: "Connectez-vous pour accéder aux opportunités", remember: "Se souvenir de moi", forgot: "Mot de passe oublié ?", divider: "Ou continuer avec", newHere: "Nouveau ici ?", register: "Créer un compte", heroTitle: "De vraies opportunités pour un monde meilleur", heroBody: "Une plateforme qui rassemble des opportunités fiables, soigneusement vérifiées pour leur qualité.", verified: "Opportunités fiables", verifiedSmall: "Vérifiées avant publication", categories: "Catégories variées", categoriesSmall: "Trouvez le domaine adapté", community: "Communauté solidaire", communitySmall: "Profitez des expériences partagées", statsUsers: "Utilisateurs satisfaits", statsOpportunities: "Opportunités disponibles", statsCountries: "Pays pris en charge" },
    de: { brandName: "Chancenportal", welcome: "Willkommen", subtitle: "Melden Sie sich an, um auf Chancen zuzugreifen", remember: "Angemeldet bleiben", forgot: "Passwort vergessen?", divider: "Oder fortfahren mit", newHere: "Neu hier?", register: "Konto erstellen", heroTitle: "Echte Chancen für eine bessere Welt", heroBody: "Eine Plattform mit vertrauenswürdigen Chancen, sorgfältig auf Qualität und Zuverlässigkeit geprüft.", verified: "Vertrauenswürdige Chancen", verifiedSmall: "Vor der Veröffentlichung geprüft", categories: "Vielfältige Kategorien", categoriesSmall: "Finden Sie den passenden Bereich", community: "Hilfreiche Gemeinschaft", communitySmall: "Profitieren Sie von Erfahrungen", statsUsers: "Zufriedene Nutzer", statsOpportunities: "Verfügbare Chancen", statsCountries: "Unterstützte Länder" },
    pt: { brandName: "Portal de Oportunidades", welcome: "Bem-vindo", subtitle: "Entre na sua conta para acessar oportunidades", remember: "Lembrar de mim", forgot: "Esqueceu a senha?", divider: "Ou continue com", newHere: "Novo por aqui?", register: "Criar uma conta", heroTitle: "Oportunidades reais para um mundo melhor", heroBody: "Uma plataforma que reúne oportunidades confiáveis, analisadas cuidadosamente quanto à qualidade.", verified: "Oportunidades confiáveis", verifiedSmall: "Analisadas antes da publicação", categories: "Categorias variadas", categoriesSmall: "Encontre a área certa", community: "Comunidade colaborativa", communitySmall: "Aprenda com outras experiências", statsUsers: "Usuários satisfeitos", statsOpportunities: "Oportunidades disponíveis", statsCountries: "Países atendidos" },
    ja: { brandName: "機会のポータル", welcome: "ようこそ", subtitle: "ログインしてさまざまな機会にアクセス", remember: "ログイン状態を保持", forgot: "パスワードをお忘れですか？", divider: "または次で続行", newHere: "初めてですか？", register: "アカウントを作成", heroTitle: "より良い世界のための本物の機会", heroBody: "品質と信頼性を丁寧に確認した、信頼できる機会を集めたプラットフォームです。", verified: "信頼できる機会", verifiedSmall: "公開前に確認済み", categories: "多様なカテゴリー", categoriesSmall: "自分に合う分野を発見", community: "助け合うコミュニティ", communitySmall: "みんなの経験を活用", statsUsers: "満足したユーザー", statsOpportunities: "利用可能な機会", statsCountries: "対応国" },
    zh: { brandName: "机会门户", welcome: "欢迎", subtitle: "登录账户以访问各种机会", remember: "记住我", forgot: "忘记密码？", divider: "或使用以下方式继续", newHere: "还没有账户？", register: "创建账户", heroTitle: "为更美好世界带来真实机会", heroBody: "汇集可信机会的平台，每个机会都经过严格审核，确保质量与可靠性。", verified: "可信机会", verifiedSmall: "发布前经过审核", categories: "多样分类", categoriesSmall: "找到适合你的领域", community: "互助社区", communitySmall: "分享和借鉴经验", statsUsers: "满意用户", statsOpportunities: "可用机会", statsCountries: "支持的国家" },
  } satisfies Record<LanguageCode, object>;
  const copy = copyByLanguage[language];

  return <main dir={dir} className="login-page">
    <style>{`
      .w-full.max-w-md:has(> .login-page) { width: 100%; max-width: none; min-height: 100dvh; padding: 0; }
      .login-page { min-height: 100dvh; overflow-x: hidden; color: #122044; background: radial-gradient(circle at 72% 18%, rgba(255,255,255,.96) 0 16%, transparent 38%), linear-gradient(135deg,#eef8ff 0%,#d9edff 52%,#f6f9ff 100%); }
      .login-topbar { position: relative; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 20px; width: min(100% - 64px, 1280px); min-height: 62px; margin: 18px auto 0; box-sizing: border-box; padding: 8px clamp(20px, 4vw, 48px); border: 1px solid rgba(211,226,244,.92); border-radius: 16px; background: rgba(255,255,255,.9); box-shadow: 0 10px 28px rgba(40,91,151,.08); backdrop-filter: blur(12px); }
      .login-logo { display: inline-flex; align-items: center; gap: 9px; color: #102148; text-decoration: none; }
      .login-logo-image { display: block; width: 62px; height: 62px; border: 1px solid #dbeafe; border-radius: 50%; background: #fff; object-fit: contain; object-position: center; box-shadow: 0 7px 16px rgba(37,99,235,.2); outline: 2px solid #eff6ff; outline-offset: 1px; }
      .login-logo-name { color: #12346f; font-size: 17px; font-weight: 800; letter-spacing: 0; white-space: nowrap; }
      .login-nav { display: flex; align-items: center; gap: clamp(16px,3vw,36px); }.login-nav a { color:#18264b; font-size: 13px; font-weight: 700; text-decoration:none; }.login-nav a:hover { color:#2563eb; }
      .login-actions { display:flex; align-items:center; gap:14px; }.login-actions a { display:inline-flex; min-height:38px; align-items:center; justify-content:center; border:1px solid #dce6f3; border-radius:9px; padding:0 20px; color:#2563eb; background:#fff; font-size:13px; font-weight:700; text-decoration:none; }
      .login-body { display:grid; min-height:calc(100dvh - 80px); grid-template-columns:minmax(0,1.1fr) minmax(450px,.9fr); }
      .login-visual { position:relative; overflow:hidden; padding:clamp(48px,7vw,92px) clamp(28px,7vw,100px) 46px; background:radial-gradient(ellipse at 76% 42%, rgba(255,255,255,.94) 0 12%, transparent 42%), linear-gradient(135deg,#cfeaff 0%,#e9f6ff 58%,#d5e7ff 100%); }
      .login-visual::before { position:absolute; left:-18%; top:10%; width:82%; height:70%; border:70px solid rgba(101,174,255,.22); border-left-color:transparent; border-bottom-color:transparent; border-radius:50%; transform:rotate(22deg); content:""; }
      .login-visual::after { position:absolute; right:-130px; bottom:-140px; width:520px; height:520px; border-radius:50%; background:rgba(57,132,245,.14); content:""; }
      .login-visual-content { position:relative; z-index:1; max-width:520px; }.login-visual h1 { white-space:nowrap; margin:0; color:#112451; font-size:clamp(34px,4.5vw,62px); line-height:1.1; letter-spacing:0; }.login-visual p { max-width:470px; margin:18px 0 32px; color:#536988; font-size:16px; font-weight:600; line-height:1.9; }
      .login-benefits { display:grid; gap:18px; }.login-benefit { display:grid; grid-template-columns:42px minmax(0,1fr); column-gap:12px; align-items:center; }.login-benefit i { grid-row:span 2; display:grid; place-items:center; width:42px; height:42px; border-radius:50%; color:#2563eb; background:rgba(255,255,255,.78); font-style:normal; font-size:19px; box-shadow:0 6px 15px rgba(77,120,185,.08); }.login-benefit strong { font-size:13px; }.login-benefit small { color:#62748f; font-size:11px; }
      .login-preview { position:relative; width:min(100%,500px); aspect-ratio:3 / 2; margin:34px auto 0; overflow:visible; background:transparent; border:0; border-radius:0; box-shadow:none; transform:none; }.login-preview img { width:100%; height:100%; display:block; object-fit:contain; object-position:center; content:url('/laptop-opportunity.png'); }
      .login-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:0; max-width:450px; margin:52px auto 0; overflow:hidden; border:1px solid rgba(255,255,255,.75); border-radius:10px; background:rgba(255,255,255,.82); box-shadow:0 10px 25px rgba(65,104,153,.1); }.login-stat { display:grid; justify-items:center; gap:3px; padding:13px 6px; text-align:center; }.login-stat + .login-stat { border-inline-start:1px solid #e4edf8; }.login-stat b { color:#178b5b; font-size:16px; }.login-stat:nth-child(2) b { color:#2563eb; }.login-stat:nth-child(3) b { color:#8547dd; }.login-stat span { color:#61708b; font-size:10px; font-weight:600; }
      .login-panel { display:grid; place-items:center; min-width:0; padding:clamp(24px,4vw,56px); background:rgba(248,252,255,.72); }.login-card { position:relative; width:min(100%,470px); box-sizing:border-box; overflow:hidden; padding:clamp(28px,4vw,42px); border:1px solid rgba(194,218,244,.98); border-radius:20px; background:radial-gradient(circle at 100% 0%, rgba(191,225,255,.58), transparent 34%), radial-gradient(circle at 0% 100%, rgba(226,241,255,.9), transparent 40%), linear-gradient(145deg,#ffffff 0%,#f6fbff 52%,#eaf5ff 100%); box-shadow:0 22px 48px rgba(26,63,113,.12); }.login-card::before { position:absolute; top:-105px; right:-90px; width:220px; height:220px; border:28px solid rgba(91,164,246,.12); border-left-color:transparent; border-bottom-color:transparent; border-radius:50%; transform:rotate(18deg); content:""; pointer-events:none; }.login-card::after { position:absolute; bottom:-135px; left:-95px; width:250px; height:250px; border-radius:50%; background:rgba(115,186,255,.1); content:""; pointer-events:none; }.login-card > * { position:relative; z-index:1; }.login-card h2 { margin:0; color:#112451; text-align:center; font-size:29px; }.login-card > p { margin:10px 0 30px; color:#71809b; text-align:center; font-size:14px; font-weight:600; }
      .login-form { display:grid; gap:17px; }.login-form label { display:grid; gap:7px; color:#253557; font-size:12px; font-weight:800; }.input-wrap { position:relative; }.input-wrap svg { position:absolute; top:50%; width:19px; color:#7183a3; transform:translateY(-50%); pointer-events:none; }.input-wrap svg:first-child { inset-inline-start:13px; }.login-form input { width:100%; height:44px; box-sizing:border-box; border:1px solid #cfdbea; border-radius:8px; padding:0 13px 0 42px; color:#16264a; background:#fff; font-size:13px; outline:none; }.login-form input:focus { border-color:#2c72f5; box-shadow:0 0 0 3px rgba(37,99,235,.1); }.login-form input[type="password"] { padding-inline-end:42px; }.login-options { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:-3px; font-size:12px; }.login-options label { display:flex; align-items:center; gap:8px; color:#445570; font-weight:600; }.login-options input { width:18px; height:18px; accent-color:#2563eb; }.login-options button { border:0; padding:0; color:#2563eb; background:transparent; font-size:12px; font-weight:700; cursor:pointer; }.login-submit { min-height:48px; border:0; border-radius:8px; color:#fff; background:linear-gradient(100deg,#2575f6,#2563eb); box-shadow:0 9px 17px rgba(37,99,235,.18); font-size:15px; font-weight:800; cursor:pointer; }.login-submit:disabled { cursor:not-allowed; opacity:.6; }.login-message { border-radius:8px; padding:10px; color:#3c5382; background:#edf4ff; text-align:center; font-size:12px; }.login-divider { display:flex; align-items:center; gap:12px; margin:24px 0 18px; color:#8795ad; font-size:12px; }.login-divider::before,.login-divider::after { flex:1; height:1px; background:#e4ebf4; content:""; }.login-socials { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }.login-social { display:inline-flex; min-height:42px; align-items:center; justify-content:center; gap:8px; border:1px solid #dce6f3; border-radius:8px; color:#21304d; background:#fff; font-size:12px; font-weight:700; cursor:pointer; }.login-social:disabled { cursor:not-allowed; opacity:.6; }.login-register { margin:22px 0 0; border-radius:9px; padding:13px; color:#61708b; background:#f2f7fd; text-align:center; font-size:12px; font-weight:600; }.login-register button { border:0; color:#2563eb; background:transparent; font-size:12px; font-weight:800; cursor:pointer; }
      @media (min-width:901px) and (max-height:950px) { .login-visual { padding-top:40px; padding-bottom:28px; }.login-visual h1 { font-size:48px; }.login-visual p { margin:12px 0 20px; line-height:1.65; }.login-benefits { gap:12px; }.login-preview { margin-top:22px; }.login-stats { margin-top:30px; }.login-stat { padding:10px 6px; } }
      @media (max-width:900px) { .login-body { grid-template-columns:1fr; }.login-visual { display:none; }.login-panel { min-height:calc(100dvh - 62px); }.login-card { max-width:500px; } }
      @media (max-width:900px) { .login-topbar { width:calc(100% - 32px); margin-top:10px; }.login-body { min-height:calc(100dvh - 72px); } }
      @media (max-width:650px) { .login-topbar { width:calc(100% - 20px); padding:8px 16px; }.login-nav { display:none; }.login-logo-image { width:52px; height:52px; }.login-logo-name { font-size:15px; }.login-actions a { display:none; }.login-card { padding:28px 20px; }.login-panel { padding:16px; }.login-socials { grid-template-columns:1fr; } }
      .input-wrap svg { display: none; }
      .login-form input { padding: 0 13px; }
      .login-form input::placeholder { transition: opacity .15s ease; }
      .login-form input:focus::placeholder { opacity: 0; }
      @media (min-width:901px) and (max-height:850px) { .login-panel { align-items:start; padding-top:18px; padding-bottom:18px; }.login-card { padding-top:26px; padding-bottom:26px; }.login-card > p { margin-bottom:20px; }.login-form { gap:13px; }.login-divider { margin-top:18px; margin-bottom:12px; }.login-social { min-height:38px; } }
    `}</style>
    <header className="login-topbar"><Link href="/" className="login-logo" aria-label={copy.brandName}><img src="/new-logo.png" alt={copy.brandName} className="login-logo-image" /><strong className="login-logo-name">{copy.brandName}</strong></Link><nav className="login-nav"><Link href="/opportunities">{t.common.opportunities}</Link><Link href="/search">{t.common.search}</Link><Link href="/support">{isArabic ? "الدعم والمساعدة" : "Support & Help"}</Link><Link href="/about">{isArabic ? "من نحن" : "About us"}</Link></nav><div className="login-actions"><LanguageSelector /><Link href="/register">{t.auth.register}</Link></div></header>
    <section className="login-body"><aside className="login-visual"><div className="login-visual-content"><h1>{copy.heroTitle}</h1><p>{copy.heroBody}</p><div className="login-benefits"><div className="login-benefit"><i>✓</i><strong>{copy.verified}</strong><small>{copy.verifiedSmall}</small></div><div className="login-benefit"><i>▦</i><strong>{copy.categories}</strong><small>{copy.categoriesSmall}</small></div><div className="login-benefit"><i>◉</i><strong>{copy.community}</strong><small>{copy.communitySmall}</small></div></div><div className="login-preview"><img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=85" alt="Laptop computer on a desk" /></div><div className="login-stats"><div className="login-stat"><b>+50,000</b><span>{copy.statsUsers}</span></div><div className="login-stat"><b>+1,200</b><span>{copy.statsOpportunities}</span></div><div className="login-stat"><b>+50</b><span>{copy.statsCountries}</span></div></div></div></aside><section className="login-panel"><section className="login-card"><h2>{copy.welcome}</h2><p>{copy.subtitle}</p><form className="login-form" onSubmit={handleLogin}><label>{t.auth.email}<span className="input-wrap"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg><input type="email" placeholder="example@domain.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label><label>{t.auth.password}<span className="input-wrap"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><input type="password" placeholder={isArabic ? "أدخل كلمة المرور" : "Enter your password"} value={password} onChange={(event) => setPassword(event.target.value)} required /></span></label><div className="login-options"><label><input type="checkbox" />{copy.remember}</label><button type="button" onClick={() => router.push("/forgot-password")}>{copy.forgot}</button></div>{message && <div className="login-message">{message}</div>}<button className="login-submit" type="submit" disabled={loading}>{t.auth.login}</button></form><div className="login-divider">{copy.divider}</div><div className="login-socials"><button className="login-social" type="button" onClick={() => handleOAuthLogin("google")} disabled={loading}><GoogleIcon />Google</button><button className="login-social" type="button" onClick={() => handleOAuthLogin("apple")} disabled={loading}><AppleIcon />Apple</button></div><p className="login-register">{copy.newHere} <button type="button" onClick={() => router.push("/register")}>{copy.register}</button></p></section></section></section>
  </main>;
}

function GoogleIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" focusable="false"><path fill="#4285F4" d="M21.35 12.27c0-.79-.07-1.54-.23-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.39Z" /><path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.75 9.75 0 0 0 12 21.75Z" /><path fill="#FBBC05" d="M6.54 13.85A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.31-1.85v-2.5H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.35l3.24-2.5Z" /><path fill="#EA4335" d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.2 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.65l3.24 2.5c.77-2.31 2.92-4.03 5.46-4.03Z" /></svg>; }
function AppleIcon() { return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" focusable="false"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.96.48 7.11-.57 1.5-1.31 2.99-2.53 4.1ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z" /></svg>; }
