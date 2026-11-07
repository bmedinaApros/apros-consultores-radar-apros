import { redirect } from "next/navigation";
import type { SessionUser } from "./session";
import type { ActorInfo } from "./companies/service";

export const toActor = (u: SessionUser): ActorInfo => ({ id: u.userId, email: u.email, role: u.role });

/** Ejecuta una acción de servidor y convierte los errores esperados en un mensaje visible. */
export async function guarded(back: string, fn: () => Promise<string | void>): Promise<never> {
  let target = back;
  try {
    const ok = await fn();
    target = `${back}${back.includes("?") ? "&" : "?"}ok=${encodeURIComponent(ok || "Cambios guardados.")}`;
  } catch (e) {
    const known = e instanceof Error && ["CompanyError", "ImportError", "SourceError", "ForbiddenError", "PossibleDuplicateError", "UserUpdateError", "CsvError", "ModelError", "RunInProgressError"].includes(e.name === "Error" ? e.constructor.name : e.name);
    if (!known) throw e;
    target = `${back}${back.includes("?") ? "&" : "?"}error=${encodeURIComponent((e as Error).message)}`;
  }
  redirect(target);
}
