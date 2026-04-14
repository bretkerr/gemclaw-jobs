FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/server.js"]
