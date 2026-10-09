<!-- calidad:inicio -->
![Calidad](https://img.shields.io/badge/Calidad-sin%20c%C3%B3digo-lightgrey)

**Calidad de servicios:** sin código en `main` (no evaluable).
<!-- calidad:fin -->

# Frontend Angular — Biblioteca Virtual

Cliente web del backend Flask (`../Backend-Flask`). Catálogo de libros, préstamos,
reseñas y ruleta.

- **Angular** 22.2 (standalone, zoneless, signals)
- **TypeScript** 6.0 con `strict` y `strictTemplates` activos
- **SCSS** propio, sin librería de UI de terceros
- **Vitest** para pruebas unitarias

---

## Puesta en maPu
npm install
npm start          # http://localhost:4200
```

El backend debe estar corriendo en `http://localhost:5000` (ver más abajo cómo
levantarlo). Swagger UI está en `http://localhost:5000/docs`.

### Scripts

| Script | Qué hace |
| --- | --- |
| `npm start` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Build de producción (aplica `fileReplacements` y presupuestos) |
| `npm run build:dev` | Build sin optimizar, para depurar |
| `npm run typecheck` | `tsc --noEmit`, sin emitir nada |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run format` | Formatea con Prettier |
| `npm run format:check` | Comprueba el formato sin escribir |

---

## Variables de entorno

Angular no lee archivos `.env`: la configuración se resuelve **en tiempo de
compilación** mediante `fileReplacements`, declarados en `angular.json`.

| Archivo | Cuándo se usa | `apiUrl` |
| --- | --- | --- |
| `src/environments/environment.ts` | Desarrollo y cualquier build que no sea de producción | `http://localhost:5000` |
| `src/environments/environment.production.ts` | `ng build` (sustituye al anterior) | `http://localhost:5000` → **cambiar al dominio real** |

Para cambiar el backend, edita `apiUrl` en el archivo correspondiente. **Nunca**
importes `environment.production` directamente desde el código: se importa
siempre `@env/environment` y el build decide.

```ts
import { environment } from '@env/environment';

environment.apiUrl;        // origen del backend, sin barra final
environment.production;    // boolean
environment.apiTimeoutMs;  // timeout de las peticiones, en ms
```

### CORS

El frontend y el backend corren en puertos distintos, así que el navegador exige
CORS. El backend lo declara en la variable `CORS_ORIGINS`, separada por comas:

```bash
# Backend-Flask
CORS_ORIGINS="http://localhost:4200" python run.py
```

Al desplegar, ese valor debe coincidir con el origen exacto del frontend. Si no
coincide, el navegador bloquea la petición y la aplicación solo verá un error de
red genérico.

Levantar el backend completo (PostgreSQL incluido):

```bash
cd ../Backend-Flask
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
docker compose -f database/docker-compose.yml up -d
python run.py
```

---

## Arquitectura

El proyecto sigue una organización por capas, con las rutas saliendo por
funcionalidad:

```
src/
├── app/
│   ├── core/            # Singleton: una instancia, en toda la app
│   │   ├── api/         # Config de API, modelo de error y operadores
│   │   ├── guards/      # authGuard, guestGuard
│   │   ├── interceptors/# authInterceptor, errorInterceptor
│   │   ├── models/      # Interfaces que replican el JSON del backend
│   │   └── services/    # Un servicio por dominio
│   ├── shared/          # Reutilizable, sin estado de negocio
│   │   ├── components/  # spinner, empty-state, error-banner, page-header
│   │   └── pipes/       # bvDate, autorNombre
│   ├── layout/          # Shell con la barra de navegación
│   ├── features/        #(auth, books, readings, reviews, roulette, errors)
│   ├── app.config.ts    # provideHttpClient + interceptores + router
│   ├── app.routes.ts    # Rutas, todas diferidas
│   └── app.ts           # Componente raíz
├── environments/
└── styles/              # _tokens.scss y _base.scss
```

Reglas de dependencia: `core` no importa de `features` ni de `shared`;
`shared` no importa de `features`; las `features` pueden usar `core` y `shared`
pero no entre sí. Así una feature se puede extraer sin arrastrar nada.

### Alias de importación

Definidos en `tsconfig.json` → `compilerOptions.paths`:

