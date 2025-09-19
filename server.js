const express = require('express');

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://catalog-capability:dummy@localhost:5432/catalog-capability',
});

async function init() {
    const app = express();

    app.get('/get', async (req, res) => {
        const client = await pool.connect();
        try {
            console.log(req.query.search);
            const [commentRes, boardRes] = await Promise.all([
                client.query("SELECT * FROM public.comments WHERE comment_id = $1", [req.query.search]),
                client.query("SELECT * FROM public.dummy WHERE user_id = $1", [req.query.search])
            ]);
            res.json({
                status: 'ok',
                boardRes: boardRes.rows[0] || {},
                posts: commentRes.rows || []
            });
        } catch (err) {
            console.error('Database error:', err);
            res.status(500).json({ status: 'error', message: err.message });
        } finally {
            client.release();
        }
    });

    const PORT = 3000;
    app.use(express.static('static'));
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

init();

// docker run -d -p 8080:8080 \
//   --name my-hasura --rm \
//   -e HASURA_GRAPHQL_DATABASE_URL=postgres://catalog-capability:dummy@host.docker.internal:5432/catalog-capability \
//   -e HASURA_GRAPHQL_ENABLE_CONSOLE=true \
//   hasura/graphql-engine