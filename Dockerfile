FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["sh", "-c", "node -e \"const ds=require('./dist/data-source.js'); ds.initializeDatabase().then(()=>process.exit(0)).catch((err)=>{console.error(err);process.exit(1);})\" && DATABASE_SKIP_INIT_SCRIPTS=true node dist/main.js"]
