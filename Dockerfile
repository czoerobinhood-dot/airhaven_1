FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=7860
ENV HOST=0.0.0.0

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . ./

EXPOSE 7860

CMD ["npm", "start"]
