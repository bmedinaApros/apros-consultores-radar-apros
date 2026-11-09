"use client";

/** Marca o desmarca todas las casillas de empresa de la página. Sin JavaScript, cada casilla se marca a mano. */
export function SelectAll({ formId }: { formId: string }) {
  return (
    <button
      type="button" className="btn btn-secondary btn-small"
      onClick={(e) => {
        const boxes = Array.from(document.querySelectorAll<HTMLInputElement>(`#${formId} input[type=checkbox][name=ruc]:not(:disabled)`));
        const allOn = boxes.length > 0 && boxes.every((b) => b.checked);
        boxes.forEach((b) => { b.checked = !allOn; });
        e.currentTarget.textContent = allOn ? "Seleccionar la página" : "Quitar selección";
      }}
    >
      Seleccionar la página
    </button>
  );
}
