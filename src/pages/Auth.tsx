import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Zap,
  Mail,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  Wrench,
  Package,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import heroDashboard from "@/assets/hero-dashboard.png";

const features = [
  { icon: FileText, text: "Devis et factures en quelques clics" },
  { icon: Wrench, text: "Suivi des réparations en temps réel" },
  { icon: Package, text: "Gestion de stock intégrée" },
  { icon: BookOpen, text: "Catalogue préconfiguré inclus" },
];

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    if (!signupFirstName.trim()) newErrors.firstName = "Le prénom est requis";
    if (!signupLastName.trim()) newErrors.lastName = "Le nom est requis";
    if (!signupEmail.trim()) newErrors.email = "L'adresse e-mail est requise";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail))
      newErrors.email = "Adresse e-mail invalide";
    if (signupPassword.length < 6)
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    if (signupPassword !== signupConfirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      toast.error("Identifiants incorrects. Veuillez réessayer.");
    } else {
      navigate("/dashboard");
    }
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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        "Un e-mail de confirmation vous a été envoyé. Vérifiez votre boîte de réception."
      );
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast.error("Erreur lors de la connexion avec Google");
    }
  };

  const PasswordInput = ({
    id,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
    error,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
    error?: string;
  }) => (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className={`pr-10 h-11 bg-background border-border/60 focus:border-primary/50 transition-colors ${error ? "border-destructive" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* LEFT COLUMN — Marketing */}
        <div className="hidden lg:flex flex-col justify-center relative overflow-hidden bg-gradient-to-br from-accent/50 via-background to-primary/5 px-12 xl:px-20">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/3 -translate-x-1/4" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[100px] translate-y-1/3 translate-x-1/4" />

          <div className="relative z-10 max-w-lg space-y-8">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground font-display">
                BonoitecPilot
              </span>
            </Link>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Essai gratuit 30 jours
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight text-foreground tracking-tight">
                Pilotez votre atelier de réparation avec une plateforme{" "}
                <span className="text-primary">pensée pour le terrain</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Centralisez vos devis, vos réparations, vos clients, votre stock
                et votre facturation dans une seule interface simple, rapide et
                efficace.
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-3">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Mockup */}
            <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm shadow-lg overflow-hidden">
              <img
                src={heroDashboard}
                alt="Interface BonoitecPilot"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {["Accès complet", "Sans carte bancaire", "Mise en route rapide"].map(
                (badge) => (
                  <span key={badge} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {badge}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Auth card */}
        <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-2 mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                BonoitecPilot
              </span>
            </Link>
            <p className="text-sm text-muted-foreground text-center mt-1">
              La gestion de votre atelier, enfin simplifiée
            </p>
          </div>

          <Card className="w-full max-w-md border-border/50 shadow-xl bg-card">
            <CardContent className="p-6 sm:p-8">
              {/* Tabs */}
              <div className="flex rounded-lg bg-muted p-1 mb-6">
                {(["signup", "login"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setErrors({});
                    }}
                    className={`flex-1 text-sm font-semibold py-2.5 rounded-md transition-all duration-200 ${
                      activeTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "signup" ? "Créer un compte" : "Connexion"}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <Button
                variant="outline"
                className="w-full h-11 gap-2.5 border-border/60 hover:bg-accent/50 font-medium transition-all duration-200"
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    ou
                  </span>
                </div>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {activeTab === "signup" ? (
                  <motion.form
                    key="signup"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-first" className="text-xs font-medium text-foreground">
                          Prénom
                        </Label>
                        <Input
                          id="signup-first"
                          placeholder="Entrez votre prénom"
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          required
                          className={`h-11 bg-background border-border/60 focus:border-primary/50 transition-colors ${errors.firstName ? "border-destructive" : ""}`}
                        />
                        {errors.firstName && (
                          <p className="text-xs text-destructive">{errors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-last" className="text-xs font-medium text-foreground">
                          Nom
                        </Label>
                        <Input
                          id="signup-last"
                          placeholder="Entrez votre nom"
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          required
                          className={`h-11 bg-background border-border/60 focus:border-primary/50 transition-colors ${errors.lastName ? "border-destructive" : ""}`}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-destructive">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-email" className="text-xs font-medium text-foreground">
                        Adresse e-mail
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="nom@exemple.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        className={`h-11 bg-background border-border/60 focus:border-primary/50 transition-colors ${errors.email ? "border-destructive" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-phone" className="text-xs font-medium text-foreground">
                        Numéro de mobile{" "}
                        <span className="text-muted-foreground font-normal">(optionnel)</span>
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        className="h-11 bg-background border-border/60 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-medium text-foreground">
                        Mot de passe
                      </Label>
                      <PasswordInput
                        id="signup-password"
                        value={signupPassword}
                        onChange={setSignupPassword}
                        show={showSignupPassword}
                        onToggle={() => setShowSignupPassword(!showSignupPassword)}
                        placeholder="Créez un mot de passe sécurisé"
                        error={errors.password}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-confirm" className="text-xs font-medium text-foreground">
                        Confirmer le mot de passe
                      </Label>
                      <PasswordInput
                        id="signup-confirm"
                        value={signupConfirmPassword}
                        onChange={setSignupConfirmPassword}
                        show={showSignupConfirm}
                        onToggle={() => setShowSignupConfirm(!showSignupConfirm)}
                        placeholder="Confirmez votre mot de passe"
                        error={errors.confirmPassword}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Créer mon compte
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-xs font-medium text-foreground">
                        Adresse e-mail
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="nom@exemple.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="h-11 bg-background border-border/60 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-medium text-foreground">
                          Mot de passe
                        </Label>
                        <button
                          type="button"
                          className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          Mot de passe oublié ?
                        </button>
                      </div>
                      <PasswordInput
                        id="login-password"
                        value={loginPassword}
                        onChange={setLoginPassword}
                        show={showLoginPassword}
                        onToggle={() => setShowLoginPassword(!showLoginPassword)}
                        placeholder="Entrez votre mot de passe"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(v) => setRememberMe(v === true)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-xs text-muted-foreground cursor-pointer select-none"
                      >
                        Se souvenir de moi
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Se connecter
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Legal */}
              <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
                En continuant, j'accepte les{" "}
                <a href="/cgu" className="text-primary hover:underline font-medium">
                  Conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="/confidentialite" className="text-primary hover:underline font-medium">
                  Politique de confidentialité
                </a>
                .
              </p>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-muted-foreground">
                <Shield className="h-3 w-3" />
                Données chiffrées et sécurisées
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
