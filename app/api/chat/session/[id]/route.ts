import { getAuthUser } from "@/lib/db/auth-server";
import { revokeSession } from "@/lib/bridge/session";
import { unauthorized, internalError, ok } from "@/lib/api/http";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await revokeSession(id, user.id);
    return ok({ revoked: true });
  } catch (err) {
    return internalError(err);
  }
}
