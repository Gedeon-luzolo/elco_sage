// Profils d'accès : la direction (ADMIN, DIRECTOR) gère, la caisse vend.
export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTOR = 'DIRECTOR',
  CASHIER = 'CASHIER',
  OPERATOR = 'OPERATOR',
}

// Un compte bloqué l'est après trop d'échecs de connexion.
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}
