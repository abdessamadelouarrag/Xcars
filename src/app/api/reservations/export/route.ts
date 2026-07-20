import { requireTenantPermission } from "@/lib/auth/tenant";
import { db } from "@/lib/db";

function csvCell(value: unknown) {
  const stringValue =
    value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export async function GET() {
  const tenant = await requireTenantPermission("reservations:export");
  const rows = await db.reservation.findMany({
    where: { agencyId: tenant.agency.id },
    include: { vehicle: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
  const header = [
    "Référence",
    "Statut",
    "Client",
    "E-mail",
    "Téléphone",
    "Véhicule",
    "Début",
    "Fin",
    "Départ",
    "Retour",
    "Montant",
    "Devise",
  ];
  const lines = rows.map((row) =>
    [
      row.reference,
      row.status,
      row.customer.name,
      row.customer.email,
      row.customer.phone,
      `${row.vehicle.brand} ${row.vehicle.model}`,
      row.startsAt,
      row.endsAt,
      row.pickupLocation,
      row.returnLocation,
      row.totalAmount,
      row.currency,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = `\uFEFF${header.map(csvCell).join(",")}\r\n${lines.join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
