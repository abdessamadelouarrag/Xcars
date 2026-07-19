type LinkTemplateProps = {
  name?: string | null;
  actionUrl: string;
};

function shell(title: string, intro: string, actionLabel: string, actionUrl: string) {
  return `
    <div style="background:#f4f7f6;padding:40px 16px;font-family:Arial,sans-serif;color:#142321">
      <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #e2e8e6;border-radius:20px;padding:36px">
        <div style="font-weight:800;font-size:20px;color:#0f766e;margin-bottom:28px">XCars</div>
        <h1 style="font-size:26px;line-height:1.25;margin:0 0 16px">${title}</h1>
        <p style="line-height:1.7;color:#53635f;margin:0 0 28px">${intro}</p>
        <a href="${actionUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">${actionLabel}</a>
        <p style="font-size:12px;line-height:1.6;color:#84918e;margin:28px 0 0">Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>
      </div>
    </div>
  `;
}

export function verificationEmail({ name, actionUrl }: LinkTemplateProps) {
  return shell(
    "Confirmez votre adresse e-mail",
    `Bonjour ${name ?? ""}, activez votre compte pour terminer la création de votre agence.`,
    "Vérifier mon adresse",
    actionUrl,
  );
}

export function resetPasswordEmail({ name, actionUrl }: LinkTemplateProps) {
  return shell(
    "Réinitialisez votre mot de passe",
    `Bonjour ${name ?? ""}, ce lien sécurisé est valable pendant 30 minutes.`,
    "Choisir un nouveau mot de passe",
    actionUrl,
  );
}

export function invitationEmail({
  agencyName,
  invitedBy,
  actionUrl,
}: {
  agencyName: string;
  invitedBy: string;
  actionUrl: string;
}) {
  return shell(
    `Rejoignez ${agencyName}`,
    `${invitedBy} vous invite à gérer les véhicules et les réservations de l’agence.`,
    "Accepter l’invitation",
    actionUrl,
  );
}

export function emailTransportTest({
  name,
  actionUrl,
}: LinkTemplateProps) {
  return shell(
    "Votre service e-mail fonctionne",
    `Bonjour ${name ?? ""}, XCars peut maintenant envoyer les vérifications, invitations et notifications pour toutes les agences.`,
    "Ouvrir XCars",
    actionUrl,
  );
}

export function reservationEmail(
  title: string,
  message: string,
  actionUrl: string,
) {
  return shell(title, message, "Voir la réservation", actionUrl);
}