| Alias | Apunta a |
| --- | --- |
| `@env/*` | `src/environments/*` |
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@layout/*` | `src/app/layout/*` |
| `@features/*` | `src/app/features/*` |

### Rutas

| Ruta | Pantalla | Protegida |
| --- | --- | --- |
| `/login` | Iniciar sesión | Solo para visitantes |
| `/registro` | Crear cuenta | Solo para visitantes |
| `/libros` | Catálogo con buscador | Sí |
| `/libros/nuevo` | Alta de libro | Sí |
| `/libros/:bookId` | Detalle y reseñas del libro | Sí |
| `/libros/:bookId/editar` | Edición de libro | Sí |
| `/prestamos` | Mis préstamos | Sí |
| `/resenas` | Reseñas del catálogo | Sí |
| `/ruleta` | Ruleta | Sí |
| `**` | 404 | No |

Todas se cargan con `loadComponent`, así que el bundle inicial solo incluye el
router. `Shell` aporta la barra de navegación y envuelve a todas las rutas
protegidas.

---

## Autenticación

- `POST /api/auth/login` devuelve `{ data: { token, usuario } }`. El token es un
  JWT HS256 que dura 24 h por defecto.
- `authInterceptor` añade `Authorization: Bearer <token>` a las rutas bajo
  `/api/*` salvo login y registro. El prefijo `Bearer ` con mayúscula y un solo
  espacio es obligatorio.
- `TokenStorageService` guarda el token en `localStorage` y lee el claim `exp`
  para saber si caducó **antes** de gastar un 401.
- `authGuard` protege las rutas y redirige a `/login` con un `returnUrl`.
- `errorInterceptor` normaliza los errores a `ApiError` y, ante un 401, limpia
  la sesión y vuelve a `/login`.

**El backend no tiene refresh token ni revocación**: cerrar sesión es local, y
el JWT sigue siendo válido hasta su `exp`. Tampoco hay roles: todo usuario
autenticado tiene acceso completo al catálogo.

---

## Contrato con el backend

### Sobre de respuesta

Éxito: `{ "data": ... }`. Salvo los `DELETE`, que devuelven
`{ "message": "Libro eliminado" }`, y `GET /health`, que responde plano.

Error: existen **dos formas**, y por eso `errors` es opcional en `ApiErrorBody`:

```jsonc
// forma completa (400, 401, 404, 409 de validación)
{ "error": "Datos inválidos", "errors": ["nombre es requerido"] }

// forma mínima (405, 500, 409 de FK, 404 de ruta)
{ "error": "Método no permitido" }
```

`toApiError` aplana ambas a un `ApiError` con `message` y `details`, de modo que
los componentes nunca leen `error.error.errors`.

### Las fechas son RFC 1123, no ISO 8601

Flask serializa los `TIMESTAMP` con `werkzeug.http.http_date`, así que llegan
así:

```json
{ "fecha_registro": "Fri, 25 Sep 2026 12:00:00 GMT" }
```

El `DatePipe` de Angular solo entiende ISO 8601 y renderizaría vacío. **Usa
`| bvDate`**, no `| date`. Además las columnas son `TIMESTAMP WITHOUT TIME
ZONE`: son horas locales, sin zona, así que no se les debe aplicar conversión.

### Campos que no coinciden con lo que sugiere el nombre

- Un libro **no** tiene `categoria_id` en el nivel superior: viene anidado como
  `categoria: { id, nombre }`. Para crear sí se envía `categoria_id`.
- `Reading.usuario` y `Review.usuario` son un **string** con "Nombre Apellido", no
  un objeto.
- `categoria.nombre` puede ser `null`.

### Rarezas del contrato

- **No hay paginación.** Ningún endpoint acepta `page`, `limit` ni `total`, y
  devuelve el array completo sin metadatos. Si alguna pantalla necesita paginar,
  hay que hacerlo en el cliente.
- **No hay ordenación configurable.** El orden viene fijo en el SQL.
- **La búsqueda por `q` solo mira el título**, aunque el OpenAPI afirme que
  busca por ISBN, descripción y autor.
- **`progreso: 100` no devuelve un libro.** Hay que enviar
  `estado: "devuelto"` aparte.
- **Enviar `autores` en un PUT reemplaza el conjunto completo**, incluido `[]`
  para borrarlos.
- **El registro no devuelve token**: tras el alta hay que hacer login.
- **No hay endpoints de categorías ni de autores**, y `init.sql` no siembra
  esas tablas. No hay forma de obtener los `categoria_id` / `autor_id` válidos
  desde la API; el formulario de libro los pide a mano. Conviene pedir al backend
  que exponga `/api/categorias` y `/api/autores`.
- **Sin roles ni 403**: los recursos ajenos devuelven 404, no 403.
- `GET /health` no lleva CORS (no está bajo `/api`) y devuelve 200 incluso con la
  base de datos caída, usando `database: "indisponible"`.

---

## Styling

No hay librería de UI. El diseño se apoya en:

- `src/styles/_tokens.scss`: variables CSS `--bv-*` (color, tipografía,
  espaciado, radios, sombras). Al ser custom properties, se pueden redefinir en
  caliente para un tema oscuro.
- `src/styles/_base.scss`: reset y clases globales reutilizables (`.bv-card`,
  `.bv-btn`, `.bv-badge`, `.bv-field`, `.bv-alert`).

Los estilos de cada componente se limitan a lo específico y **no** repiten las
clases globales. Los presupuestos de `angular.json` avisan a partir de 8 kB por
hoja de componente, así que conviene seguir apoyándose en `_base.scss`.

---

## Pruebas

```bash
npm test
```

Cubren lo que más caro sale equivocarse, por depender de detalles del backend:

- `api-error.spec.ts`: las dos formas de error, el status 0 de CORS y el cuerpo
  HTML inesperado.
- `bv-date.pipe.spec.ts`: el parseo de RFC 1123 y los `null` de `fecha_devolucion`.
- `token-storage.service.spec.ts`: la decodificación de `exp` y la detección de
  caducidad.

---

## Pendiente

- [ ] Pedir al backend `GET /api/categorias` y `GET /api/autores`, para poder
      elegir categoría y autores con desplegables en vez de escribir IDs.
- [ ] Decidir la política de CORS de `GET /health` (hoy queda fuera de `/api`).
- [ ] Añadir un interceptor de reintento o un refresco de sesión si el volumen de
      401 por expiración resulta molesto.
- [ ] Considerar paginación en cliente para el catálogo y las reseñas.
