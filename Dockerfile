# ==========================================
# STAGE 1: Build 
# ==========================================
FROM node:22-alpine AS build-stage
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build --configuration=production

# ==========================================
# STAGE 2: Production 
# ==========================================
FROM nginx:stable-alpine


COPY --from=build-stage /app/dist/intern-hub-news-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]