export type ExternalJwtConfig = {
  secret: string;
  issuer: string;
  audience: string;
};

export type ExternalJwtPayload = {
  sub?: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
};

export type StoredIntegrationToken = {
  expiresAt: number;
};

export type IssuedIntegrationToken = {
  integrationToken: string;
  expiresAt: string;
};
