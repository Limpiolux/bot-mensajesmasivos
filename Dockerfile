FROM node:18-bullseye as bot
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY node_modules/@bot-whatsapp/portal/lib/portal.http.cjs ./node_modules/@bot-whatsapp/portal/lib/
COPY node_modules/@bot-whatsapp/provider/lib/baileys/index.cjs ./node_modules/@bot-whatsapp/provider/lib/baileys/
COPY node_modules/@bot-whatsapp/provider/lib/baileys/certificate.crt ./node_modules/@bot-whatsapp/provider/lib/baileys/
COPY node_modules/@bot-whatsapp/provider/lib/baileys/private.key ./node_modules/@bot-whatsapp/provider/lib/baileys/
COPY . .
ARG RAILWAY_STATIC_URL
ARG PUBLIC_URL
ARG PORT
EXPOSE 7131
EXPOSE 7132
EXPOSE 7135
CMD ["npm", "start"]
