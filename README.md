# App Musical CRUD

## Descripcion
Aplicacion web CRUD para administrar un catalogo musical de Mauricio Daiki. Permite crear, consultar, editar y eliminar canciones usando Node.js, Express, EJS y PostgreSQL.

## Tecnologias usadas
- Node.js
- Express
- EJS
- PostgreSQL
- HTML/CSS
- method-override
- dotenv
- pg

## Funcionalidades CRUD
- Consultar todos los registros (`GET /songs`)
- Consultar un registro individual (`GET /songs/:id`)
- Agregar registros (`POST /songs`)
- Editar registros (`PUT /songs/:id`)
- Eliminar registros (`DELETE /songs/:id`)

## Instrucciones para correr localmente
1. Clona el repositorio.
2. Entra a la carpeta del proyecto:
   ```bash
   cd app-musical-crud
   ```
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Crea tu archivo `.env` basado en `.env.example`.
5. Configura `DATABASE_URL` con tu base de datos PostgreSQL.
6. Inicia la aplicacion:
   ```bash
   npm start
   ```
7. Abre `http://localhost:3000` en tu navegador.

## Variables de entorno
- `DATABASE_URL` (obligatoria)
- `PORT` (opcional, por defecto `3000`)

## Despliegue en Render
Configura el proyecto como **Web Service** (no Static Site) con:

- Build Command: `npm install`
- Start Command: `npm start`

### Pasos sugeridos
1. Sube este proyecto a GitHub.
2. En Render, crea un nuevo **Web Service** desde ese repositorio.
3. Agrega la variable de entorno `DATABASE_URL` con la URL de tu PostgreSQL.
4. (Opcional) Define `PORT`; Render normalmente la inyecta automaticamente.
5. Ejecuta el deploy y verifica las rutas CRUD.

La app usa `process.env.PORT || 3000` y `process.env.DATABASE_URL`, compatible con Render.
