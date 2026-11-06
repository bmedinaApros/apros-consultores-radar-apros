import { AppShell } from "@/components/app-shell";
import { Flash } from "@/components/flash";
import { requirePermissionPage } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePermissionPage("companies.import");
  const q = await searchParams;
  return (
    <AppShell user={user} current="/companies/import">
      <h1>Importar empresas desde CSV</h1>
      <Flash ok={q.ok} error={q.error} />
      <form method="post" action="/api/companies/import" encType="multipart/form-data" className="card stack">
        <div>
          <label htmlFor="file">Archivo CSV (UTF-8, hasta 5 MB y 5000 filas)</label>
          <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        </div>
        <button className="btn btn-primary" type="submit">Ver vista previa</button>
        <p className="muted">No se crea nada hasta que confirmes la vista previa.</p>
      </form>
      <section className="card" aria-labelledby="cols">
        <h2 id="cols">Columnas reconocidas</h2>
        <p>Obligatoria: <code>razon_social</code>. Opcionales: <code>nombre_comercial</code>, <code>sitio_web</code>, <code>ruc</code>, <code>rubro</code>, <code>subrubro</code>, <code>ciudad</code>, <code>responsable</code> (correo de un usuario).</p>
        <ul>
          <li>Si el rubro falta o no coincide con uno existente, la empresa queda <strong>por clasificar</strong> para revisión humana.</li>
          <li>Las empresas de la lista de no contactar y los clientes activos no se importan.</li>
          <li>Se detectan duplicados por RUC, sitio web y nombre. Los parecidos los resuelves tú.</li>
          <li>Se rechazan sitios de redes sociales y correos gratuitos como sitio web.</li>
        </ul>
      </section>
    </AppShell>
  );
}
