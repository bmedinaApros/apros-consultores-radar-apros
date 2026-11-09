import { pool } from "./db";

/** Guarda si el menú lateral está colapsado, por usuario. Solo escribe esa clave y nunca toca otras. */
export async function saveNavCollapsed(userId: string, collapsed: boolean): Promise<void> {
  await pool().query(`UPDATE users SET ui_prefs = ui_prefs || jsonb_build_object('navCollapsed', $2::boolean) WHERE id = $1`, [userId, collapsed]);
}
