# 🚀 Guía Rápida de Comandos para el Frontend
**VoicePay Frontend (React + Vite + TypeScript + TailwindCSS)**

Esta es una guía de referencia rápida para que la tengas guardada. Aquí encontrarás todos los comandos esenciales que necesitarás usar en tu día a día en la terminal para navegar, iniciar, compilar, instalar dependencias y administrar este proyecto de frontend en **Windows (PowerShell)**.

---

## 📂 1. Navegación por Carpetas (Rutas en PowerShell)

Como estás en Windows, tu terminal principal es **PowerShell**. Estos comandos te servirán para moverte entre las carpetas del proyecto y saber siempre dónde estás parado.

| Comando | Nombre | ¿Para qué sirve? | Ejemplo de uso |
| :--- | :--- | :--- | :--- |
| `pwd` | *Print Working Directory* | Te muestra la **ruta exacta** de la carpeta en la que estás actualmente. | `pwd` |
| `ls` o `dir` | *List* | Muestra una lista de todos los archivos y subcarpetas dentro de la carpeta actual. | `ls` |
| `cd <nombre_carpeta>` | *Change Directory* | Te mete dentro de la carpeta que especifiques. | `cd src` |
| `cd ..` | *Change Directory Up* | Te sube un nivel (vuelve a la carpeta anterior/padre). | `cd ..` |
| `cd ../..` | *Multi-level Up* | Sube dos niveles en la estructura de carpetas. | `cd ../..` |
| `clear` o `cls` | *Clear* | Limpia la pantalla de la terminal por si se llena de texto y quieres orden. | `clear` |

> [!TIP]
> **Autocompletado Rápido:** No escribas las rutas completas. Escribe las primeras letras de una carpeta y presiona la tecla **Tab (Tabulador ↹)**. PowerShell completará automáticamente el nombre de la carpeta por ti.

---

## ⚡ 2. Comandos Específicos del Proyecto (Vite + React)

