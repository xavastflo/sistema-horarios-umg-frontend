# Frontend — Sistema de Horarios UMG

React + Vite. Consume la API Laravel aprobada en Sprint 4.

---

## Stack

| Herramienta | Versión | Uso |
|---|---|---|
| React | 18 | UI |
| Vite | 5 | Build y dev server |
| React Router DOM | 6 | Enrutamiento SPA |
| Axios | 1.7 | Llamadas HTTP |
| DM Sans / DM Mono | Google Fonts | Tipografía |

---

## Instalación

```bash
# 1. Desde la raíz del proyecto frontend:
npm install

# 2. Crear el archivo de entorno:
cp .env.example .env

# 3. Editar .env si el backend corre en otro puerto:
#    VITE_API_URL=http://127.0.0.1:8000/api
```

---

## Ejecución

```bash
# Desarrollo (hot reload):
npm run dev
# Abre http://localhost:5173

# Build de producción:
npm run build

# Previsualizar el build:
npm run preview
```

---

## Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://127.0.0.1:8000/api` | URL base de la API Laravel |

> Solo las variables con prefijo `VITE_` son expuestas en el navegador.

---

## Conexión con el backend local

1. Asegurarse de que el backend Laravel está corriendo:
   ```bash
   cd backend
   php artisan serve   # corre en http://127.0.0.1:8000
   ```

2. Verificar que `config/cors.php` del backend permite el origen del frontend:
   ```php
   'allowed_origins' => ['http://localhost:5173'],
   ```

3. El frontend lee `VITE_API_URL` del `.env` y Axios agrega el token automáticamente.

---

## Estructura de carpetas

```
src/
├── api/
│   ├── axios.js             Instancia global con interceptores de token y errores
│   └── auth.js              login(), logout(), getMe(), cambiarPerfil()
├── components/
│   ├── Layout.jsx            Sidebar + topbar + dropdown de roles + logout
│   ├── ProtectedRoute.jsx    Guarda de rutas por token y rol
│   └── ui/                  Componentes reutilizables base (Paso 3)
│       ├── PageHeader.jsx
│       ├── Card.jsx
│       ├── Button.jsx
│       ├── Badge.jsx
│       ├── EmptyState.jsx
│       ├── LoadingState.jsx
│       └── ErrorState.jsx
├── context/
│   └── AuthContext.jsx       Estado global: token, usuario, perfilActivo, roles
├── pages/
│   ├── Login.jsx
│   ├── ModuloPendiente.jsx   Página genérica para módulos en desarrollo
│   └── dashboards/
│       └── Dashboards.jsx    AdminDashboard, CoordinadorDashboard,
│                             DocenteDashboard, EstudianteDashboard
├── App.jsx                   Árbol de rutas
├── main.jsx                  Punto de entrada
└── index.css                 Variables CSS y reset global
```

---

## Flujo de autenticación

```
Login → POST /api/auth/login
      → guarda token en localStorage
      → AuthContext hidrata usuario, roles, perfilActivo
      → redirige a /{rol}/dashboard

Recarga → AuthContext lee token de localStorage
        → GET /api/auth/me para verificar
        → si válido: hidrata estado
        → si 401: limpia y redirige a /login

Logout → POST /api/auth/logout
       → limpia localStorage y AuthContext
       → redirige a /login
```

---

## Rutas disponibles

| Ruta | Acceso | Componente |
|---|---|---|
| `/login` | Público | `Login` |
| `/` | Autenticado | Redirige al dashboard del perfil activo |
| `/admin/dashboard` | rol: administrador | `AdminDashboard` |
| `/coordinador/dashboard` | rol: coordinador | `CoordinadorDashboard` |
| `/docente/dashboard` | rol: docente | `DocenteDashboard` |
| `/estudiante/dashboard` | rol: estudiante | `EstudianteDashboard` |
| `/pendiente` | Autenticado | `ModuloPendiente` (módulos en desarrollo) |

---

## Endpoints backend consumidos

| Endpoint | Cuándo |
|---|---|
| `POST /api/auth/login` | Formulario de login |
| `POST /api/auth/logout` | Botón de cerrar sesión |
| `GET /api/auth/me` | Rehidratación al recargar la página |
| `POST /api/auth/cambiar-perfil` | Selector de perfil en el topbar |

---

## Componentes UI reutilizables (Paso 3)

Todos los componentes en `src/components/ui/` son puramente presentacionales:
sin fetch, sin Axios, sin useEffect de datos.

```jsx
// Patrón de uso en un módulo futuro:
import PageHeader  from '../components/ui/PageHeader'
import Card        from '../components/ui/Card'
import Button      from '../components/ui/Button'
import LoadingState from '../components/ui/LoadingState'
import EmptyState  from '../components/ui/EmptyState'
import ErrorState  from '../components/ui/ErrorState'
import Badge, { badgeEstadoHorario, badgeEstado } from '../components/ui/Badge'

<PageHeader titulo="Docentes" accion={<Button>Nuevo</Button>} />
<Card>
  {cargando  && <LoadingState />}
  {error     && <ErrorState onReintentar={recargar} />}
  {!cargando && !error && datos.length === 0 && <EmptyState titulo="Sin docentes" />}
</Card>
```

---

## Credenciales de prueba

```
Usuario:    admin
Contraseña: Admin@2024!
```

*(credenciales del seeder del backend — cambiar en producción)*

---

## Próximos pasos (Frontend Paso 4+)

- Módulo de gestión de usuarios y roles (admin)
- Módulo de carreras, facultades y docentes (admin/coord)
- Módulo de horarios con tabla visual (coord)
- Vista de horario del docente
- Vista de horario publicado para estudiante
- Módulo de reportes PDF/Excel
