import type { Permission } from "@/lib/auth/permissions";

export type PermissionOption = {
  value: Permission;
  label: string;
};

export type PermissionGroup = {
  label: string;
  options: PermissionOption[];
};

export const permissionGroups: PermissionGroup[] = [
  {
    label: "Agence",
    options: [
      { value: "agency:read", label: "Voir les informations de l’agence" },
      { value: "agency:update", label: "Modifier les paramètres de l’agence" },
    ],
  },
  {
    label: "Véhicules",
    options: [
      { value: "vehicles:read", label: "Voir les véhicules" },
      { value: "vehicles:create", label: "Ajouter des véhicules" },
      { value: "vehicles:update", label: "Modifier les véhicules" },
      { value: "vehicles:delete", label: "Archiver des véhicules" },
    ],
  },
  {
    label: "Réservations",
    options: [
      { value: "reservations:read", label: "Voir les réservations" },
      { value: "reservations:update", label: "Traiter les réservations" },
      { value: "reservations:export", label: "Exporter les réservations" },
    ],
  },
  {
    label: "Site et thème",
    options: [
      { value: "theme:read", label: "Voir la personnalisation" },
      { value: "theme:update", label: "Modifier le thème" },
      { value: "theme:publish", label: "Publier le site" },
    ],
  },
  {
    label: "Équipe",
    options: [
      { value: "members:read", label: "Voir les membres" },
      { value: "members:manage", label: "Gérer les membres et invitations" },
    ],
  },
];

export const permissionOptions = permissionGroups.flatMap(
  (group) => group.options,
);
