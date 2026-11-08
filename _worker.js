export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 1. Бесконечная подгрузка фильмов через сервер Cloudflare (обход всех блокировок)
        if (url.pathname === "/api/movies") {
            const page = url.searchParams.get("page") || "1";
            const genre = url.searchParams.get("genre") || "";
            const TMDB_KEY = "847a4d57c7d81a9591e1d3e86c7104b7";

            let tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=ru-RU&sort_by=popularity.desc&vote_count.gte=80&page=${page}`;
            if (genre) {
                tmdbUrl += `&with_genres=${genre}`;
            }

            try {
                const res = await fetch(tmdbUrl);
                const data = await res.json();

                const movies = (data.results || [])
                    .filter(m => m.poster_path && m.overview)
                    .map(m => ({
                        id: m.id.toString(),
                        title: m.title,
                        year: m.release_date ? m.release_date.split('-')[0] : '—',
                        rating: m.vote_average ? m.vote_average.toFixed(1) : '—',
                        poster_url: `https://image.tmdb.org/t/p/w500${m.poster_path}`,
                        description: m.overview,
                        genre_ids: m.genre_ids || []
                    }));

                return new Response(JSON.stringify(movies), {
                    headers: { 
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500 });
            }
        }

        // 2. Отдача обычных файлов приложения
        return env.ASSETS.fetch(request);
    }
};
