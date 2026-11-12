# Imagen del frontend Angular de ÁmbarLy, en dos etapas:
# 1) compila la app con Node; 2) sirve los archivos estáticos con nginx.
# Se construye desde el docker-compose.yml de Backend-Flask (servicio "web"), o sola:
#   docker build -t ambarly-web .   y   docker run -p 4200:80 ambarly-web

# --- Etapa 1: build de producción ---
FROM node:24-alpine AS build
WORKDIR /app

# Primero las dependencias, para reutilizar la capa si package-lock.json no cambia.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: servidor web ---
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/BV-angular/browser /usr/share/nginx/html

EXPOSE 80
