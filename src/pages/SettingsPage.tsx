import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Configuration de votre atelier</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation</CardTitle>
          <CardDescription>Informations de votre atelier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom de l'atelier</Label>
              <Input placeholder="Mon atelier" defaultValue="Bonoitec Repair Lyon" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input placeholder="04 XX XX XX XX" defaultValue="04 72 00 00 00" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="contact@atelier.fr" defaultValue="contact@bonoitec.fr" />
            </div>
            <div className="space-y-2">
              <Label>SIRET</Label>
              <Input placeholder="XXX XXX XXX XXXXX" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Adresse</Label>
            <Input placeholder="Adresse complète" defaultValue="15 Rue de la République, 69002 Lyon" />
          </div>
          <Button>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facturation</CardTitle>
          <CardDescription>Configuration de la TVA et facturation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taux de TVA (%)</Label>
              <Input type="number" defaultValue="20" />
            </div>
            <div className="space-y-2">
              <Label>Préfixe facture</Label>
              <Input defaultValue="FAC-" />
            </div>
          </div>
          <Button>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisateurs</CardTitle>
          <CardDescription>Gérez les accès à votre atelier</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La gestion des utilisateurs sera disponible après la connexion à Lovable Cloud.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
