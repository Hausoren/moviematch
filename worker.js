export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // 1. БЕСКОНЕЧНЫЙ КАТАЛОГ (800 000+ фильмов без блокировок провайдеров)
        if (url.pathname === "/api/movies") {
            const page = url.searchParams.get("page") || "1";
            const genre = url.searchParams.get("genre") || "";
            const TMDB_KEY = "847a4d57c7d81a9591e1d3e86c7104b7";

            let targetUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&language=ru-RU&sort_by=popularity.desc&vote_count.gte=50&page=${page}`;
            if (genre) {
                targetUrl += `&with_genres=${genre}`;
            }

            try {
                const res = await fetch(targetUrl);
                const data = await res.json();

                const movies = (data.results || [])
                    .filter(m => m.poster_path && m.overview && m.overview.trim().length > 10)
                    .map(m => ({
                        id: m.id.toString(),
                        title: m.title,
                        year: m.release_date ? m.release_date.split('-')[0] : '—',
                        rating: m.vote_average ? m.vote_average.toFixed(1) : '—',
                        // Постер загружается через безопасный прокси без черных полос и блокировок
                        poster_url: `/api/poster?path=${encodeURIComponent(m.poster_path)}`,
                        description: m.overview
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

        // 2. ПРОКСИ И КЭШ ПОСТЕРОВ (Отдаются моментально и без сбоев)
        if (url.pathname === "/api/poster") {
            const path = url.searchParams.get("path");
            if (!path) return new Response("Missing path", { status: 400 });

            try {
                const imgRes = await fetch(`https://image.tmdb.org/t/p/w500${path}`);
                return new Response(imgRes.body, {
                    headers: {
                        "Content-Type": imgRes.headers.get("Content-Type") || "image/jpeg",
                        "Cache-Control": "public, max-age=604800, immutable"
                    }
                });
            } catch (e) {
                return new Response("Image error", { status: 500 });
            }
        }

        return env.ASSETS.fetch(request);
    }
};
