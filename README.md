# Data Book: Dashboard de Gobierno de Datos

**Data Book** es un sistema web tipo dashboard, inspirado en Collibra, diseñado para la gestión y el gobierno de datos en una organización. Proporciona una interfaz centralizada para administrar activos de datos, políticas, calidad y metadatos, facilitando la colaboración y la transparencia.

## 🚀 Vista Previa

Puedes ver una demostración en vivo del proyecto desplegada en GitHub Pages:

**[https://mjmc4498.github.io/Data_Book/](https://mjmc4498.github.io/Data_Book/)**

## 🔧 Cómo Empezar

Este proyecto es una plantilla frontend estática. No requiere un proceso de instalación complejo ni dependencias de backend para su visualización.

### Requisitos

- Un navegador web moderno (Chrome, Firefox, Safari, Edge).
- Opcional: Un servidor web local para evitar problemas con CORS si se modifica el código. Python `http.server` es una opción sencilla.

### Uso Local

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/mjmc4498/Data_Book.git
    ```

2.  **Navega al directorio del proyecto:**
    ```bash
    cd Data_Book
    ```

3.  **Abre `index.html` en tu navegador:**
    Puedes hacer doble clic en el archivo `index.html` para abrirlo directamente en tu navegador.

4.  **(Opcional) Ejecutar con un servidor local:**
    Si prefieres servir los archivos desde un servidor local, puedes usar el módulo `http.server` de Python (o cualquier otro de tu elección):
    ```bash
    # Si tienes Python 3
    python -m http.server 8000
    ```
    Luego, abre `http://localhost:8000` en tu navegador.

## 📖 Manual del Sistema y Uso

El dashboard está diseñado para ser intuitivo. La navegación principal se encuentra en la barra lateral izquierda, que permite acceder a los diferentes módulos del sistema.

- **Sidebar (Menú Lateral):** Contiene enlaces a todos los módulos funcionales. Haz clic en cualquiera de ellos para cargar su contenido en el área principal.
- **Navbar (Barra Superior):**
    - **Botón de Menú:** Oculta o muestra la barra lateral en pantallas pequeñas.
    - **Buscador Global:** Permite realizar búsquedas centralizadas en todo el catálogo de activos (funcionalidad de frontend).
    - **Toggle Dark/Light Mode:** Cambia entre el tema claro y oscuro de la interfaz.
    - **Menú de Usuario:** Acceso a perfil y configuración (simulado).
- **Área de Contenido:** Muestra el módulo seleccionado. La navegación dentro de cada módulo utiliza componentes como `tabs`, `modals` y `breadcrumbs` para una experiencia fluida.

## 🏛️ Estructura de Módulos

El sistema está dividido en los siguientes módulos funcionales:

1.  **Dashboard General:** Vista principal con KPIs y resúmenes visuales.
2.  **Glosario de Negocio:** Gestión de términos, definiciones y relaciones.
3.  **Diccionario de Datos:** Catálogo de tablas, campos y su mapeo con el negocio.
4.  **Calidad de Datos:** Reglas, indicadores y seguimiento de la calidad.
5.  **Seguridad y Perfilamiento:** Gestión de roles, permisos y auditoría.
6.  **Arquitectura Empresarial:** Visualización de flujos y linaje de datos.
7.  **Catálogo de Activos:** Explorador de todos los activos de datos de la organización.
8.  **Gobierno de Metadatos:** Flujos de aprobación y control de versiones.
9.  **Políticas y Normativas:** Repositorio central de políticas de datos.
10. **Gestión de Incidentes:** Registro y seguimiento de problemas relacionados con datos.

## ✨ Tecnologías Utilizadas

- **HTML5**
- **CSS3**
- **JavaScript (ES6+)**
- **[Bootstrap 5.3](https://getbootstrap.com/):** Framework principal para el diseño y los componentes de la interfaz.
- **[Bootstrap Icons 1.11](https://icons.getbootstrap.com/):** Para la iconografía del sistema.
- **[GitHub Pages](https://pages.github.com/):** Para el despliegue y hosting de la versión de demostración.

---

Creado por [mjmc4498](https://github.com/mjmc4498).
