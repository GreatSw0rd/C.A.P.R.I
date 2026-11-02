import { useState } from "react";
import { Header, Card, Input, Button, Switch, Label } from "@/components";
import { useFurtif } from "@/hooks";
import { getPlatform } from "@/lib";
import { EyeOff, Lock, ShieldAlert } from "lucide-react";

const LONGUEUR_MIN = 8;

/**
 * Mode furtif (pedagogique). Exclut les fenetres des captures/partages d'ecran via un appel
 * systeme expose par Tauri (content_protected). Verrouille par mot de passe, desactive a chaque
 * demarrage. A retirer avant toute publication reelle.
 */
export const ModeFurtif = ({ className }: { className?: string }) => {
  const { statut, chargement, definirMotDePasse, deverrouiller, verrouiller, activer } =
    useFurtif();
  const platform = getPlatform();

  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const reinit = () => {
    setMotDePasse("");
    setConfirmation("");
    setErreur(null);
  };

  const handleDefinir = async () => {
    setErreur(null);
    if (motDePasse.length < LONGUEUR_MIN) {
      setErreur(`Le mot de passe doit compter au moins ${LONGUEUR_MIN} caracteres.`);
      return;
    }
    if (motDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setOccupe(true);
    try {
      await definirMotDePasse(motDePasse);
      reinit();
    } catch (e) {
      setErreur(String(e));
    } finally {
      setOccupe(false);
    }
  };

  const handleDeverrouiller = async () => {
    setErreur(null);
    setOccupe(true);
    try {
      const ok = await deverrouiller(motDePasse);
      if (!ok) {
        setErreur("Mot de passe incorrect.");
      } else {
        reinit();
      }
    } catch (e) {
      setErreur(String(e));
    } finally {
      setOccupe(false);
    }
  };

  const handleVerrouiller = async () => {
    setOccupe(true);
    try {
      await verrouiller();
      reinit();
    } catch (e) {
      setErreur(String(e));
    } finally {
      setOccupe(false);
    }
  };

  const handleToggle = async (actif: boolean) => {
    setErreur(null);
    setOccupe(true);
    try {
      await activer(actif);
    } catch (e) {
      setErreur(String(e));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div id="mode-furtif" className={`space-y-2 ${className}`}>
      <Header
        title="Mode furtif (verrouille)"
        description="Exclut les fenetres des captures et partages d'ecran. Fonction pedagogique, protegee par un mot de passe et desactivee a chaque demarrage."
        isMainTitle
      />

      <Card className="p-4 space-y-3 shadow-none border border-border/70 rounded-xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="size-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Cette fonction sert uniquement a comprendre comment un tel mecanisme est construit.
            Elle n'offre aucune garantie : une camera ou un logiciel de surveillance d'examen voit
            toujours l'ecran. Sur Linux, elle n'a aucun effet.
            {platform === "linux" && " (Vous etes sur Linux : la protection ne fera rien.)"}
          </p>
        </div>

        {chargement ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : !statut.configure ? (
          // Premiere utilisation : definir un mot de passe.
          <div className="space-y-2">
            <Label className="text-sm font-medium">Definir un mot de passe</Label>
            <Input
              type="password"
              placeholder={`Au moins ${LONGUEUR_MIN} caracteres`}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              disabled={occupe}
            />
            <Input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={occupe}
            />
            <Button onClick={handleDefinir} disabled={occupe} size="sm">
              <Lock className="size-4" /> Enregistrer le mot de passe
            </Button>
          </div>
        ) : !statut.deverrouille ? (
          // Mot de passe defini mais verrouille : demander le mot de passe.
          <div className="space-y-2">
            <Label className="text-sm font-medium">Deverrouiller le mode furtif</Label>
            <Input
              type="password"
              placeholder="Mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDeverrouiller()}
              disabled={occupe}
            />
            <Button onClick={handleDeverrouiller} disabled={occupe} size="sm">
              <Lock className="size-4" /> Deverrouiller
            </Button>
          </div>
        ) : (
          // Deverrouille : activer/desactiver la protection et reverrouiller.
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Protection d'ecran active</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Les fenetres de C.A.P.R.I disparaissent des captures et partages d'ecran.
                </p>
              </div>
              <Switch
                checked={statut.actif}
                onCheckedChange={handleToggle}
                disabled={occupe}
                aria-label="Activer la protection d'ecran"
              />
            </div>
            <Button onClick={handleVerrouiller} disabled={occupe} size="sm" variant="outline">
              <EyeOff className="size-4" /> Reverrouiller le mode furtif
            </Button>
          </div>
        )}

        {erreur && <p className="text-xs text-destructive">{erreur}</p>}
      </Card>

      {statut.actif && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
          <EyeOff className="size-4 text-amber-500" />
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Mode furtif actif : les fenetres sont exclues des captures d'ecran.
          </p>
        </div>
      )}
    </div>
  );
};
