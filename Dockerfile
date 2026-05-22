# ==========================================
# Etapa 1: Build y compilación del Frontend
# ==========================================
FROM node:20-alpine AS build

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias del proyecto usando npm ci para mayor consistencia
RUN npm ci

# Copiar el código fuente y las configuraciones
COPY . .

# Ejecutar compilación de producción (genera los archivos en /app/dist)
RUN npm run build

# ==========================================
# Etapa 2: Imagen final de producción (Nginx)
# ==========================================
FROM nginx:1.25-alpine

# Eliminar configuración por defecto de Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copiar los artefactos de la compilación de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar la plantilla de configuración de Nginx
# La imagen oficial de Nginx procesará esta plantilla con envsubst automáticamente al iniciar
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Variables de entorno por defecto (pueden ser sobrescritas al lanzar el contenedor)
ENV API_URL=http://gateway-service:9000
ENV WS_URL=http://gateway-service:9000

# Exponer el puerto estándar HTTP
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
