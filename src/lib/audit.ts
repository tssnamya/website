import { db } from "@/lib/db"

/**
 * Append an entry to the audit trail. Never throws — audit logging must not be
 * able to break the action it is recording.
 */
export async function logAudit(params: {
  actorEmail: string
  action: string
  entity: "PRODUCT" | "ORDER" | "SETTINGS"
  entityId?: string | null
  summary: string
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorEmail: params.actorEmail,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        summary: params.summary,
      },
    })
  } catch {
    // swallow — auditing is best-effort
  }
}
