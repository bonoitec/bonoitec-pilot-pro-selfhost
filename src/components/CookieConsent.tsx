import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type CookiePrefs = { essential: boolean; analytics: boolean; marketing: boolean };

const defaultPrefs: CookiePrefs = { essential: true, analytics: false, marketing: false };

function getStoredConsent(): CookiePrefs | null {
  try {
    const v = localStorage.getItem("cookie-consent");
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(defaultPrefs);

  useEffect(() => {
    if (!getStoredConsent()) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const save = (p: CookiePrefs) => {
    localStorage.setItem("cookie-consent", JSON.stringify(p));
    setVisible(false);
  };

  const acceptAll = () => save({ essential: true, analytics: true, marketing: true });
  const refuseAll = () => save({ essential: true, analytics: false, marketing: false });
  const saveCustom = () => save(prefs);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
        >
          <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/10 backdrop-blur-sm overflow-hidden">
            {!showCustomize ? (
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Cookie className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold font-display text-sm">Nous utilisons des cookies</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Ce site utilise des cookies pour améliorer votre expérience de navigation, analyser le trafic et personnaliser le contenu.
                        Consultez notre <a href="/confidentialite" className="text-primary hover:underline font-medium">politique de confidentialité</a>.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={acceptAll} className="text-xs h-8 px-4">
                        Accepter tout
                      </Button>
                      <Button size="sm" variant="outline" onClick={refuseAll} className="text-xs h-8 px-4">
                        Refuser tout
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowCustomize(true)} className="text-xs h-8 px-4">
                        Personnaliser
                      </Button>
                    </div>
                  </div>
                  <button onClick={refuseAll} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold font-display text-sm">Personnaliser les cookies</h3>
                  <button onClick={() => setShowCustomize(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <Label className="text-xs font-medium">Cookies essentiels</Label>
                      <p className="text-[11px] text-muted-foreground">Nécessaires au fonctionnement du site</p>
                    </div>
                    <Switch checked disabled />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <Label className="text-xs font-medium">Cookies analytiques</Label>
                      <p className="text-[11px] text-muted-foreground">Nous aident à comprendre l'utilisation du site</p>
                    </div>
                    <Switch checked={prefs.analytics} onCheckedChange={(v) => setPrefs({ ...prefs, analytics: v })} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <Label className="text-xs font-medium">Cookies marketing</Label>
                      <p className="text-[11px] text-muted-foreground">Personnalisent les publicités</p>
                    </div>
                    <Switch checked={prefs.marketing} onCheckedChange={(v) => setPrefs({ ...prefs, marketing: v })} />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={saveCustom} className="text-xs h-8 px-4 flex-1">
                    Enregistrer mes préférences
                  </Button>
                  <Button size="sm" variant="outline" onClick={acceptAll} className="text-xs h-8 px-4">
                    Tout accepter
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
