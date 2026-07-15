FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup -S nodejs && adduser -S elyto -G nodejs

COPY --from=builder --chown=elyto:nodejs /app/package.json ./package.json
COPY --from=builder --chown=elyto:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=elyto:nodejs /app/.next ./.next
COPY --from=builder --chown=elyto:nodejs /app/public ./public
COPY --from=builder --chown=elyto:nodejs /app/prisma ./prisma
COPY --from=builder --chown=elyto:nodejs /app/workers ./workers
COPY --from=builder --chown=elyto:nodejs /app/lib ./lib
COPY --from=builder --chown=elyto:nodejs /app/emails ./emails
COPY --from=builder --chown=elyto:nodejs /app/tsconfig.json ./tsconfig.json

USER elyto
EXPOSE 3000 3001 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["npm", "start"]
