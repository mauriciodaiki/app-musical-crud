require('dotenv').config();

const express = require('express');
const methodOverride = require('method-override');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no esta configurada. Revisa tu archivo .env o variables en Render.');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

function getYouTubeEmbedUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let videoId = null;

    if (parsed.hostname.includes('youtube.com')) {
      videoId = parsed.searchParams.get('v');
      if (!videoId && parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1];
      }
    }

    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch (error) {
    return null;
  }
}

async function initializeDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS songs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      artist VARCHAR(150) DEFAULT 'Mauricio Daiki',
      genre VARCHAR(100),
      release_year INTEGER,
      video_url TEXT,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(createTableQuery);

  const countResult = await pool.query('SELECT COUNT(*)::int AS total FROM songs;');
  const total = countResult.rows[0].total;

  if (total === 0) {
    const seedQuery = `
      INSERT INTO songs (title, artist, genre, release_year, video_url, description)
      VALUES
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18);
    `;

    const seedValues = [
      'Luz de Medianoche',
      'Mauricio Daiki',
      'Pop Alternativo',
      2022,
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'Cancion energetica con una mezcla de sintetizadores y guitarras.',
      'Ciudad de Cristal',
      'Mauricio Daiki',
      'Indie Rock',
      2023,
      'https://youtu.be/3JZ_D3ELwOQ',
      'Tema introspectivo sobre crecimiento personal y perseverancia.',
      'Volar Sin Miedo',
      'Mauricio Daiki',
      'Balada',
      2021,
      '',
      'Balada emocional enfocada en superar obstaculos y seguir adelante.',
    ];

    await pool.query(seedQuery, seedValues);
    console.log('Registros iniciales insertados en songs.');
  }
}

app.get('/', (req, res) => {
  res.redirect('/songs');
});

app.get('/songs', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM songs ORDER BY id DESC;');
    res.render('index', { songs: result.rows });
  } catch (error) {
    next(error);
  }
});

app.get('/songs/new', (req, res) => {
  res.render('new');
});

app.post('/songs', async (req, res, next) => {
  const { title, artist, genre, release_year, video_url, description } = req.body;

  try {
    await pool.query(
      `
        INSERT INTO songs (title, artist, genre, release_year, video_url, description)
        VALUES ($1, COALESCE(NULLIF($2, ''), 'Mauricio Daiki'), NULLIF($3, ''), NULLIF($4, '')::int, NULLIF($5, ''), NULLIF($6, ''));
      `,
      [title, artist, genre, release_year, video_url, description]
    );

    res.redirect('/songs');
  } catch (error) {
    next(error);
  }
});

app.get('/songs/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM songs WHERE id = $1;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).render('show', { song: null, embedUrl: null });
    }

    const song = result.rows[0];
    const embedUrl = getYouTubeEmbedUrl(song.video_url);

    res.render('show', { song, embedUrl });
  } catch (error) {
    next(error);
  }
});

app.get('/songs/:id/edit', async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM songs WHERE id = $1;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('404 - Cancion no encontrada.');
    }

    res.render('edit', { song: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

app.put('/songs/:id', async (req, res, next) => {
  const { id } = req.params;
  const { title, artist, genre, release_year, video_url, description } = req.body;

  try {
    const updateResult = await pool.query(
      `
        UPDATE songs
        SET
          title = $1,
          artist = COALESCE(NULLIF($2, ''), 'Mauricio Daiki'),
          genre = NULLIF($3, ''),
          release_year = NULLIF($4, '')::int,
          video_url = NULLIF($5, ''),
          description = NULLIF($6, '')
        WHERE id = $7
        RETURNING *;
      `,
      [title, artist, genre, release_year, video_url, description, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).send('404 - Cancion no encontrada.');
    }

    res.redirect(`/songs/${id}`);
  } catch (error) {
    next(error);
  }
});

app.delete('/songs/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const deleteResult = await pool.query('DELETE FROM songs WHERE id = $1 RETURNING id;', [id]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).send('404 - Cancion no encontrada.');
    }

    res.redirect('/songs');
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).send('404 - Ruta no encontrada.');
});

app.use((error, req, res, next) => {
  console.error('Error interno:', error);

  if (error.code && error.code.startsWith('22')) {
    return res.status(400).send('Error: revisa el formato de los datos enviados.');
  }

  if (error.code && error.code.startsWith('23')) {
    return res.status(400).send('Error: no se pudo completar la operacion en la base de datos.');
  }

  return res.status(500).send('Error interno del servidor. Intenta de nuevo.');
});

(async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo inicializar la aplicacion:', error);
    process.exit(1);
  }
})();
