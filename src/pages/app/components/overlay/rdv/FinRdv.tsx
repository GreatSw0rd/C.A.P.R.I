import { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, Loader2 } from "lucide-react";
import { ouvrirTableauDeBord, type CompteRendu } from "@/lib";

// Fin du rendez-vous : resume, prochaines etapes et e-mail de relance pret a copier.
export const FinRdv = ({
  enCours,
  id,
  compteRendu,
  onFermer,
}: {
  enCours: boolean;
  id?: string;
  compteRendu?: CompteRendu | null;
  onFermer: () => void;
}) => {
  const [copie, setCopie] = useState(false);

  if (enCours) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <Loader2 className="h-5 w-5 animate-spin ov-muted" />
        <p className="text-sm">Rédaction du compte-rendu…</p>
        <p className="text-xs ov-muted">Besoins, qualification, prochaines étapes et e-mail de relance.</p>
      </div>
    );
  }
  if (!compteRendu) return null;

  const copierEmail = async () => {
    const texte = `Objet : ${compteRendu.email.objet}\n\n${compteRendu.email.corps}`;
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  return (
    <div className="space-y-3 p-3">
      <div className="ov-input p-3 space-y-2">
        <p className="text-[10px] font-semibold tracking-wider ov-muted">COMPTE-RENDU</p>
        <p className="text-sm leading-snug">{compteRendu.resume}</p>
        {compteRendu.prochaines_etapes.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold tracking-wider ov-muted mt-2">PROCHAINES ÉTAPES</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {compteRendu.prochaines_etapes.map((e) => (
                <li key={e}>› {e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {compteRendu.email.corps && (
          <button type="button" className="ov-pill" onClick={copierEmail}>
            {copie ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
            {copie ? "E-mail copié" : "Copier l'e-mail de relance"}
          </button>
        )}
        {id && (
          <button
            type="button"
            className="ov-pill"
            onClick={() => ouvrirTableauDeBord(`/rendez-vous/${id}`)}
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Compte-rendu complet
          </button>
        )}
        <div className="flex-1" />
        <button type="button" className="ov-pill" onClick={onFermer}>
          Nouveau rendez-vous
        </button>
      </div>
    </div>
  );
};
