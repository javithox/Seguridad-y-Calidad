FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el código fuente
COPY . .

# Crear directorio para subida de archivos
RUN mkdir -p uploads/contracts

# Exponer el puerto interno de la app
EXPOSE 4444

# Comando obligatorio para iniciar el servidor
CMD ["npm", "start"]

