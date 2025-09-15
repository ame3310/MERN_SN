RRSS — Red social full-stack (Frontend + Backend)
Proyecto de fin de módulo del bootcamp: red social donde cualquier persona puede registrarse, iniciar sesión, publicar, comentar, marcar como favorito, dar like, seguir a otros usuarios y buscar contenidos/usuarios.
El frontend consume la API creada en el proyecto de backend y se ha cuidado especialmente la seguridad y la organización del código.

🔗 Demo (deploy)
Frontend (Vercel): https://front-rrssm-ongo-6exfqang3-ame3310s-projects.vercel.app

Backend (Railway): desplegado en Railway (URL configurada en VITE_API_URL)

En producción las cookies HttpOnly requieren https y secure=true. Configura CORS_ORIGIN con el dominio de Vercel.

🧩 Stack tecnológico
Frontend
React + TypeScript

React Router

Redux Toolkit (estado global + normalización de entidades)

Axios (cliente HTTP con interceptors de refresh)

SASS (estilos)

Vite (dev/build)

Backend
Node.js + Express

MongoDB + Mongoose

JWT con cookies HttpOnly (access/refresh)

Patrón read-models (endpoints /read/\* optimizados para UI)

CORS con credentials

Subida de imágenes (signing + subida directa)

🏗️ Arquitectura (resumen)
Autenticación: JWT en cookies HttpOnly (accessToken + refreshToken) con sameSite=lax.
El frontend añade Authorization cuando corresponde y refresca el access token de forma segura y concurrente.

Read-models: la UI usa endpoints /read/\* pensados para lectura rápida y paginada, con metadatos (p. ej. likeCount, likedByMe, author embebido).

Evitar parpadeos: ETag desactivado y Cache-Control: no-store en /read/\*.

Normalización en cliente: Redux Toolkit guarda entidades por id y listas indexadas por keys (feed general, por autor, favoritos, etc.).

⚙️ Configuración & ejecución local
Requisitos
Node.js 18+

MongoDB (local o Atlas)

Backend
Variables:

cp backend/.env.example backend/.env

Edita backend/.env:

PORT=5000
MONGO_URL=mongodb://localhost:27017/rrss
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=1d
JWT_SECRET=tu_super_secreto
CORS_ORIGIN=http://localhost:5173

Instala & levanta:

cd backend
npm i
npm run dev

Frontend
Variables:

cp frontend/.env.example frontend/.env

Edita frontend/.env:

VITE_API_URL=http://localhost:5000

Instala & levanta:

cd frontend
npm i
npm run dev

App: http://localhost:5173

API: http://localhost:5000

🔌 Endpoints (resumen)
Auth

POST /auth/register

POST /auth/login → setea cookies accessToken y refreshToken

POST /auth/refresh-token

POST /auth/logout

Posts

GET /read/posts — paginado; filtros: authorId, page, limit

GET /read/posts/:id

POST /posts

PATCH /posts/:id

DELETE /posts/:id

Comentarios

GET /read/comments/by-post?postId=...&page=...&limit=...

POST /comments

PATCH /comments/:id

DELETE /comments/:id

Likes/Favorites

POST /likes / DELETE /likes/:id

POST /favorites / DELETE /favorites/:id

GET /read/favorites?userId=...

Seguidores

POST /followers/:userId

DELETE /followers/:userId

GET /read/followers/:userId/followers

GET /read/followers/:userId/following

Feeds

GET /read/feeds?scope=all|following&page=...&limit=...

Search

GET /read/search?q=...&type=users|posts|all&page=...&limit=...

Uploads

POST /uploads/sign-batch — firma para subida de imágenes

🔐 Seguridad
Cookies HttpOnly para JWT; sameSite=lax, secure solo en producción, path=/.

CORS con credentials: true y origen explícito.

requireAuth acepta token de cookie y (si procede) de Authorization.

🖥️ UI/UX
Tema oscuro, grid responsive, tipografía clara.

Estados de carga/errores visibles.

Acciones optimistas (likes/favoritos).

Paginación/infinite load donde aplica.

Búsqueda unificada de usuarios y posts.

TODO: mejorar UI/UX y estilo general de la RRSS

🧪 Calidad
ESLint + Prettier

TS estricto 2) Pruebas end-to-end básicas (login, crear/editar/borrar post, comentar, like, follow/unfollow).

Regla de tamaño: componentes < 400 líneas, funciones < 75

Redux Toolkit con normalización y selectors memorizados

🚀 Despliegue
Frontend — Vercel
URL: https://front-rrssm-ongo-6exfqang3-ame3310s-projects.vercel.app

Variables:

VITE_API_URL=https://mernback-production-600c.up.railway.app

Backend — Railway
Exponer puerto (PORT)

Variables:

MONGO_URL (Atlas)

CORS_ORIGIN=https://front-rrssm-ongo-6exfqang3-ame3310s-projects.vercel.app


JWT\_\* secretos

Cookies en prod: secure=true, sameSite=lax, path=/
