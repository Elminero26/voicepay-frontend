# VoicePay System Frontend

Dashboard moderno, oscuro y profesional para monitorear un sistema de pagos por voz (IVR).

## Stack Tecnológico

* **React 19** & **TypeScript**
* **Vite**
* **TailwindCSS** (Styling)
* **Axios** (API Calls)
* **Recharts** (Gráficos)
* **Lucide React** (Iconos)
* **Framer Motion** (Animaciones)

## Estructura del Proyecto

```text
src/
├── components/   # Componentes UI reutilizables (Button, Card, Table, Modal, Loader)
├── hooks/        # Hooks personalizados
├── layouts/      # Layout principal con Sidebar y Header
├── pages/        # Páginas: Dashboard y Users
├── services/     # Lógica de API (Axios y Mock Data)
├── types/        # Interfaces de TypeScript
└── utils/        # Utilidades (cn para Tailwind)
```

## Cómo Ejecutar el Proyecto

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

3. El proyecto estará disponible en `http://localhost:5173`.

## Conexión con Backend (Spring Boot)

El servicio de API está configurado en `src/services/api.ts`.

* **Base URL:** `http://localhost:8080/api`
* **CORS:** Asegúrate de que tu backend Spring Boot tenga habilitado CORS para el origen `http://localhost:5173`.
* **Mock Data:** Si el backend no está disponible, el sistema automáticamente usará datos de prueba (mocks) para que puedas visualizar la UI sin interrupciones.

### Ejemplo de Configuración CORS en Spring Boot:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173")
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```

## Características Principales

* **Dashboard en tiempo real:** Visualización de métricas de llamadas y pagos.
* **Gráficos Dinámicos:** Seguimiento de tendencias de pagos con Recharts.
* **Gestión de Usuarios:** Listado y creación de usuarios mediante modales animados.
* **Diseño Premium:** Tema oscuro, minimalista y responsivo.
