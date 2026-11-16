export interface EdgeLinkProps {
  id: string;
  domain: string;
  key: string;
  url: string;
  shortLink: string;
  proxy: boolean;
  title: string;
  description: string;
  image: string;
  video: string;
  rewrite: boolean;
  password: string | null;
  expiresAt: Date | null;
  disabledAt: Date | null;
  doIndex: boolean;
  ios: string | null;
  android: string | null;
  geo: unknown;
  testVariants: unknown;
  testCompletedAt: Date | null;
  projectId: string | null;
  publicStats: boolean;
  expiredUrl: string | null;
  createdAt: Date;
  trackConversion: boolean;
}

export interface EdgeDomainProps {
  id: string;
  slug: string;
  logo: string | null;
  verified: boolean;
  placeholder: string | null;
  expiredUrl: string | null;
  notFoundUrl: string | null;
  primary: boolean;
  archived: boolean;
  projectId: string | null;
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}
