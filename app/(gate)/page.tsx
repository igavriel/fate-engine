import Link from "next/link";
import { TitleSigil } from "@/src/ui/components/TitleSigil";
import { actionLabels } from "@/src/ui/theme/copy";
import { buttonPrimary, buttonGhost } from "@/src/ui/theme/classnames";
import { routes } from "@/src/ui/nav/routes";

export default function WelcomePage() {
  return (
    <div className="w-full max-w-sm text-center" data-testid="welcome">
      <TitleSigil title="FATE ENGINE" />
      <p className="mt-4 text-zinc-400">Descend into the unknown.</p>
      <div className="mt-10 flex flex-col gap-4">
        <Link
          href={routes.vessels()}
          className={`block text-center ${buttonPrimary()}`}
          data-testid="btn-resume-descent"
        >
          {actionLabels.resumeDescent}
        </Link>
        <Link
          href={routes.seal()}
          className={`block text-center ${buttonGhost()}`}
          data-testid="btn-enter-seal"
        >
          {actionLabels.enterSeal}
        </Link>
      </div>
    </div>
  );
}
