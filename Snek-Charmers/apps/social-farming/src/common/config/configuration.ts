export default () => ({
  port: parseInt(process.env.PORT ?? "4000", 10),
  networkId: parseInt(process.env.NETWORK_ID ?? "0", 10),
  webhookSecret: process.env.LAUNCHPAD_WEBHOOK_SECRET ?? "dev-shared-secret-change-me",
  jwt: {
    secret: process.env.JWT_SECRET ?? "dev-jwt-secret-change-me",
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
});
