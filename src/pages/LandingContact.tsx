import { forwardRef, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Mail, Phone, Send, Paperclip, X, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères").max(50),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  phone: z.string().trim().min(6, "Numéro de téléphone invalide").max(20),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
});

type ContactForm = z.infer<typeof contactSchema>;

const LandingContact = forwardRef<HTMLDivElement>((_, ref) => {
  const [form, setForm] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    setAttachment(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ContactForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="landing-container py-20 md:py-32"
        >
          <div className="max-w-lg mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-display">Message envoyé !</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Merci pour votre message. Notre équipe vous répondra sous 24h ouvrées.
            </p>
            <Button asChild className="rounded-full px-8 font-bold shadow-md">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="landing-container py-16 md:py-24"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
              Contact
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display mb-4">
              Contactez-nous
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
              Une question, une demande de démo ou besoin d'aide ? Notre équipe est à votre écoute et vous répond rapidement.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Sidebar info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="landing-card p-6 space-y-5">
                <h3 className="font-semibold font-display text-sm">Nos coordonnées</h3>
                <a
                  href="mailto:contact@bonoitecpilot.fr"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">contact@bonoitecpilot.fr</span>
                </a>
                <a
                  href="tel:0465969585"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">04 65 96 95 85</span>
                </a>
              </div>

              <div className="landing-card p-6 space-y-3">
                <h3 className="font-semibold font-display text-sm">Horaires</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Du lundi au vendredi<br />
                  9h00 – 18h00
                </p>
                <p className="text-xs text-muted-foreground">
                  Réponse sous 24h ouvrées maximum.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="landing-card p-6 sm:p-8 space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">Prénom *</Label>
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      className={`h-11 ${errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Nom *</Label>
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      className={`h-11 ${errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Adresse e-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean@exemple.fr"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className={`h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">Téléphone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className={`h-11 ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Décrivez votre demande..."
                    rows={5}
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    className={`resize-none ${errors.message ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {errors.message && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.message}
                    </p>
                  )}
                </div>

                {/* File attachment */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pièce jointe (optionnel)</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {attachment ? (
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
                      <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(attachment.size / 1024).toFixed(0)} Ko
                      </span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50 px-4 py-3 w-full transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <Paperclip className="h-4 w-4" />
                      Ajouter une image ou un PDF (max 10 Mo)
                    </button>
                  )}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full h-13 text-base font-bold shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer le message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

LandingContact.displayName = "LandingContact";

export default LandingContact;