Estos son los comandos principales definidos en el archivo [package.json](file:///c:/Proyecto%20de%20pagos/voicepay-frontend/package.json) para correr y compilar la aplicación. **Debes estar parado en la carpeta raíz del frontend (`voicepay-frontend`) para ejecutarlos.**

```bash
# Iniciar el servidor de desarrollo local
npm run dev
```
* **Para qué sirve:** Arranca el servidor local de desarrollo ultra rápido de Vite. Te dará un enlace (normalmente `http://localhost:5173/`) para abrir el navegador y ver tu web en tiempo real. Cualquier cambio que hagas en el código se reflejará instantáneamente sin recargar toda la página (HMR).

```bash
# Compilar el proyecto para producción
npm run build
```
* **Para qué sirve:** Compila y optimiza todo tu código TypeScript y React. Revisa que no haya errores de tipo y genera una carpeta llamada `dist/` con archivos HTML, CSS y JS ultra comprimidos listos para subirse a un servidor de producción o Docker.

```bash
# Previsualizar el sitio de producción localmente
npm run preview
```
* **Para qué sirve:** Levanta un servidor local apuntando a la carpeta compilada `dist/`. Es ideal para probar el frontend exactamente como se comportará en producción antes de desplegarlo.

```bash
# Ejecutar el Linter (Analizador de Código)
npm run lint
```
* **Para qué sirve:** Analiza tu código en busca de malas prácticas, código sin usar o problemas de formato definidos en las reglas de ESLint de tu proyecto. Te ayuda a mantener el código limpio y libre de errores silenciosos.

> [!IMPORTANT]
> **¿Cómo detener un servidor en ejecución?** Si tienes corriendo `npm run dev` o `npm run preview` y quieres liberar la terminal para escribir otros comandos, presiona **`Ctrl + C`** en tu teclado y luego confirma con `S` (o `Y` en inglés) si te lo pregunta.

---

## 📦 3. Administración de Paquetes y Dependencias (`npm`)

Si necesitas instalar nuevas librerías para tu interfaz (iconos, animaciones, utilidades), usarás el gestor de paquetes de Node.js (`npm`).

* **`npm install`** (o simplemente **`npm i`**):
  * **Para qué sirve:** Lee el archivo `package.json` e instala automáticamente todas las librerías necesarias para que el proyecto funcione en tu máquina. Úsalo siempre después de clonar el repositorio o de bajar cambios de tus compañeros.
* **`npm install <nombre-paquete>`**:
  * **Para qué sirve:** Descarga e instala una nueva librería y la guarda en la sección de dependencias de producción.
  * *Ejemplo:* `npm install lucide-react` (para iconos).
* **`npm install -D <nombre-paquete>`**:
  * **Para qué sirve:** Instala una librería que solo necesitas durante el desarrollo (por ejemplo, tipos de TypeScript, utilidades de compilación, linter) y no se incluirá en el build de producción final.
  * *Ejemplo:* `npm install -D @types/react`
* **`npm uninstall <nombre-paquete>`**:
  * **Para qué sirve:** Elimina de forma segura una librería instalada y la borra de tu archivo `package.json`.
  * *Ejemplo:* `npm uninstall axios`

---

## 🐳 4. Comandos de Docker (Contenedores del Frontend)

El proyecto incluye soporte para Docker con Nginx optimizado. Aquí tienes los comandos para empaquetar tu frontend en un contenedor de grado de producción:

* **Compilar la imagen de Docker local:**
  ```powershell
  docker build -t voicepay-frontend:latest .
  ```
  * **Para qué sirve:** Crea una imagen virtual autocontenida que incluye el frontend compilado y el servidor web Nginx configurado listo para producción.
* **Ejecutar el frontend en Docker local (Puerto 80):**
  ```powershell
  docker run -d -p 80:80 --name voicepay-fe voicepay-frontend:latest
  ```
  * **Para qué sirve:** Arranca el frontend en segundo plano (`-d`) mapeando el puerto `80` de tu máquina al contenedor. Podrás acceder escribiendo `http://localhost/` en tu navegador.
* **Correr apuntando a un backend específico:**
  ```powershell
  docker run -d -p 80:80 -e API_URL=http://tu-api-backend:9000 -e WS_URL=http://tu-api-backend:9000 --name voicepay-fe voicepay-frontend:latest
  ```
  * **Para qué sirve:** Inicia la aplicación e inyecta dinámicamente las rutas del backend en Nginx a través de variables de entorno sin tener que recompilar el código.

---

## 🐙 5. Comandos Rápidos de Git (Control de Versiones)

Cuando estás trabajando en el frontend y quieres guardar tus avances o subirlos a GitHub/GitLab:

* **`git status`**: Te muestra qué archivos has modificado, cuáles has creado y cuáles están listos para ser guardados.
* **`git add .`**: Prepara todos tus cambios en el frontend para ser guardados.
* **`git commit -m "Mensaje explicando el cambio"`**: Guarda tus cambios de manera local con una etiqueta descriptiva.
* **`git pull`**: Descarga y combina los últimos cambios que otros hayan subido al repositorio remoto.
* **`git push`**: Sube tus commits guardados localmente al repositorio remoto para que tu equipo los vea.
* **`git checkout -b <nueva-rama>`**: Crea y te cambia a una nueva rama de trabajo para que hagas experimentos o programes una vista sin alterar el código principal.

---

## 💡 Consejos Extra de Terminal para que sea Súper Fácil:

1. **Historial de Comandos:** No vuelvas a escribir un comando largo. Presiona las **flechas Arriba (↑) y Abajo (↓)** en tu teclado dentro de la terminal para navegar por los comandos que ya habías ejecutado anteriormente.
2. **Matar procesos rebeldes:** Si por alguna razón una terminal se queda colgada o un servidor no quiere cerrarse con `Ctrl + C`, simplemente cierra la pestaña de la terminal o escribe `exit` y abre una nueva.
3. **Múltiples Terminales:** En editores como VS Code, puedes usar el botón de **`+`** en el panel de la terminal para tener una corriendo el servidor de desarrollo (`npm run dev`) y otra libre para escribir comandos de Git o instalar librerías.
