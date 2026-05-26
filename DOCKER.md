# VoicePay Frontend — Dockerización & Nginx Guide

Este documento detalla la arquitectura de contenedorización del frontend de React (Vite + TypeScript) utilizando Nginx como servidor web de grado de producción optimizado para entornos Cloud.

---

## 🛠️ Arquitectura Multi-stage Docker

El proceso de Dockerización se divide en dos fases bien diferenciadas (Multi-stage Build) para minimizar drásticamente el tamaño final de la imagen y garantizar que no se exponga código fuente sensible ni dependencias de desarrollo (`devDependencies`).

```mermaid
graph TD
    subgraph Stage 1: Build (node:20-alpine)
        A[package.json] --> B[npm ci]
        C[Código Fuente React] --> D[npm run build]
        B --> D
        D --> E[Directorio /dist]
    end
    subgraph Stage 2: Production (nginx:1.25-alpine)
        E --> F[Copiar /dist a /usr/share/nginx/html]
        G[nginx/default.conf.template] --> H[Copiar a /etc/nginx/templates]
        H --> I[envsubst procesa variables]
        I --> J[Nginx Servidor Web en Puerto 80]
    end
```

### 1. Etapa 1: Compilación (`build`)

- **Imagen Base:** `node:20-alpine` (Ligera, moderna y segura).
- **Proceso:** Instala las dependencias mediante `npm ci` (garantizando consistencia exacta con el `package-lock.json`) y ejecuta la compilación optimizada de Vite (`npm run build`).

### 2. Etapa 2: Servidor de Producción (`production`)

- **Imagen Base:** `nginx:1.25-alpine` (Minimalista y de alto rendimiento).
- **Proceso:** Copia solo los archivos estáticos generados en `dist` al directorio de Nginx y configura un servidor proxy inverso.

---

## ⚙️ Configuración Dinámica de Variables de Entorno

En una aplicación SPA tradicional compilada, cambiar de backend requiere volver a compilar el proyecto porque el código se inyecta en tiempo de compilación. Para resolver esto y lograr que la imagen de Docker sea **desplegable en cualquier entorno cloud sin recompilar**, implementamos proxies dinámicos en Nginx a nivel de ejecución.

La imagen oficial de Nginx soporta plantillas en `/etc/nginx/templates/*.template`. En el arranque del contenedor, el script de Nginx ejecuta `envsubst` sobre estas plantillas y genera la configuración final en `/etc/nginx/conf.d/default.conf`.

### Variables Disponibles

| Variable | Descripción | Valor por Defecto |
| :--- | :--- | :--- |
| `API_URL` | Dirección del API Gateway o backend de producción | `http://gateway-service:9000` |
| `WS_URL` | Dirección del servicio WebSocket de producción (SockJS/STOMP) | `http://gateway-service:9000` |

---

## 🚀 Cómo Ejecutar el Contenedor

### 1. Compilar la Imagen

Para construir la imagen de Docker optimizada localmente, ejecuta el siguiente comando:

```bash
docker build -t voicepay-frontend:latest .
```

### 2. Ejecutar con Valores por Defecto

Si tus microservicios y el API Gateway están corriendo en el mismo entorno de Docker y en la misma red de docker con la resolución de nombres `gateway-service` activa:

```bash
docker run -d -p 80:80 --name voicepay-fe voicepay-frontend:latest
```

### 3. Ejecutar Apuntando a Backends Específicos (Cloud / Staging / Dev)

Si deseas apuntar el frontend a backends específicos sin tener que recompilar la imagen, simplemente pasa las variables de entorno en el arranque con `-e`:

```bash
docker run -d \
  -p 80:80 \
  -e API_URL=http://api.staging.voicepay.internal:9000 \
  -e WS_URL=http://api.staging.voicepay.internal:9000 \
  --name voicepay-fe-staging \
  voicepay-frontend:latest
```

---

## 🛡️ Características y Optimizaciones de Nginx

La configuración de Nginx (`nginx/default.conf.template`) implementa las mejores prácticas para aplicaciones web modernas:

### 1. Compresión Gzip Activa

Reduce drásticamente los tiempos de carga inicial comprimiendo archivos de texto en tránsito (HTML, CSS, JS, JSON):

- `gzip_comp_level 6` para un balance óptimo entre CPU y tasa de compresión.
- Filtro por tipos de archivo relevantes para evitar desperdicio de CPU en formatos ya comprimidos (imágenes/videos).

### 2. Política de Caché Estática Agresiva

- **Assets de Vite (`/assets/`):** Los archivos `.js` y `.css` compilados por Vite incluyen un hash único (por ejemplo, `index-BAJzlOz6.js`). Nginx los sirve con una directiva de caché inmutable y de larga duración:

  ```nginx
  Cache-Control "public, max-age=31536000, immutable";
  ```

- **Ficheros HTML/JSON:** Archivos clave como `index.html` nunca deben ser almacenados en caché para que el cliente siempre cargue la última versión desplegada:

  ```nginx
  Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
  ```

### 3. SPA Soporte (Single Page Application)

Se asegura de que cualquier ruta interna de la aplicación (por ejemplo, `/login`, `/dashboard`, `/ivr-flow`) sea capturada y dirigida a `index.html`, evitando el error `404 Not Found` al refrescar la página:

```nginx
try_files $uri $uri/ /index.html;
```

### 4. Cabeceras de Seguridad Robustas

Protege la aplicación de vulnerabilidades comunes:

- `X-Frame-Options: SAMEORIGIN` (Previene Clickjacking).
- `X-Content-Type-Options: nosniff` (Previene ataques de sniffing de MIME).
- `X-XSS-Protection: 1; mode=block` (Protección contra Cross-Site Scripting en navegadores antiguos).
- `Content-Security-Policy` restrictiva y optimizada para permitir la conexión WebSocket (`ws:`/`wss:`) requerida por SockJS.
