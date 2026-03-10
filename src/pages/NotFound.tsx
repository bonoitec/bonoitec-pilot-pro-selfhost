import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold font-display text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="default" className="rounded-full px-6">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Retour à l'accueil</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link to="/support">Centre d'aide</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
