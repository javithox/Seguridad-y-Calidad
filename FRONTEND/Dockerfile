# Etapa 1: Construcción
FROM node:20 AS builder

WORKDIR /app

ARG VITE_API_URL=http://100.53.45.218:4444
ENV VITE_API_URL=${VITE_API_URL}

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias respetando package-lock.json
RUN npm install

# Copiar código fuente
COPY . .

# Construir aplicación
RUN npm run build


# Etapa 2: Producción
FROM nginx:alpine

# Copiar aplicación compilada
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
