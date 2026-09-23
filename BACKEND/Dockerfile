FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --omit=dev

# Copiar código fuente
COPY . .

# Crear directorio para subida de archivos
RUN mkdir -p uploads/contracts

# Puerto de la aplicación
EXPOSE 4000

# Iniciar backend
CMD ["node", "src/app.js"]
