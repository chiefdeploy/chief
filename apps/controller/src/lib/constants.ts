if (!process.env.APP_DOMAIN) {
  throw new Error("APP_DOMAIN must be set");
}

export const APP_DOMAIN = process.env.APP_DOMAIN;
