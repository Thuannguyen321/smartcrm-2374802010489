# Smart CRM - luong L2 (track SE). Mot image chua ca API Node.js va giao dien React da build.
# Dung boi docker-compose.yml: `docker compose up -d --build`.

# ---------- Giai doan 1: build giao dien React (Vite) ----------
FROM node:20-alpine AS client-build
WORKDIR /build/client
# Tep khoa truoc -> chi cai lai thu vien khi package-lock.json doi (tan dung cache)
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ---------- Giai doan 2: API Node.js ----------
FROM node:20-alpine
ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false
WORKDIR /app

# Cai ca devDependencies (jest, supertest): giang vien chay `docker compose exec app npm test` trong container
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund && npm cache clean --force

COPY src ./src
COPY scripts ./scripts
COPY database ./database
COPY tests ./tests
# .env.example duoc TC-10 doc de thu ky token bang JWT_SECRET mau (chi chua gia tri MAU, khong co secret)
COPY .env.example ./
COPY --from=client-build /build/client/dist ./client/dist

# Khong chay bang root
RUN chown -R node:node /app
USER node

EXPOSE 3000
# Khoi dong: tao bang (migrate) -> nap du lieu mau (seed) -> chay API.
# Ca hai buoc deu chay lai nhieu lan khong loi, khong nhan doi du lieu (C8).
CMD ["sh", "-c", "node scripts/migrate.js && node scripts/seed.js && exec node src/server.js"]
