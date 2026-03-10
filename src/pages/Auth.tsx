import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap,
  Loader2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroDashboard from "@/assets/hero-dashboard.png";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSignup = () => {
    const e: Record<string, string> = {};
    if (!signupFirstName.trim()) e.firstName = "Requis";
    if (!signupLastName.trim()) e.lastName = "Requis";
    if (!signupEmail.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) e.email = "E-mail invalide";
    if (signupPassword.length < 6) e.password = "6 caractères minimum";
    if (signupPassword !== signupConfirmPassword) e.confirmPassword = "Ne correspond pas";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) toast.error("Identifiants incorrects.");
    else navigate("/dashboard");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: `${signupFirstName} ${signupLastName}`.trim(),
          organization_name: "Mon atelier",
          phone: signupPhone,
        },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Vérifiez votre boîte mail pour confirmer votre compte.");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
    if (error) toast.error("Erreur lors de la connexion Google");
  };

  const PasswordField = ({ id, value, onChange, show, onToggle, placeholder, error }: {
    id: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string; error?: string;
  }) => (
    <div className="relative">
      <Input
        id={id} type={show ? "text" : "password"} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} required
        className={`pr-10 h-[42px] text-sm ${error ? "border-destructive" : ""}`}
      />
      <button type="button" onClick={onToggle} tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
        {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );

  const inputClass = (err?: string) =>
    `h-[42px] text-sm ${err ? "border-destructive" : ""}`;

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="flex w-full max-w-[1200px]">
      {/* LEFT — Visual panel */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden">
        {/* Premium gradient background */}
        <div className="absolute inset-0 gradient-primary opacity-[0.04]" />
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] bg-primary-glow/8 rounded-full blur-[100px]" />
          <div className="absolute inset-0 bg-dots opacity-20" />
        </div>

        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          <Link to="/" className="inline-flex items-center gap-2.5 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display text-foreground">BonoitecPilot</span>
          </Link>

          <div className="max-w-md space-y-8 -mt-8">
            <div className="space-y-4">
              <h1 className="text-[2.5rem] leading-[1.15] font-extrabold tracking-tight text-foreground font-display">
                Votre atelier,<br />
                <span className="gradient-text">simplifié.</span>
              </h1>
              <p className="text-[15px] text-muted-foreground leading-relaxed max-w-sm">
                Gérez vos réparations, devis, clients et stock depuis une seule plateforme intuitive.
              </p>
            </div>

            <div className="space-y-2.5">
              {["Devis et factures automatisés", "Suivi des réparations en temps réel", "Gestion de stock intégrée", "Essai gratuit 30 jours"].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full gradient-primary-subtle text-primary">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="text-sm text-foreground/80">{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm shadow-premium-lg overflow-hidden">
              <img src={heroDashboard} alt="Interface BonoitecPilot" className="w-full h-auto" loading="lazy" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground/50">
            Accès complet · Sans carte bancaire · Annulation libre
          </p>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 sm:px-8 lg:px-16">
        {/* Theme toggle */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        {/* Mobile header */}
        <div className="lg:hidden flex flex-col items-center gap-1 mb-10">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-md shadow-primary/20">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display text-foreground">BonoitecPilot</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-display">
              {activeTab === "signup" ? "Créez votre espace" : "Bon retour"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              {activeTab === "signup"
                ? "30 jours gratuits, sans engagement."
                : "Connectez-vous à votre tableau de bord."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-6 border border-border/30">
            {(["signup", "login"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setErrors({}); }}
                className={`flex-1 text-[13px] font-semibold py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === tab
                    ? "gradient-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "signup" ? "Créer un compte" : "Connexion"}
              </button>
            ))}
          </div>

          {/* Google */}
          <Button
            variant="outline"
            className="w-full h-[42px] gap-2.5 text-sm font-medium rounded-xl"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </Button>

          <div className="relative my-5">
            <Separator className="bg-border/30" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-[11px] text-muted-foreground/50 uppercase tracking-wider">
              ou
            </span>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {activeTab === "signup" ? (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleSignup}
                className="space-y-3.5"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="s-first" className="text-xs font-medium">Prénom</Label>
                    <Input id="s-first" placeholder="Jean" value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)} required className={inputClass(errors.firstName)} />
                    {errors.firstName && <p className="text-[11px] text-destructive">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="s-last" className="text-xs font-medium">Nom</Label>
                    <Input id="s-last" placeholder="Dupont" value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)} required className={inputClass(errors.lastName)} />
                    {errors.lastName && <p className="text-[11px] text-destructive">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-email" className="text-xs font-medium">E-mail</Label>
                  <Input id="s-email" type="email" placeholder="nom@exemple.com" value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)} required className={inputClass(errors.email)} />
                  {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-phone" className="text-xs font-medium">
                    Téléphone <span className="text-muted-foreground/50 font-normal">optionnel</span>
                  </Label>
                  <Input id="s-phone" type="tel" placeholder="06 12 34 56 78" value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)} className={inputClass()} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-pw" className="text-xs font-medium">Mot de passe</Label>
                  <PasswordField id="s-pw" value={signupPassword} onChange={setSignupPassword}
                    show={showSignupPassword} onToggle={() => setShowSignupPassword(!showSignupPassword)}
                    placeholder="Min. 6 caractères" error={errors.password} />
                  {errors.password && <p className="text-[11px] text-destructive">{errors.password}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="s-cpw" className="text-xs font-medium">Confirmer</Label>
                  <PasswordField id="s-cpw" value={signupConfirmPassword} onChange={setSignupConfirmPassword}
                    show={showSignupConfirm} onToggle={() => setShowSignupConfirm(!showSignupConfirm)}
                    placeholder="Confirmez le mot de passe" error={errors.confirmPassword} />
                  {errors.confirmPassword && <p className="text-[11px] text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button type="submit" variant="premium" className="w-full h-[42px] text-sm font-semibold mt-1 rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLogin}
                className="space-y-3.5"
              >
                <div className="space-y-1">
                  <Label htmlFor="l-email" className="text-xs font-medium">E-mail</Label>
                  <Input id="l-email" type="email" placeholder="nom@exemple.com" value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)} required className={inputClass()} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="l-pw" className="text-xs font-medium">Mot de passe</Label>
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                      onClick={async () => {
                        if (!loginEmail.trim()) {
                          toast.error("Entrez votre e-mail d'abord.");
                          return;
                        }
                        setLoading(true);
                        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        setLoading(false);
                        if (error) toast.error(error.message);
                        else toast.success("Un e-mail de réinitialisation a été envoyé.");
                      }}
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <PasswordField id="l-pw" value={loginPassword} onChange={setLoginPassword}
                    show={showLoginPassword} onToggle={() => setShowLoginPassword(!showLoginPassword)}
                    placeholder="Votre mot de passe" />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} className="h-3.5 w-3.5" />
                  <label htmlFor="remember" className="text-[11px] text-muted-foreground cursor-pointer select-none">Se souvenir de moi</label>
                </div>

                <Button type="submit" variant="premium" className="w-full h-[42px] text-sm font-semibold mt-1 rounded-xl" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground/40 text-center mt-6 leading-relaxed">
            En continuant, vous acceptez les{" "}
            <a href="/cgu" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">CGU</a>
            {" "}et la{" "}
            <a href="/confidentialite" className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Auth;
