const express = require("express");
const router = express.Router();

const TMDB_BASE = "https://api.themoviedb.org/3";

// 1. TMDB Movie Search
router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  try {
    const url = `${TMDB_BASE}/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const tmdbResponse = await fetch(url);
    const data = await tmdbResponse.json();

    const results = (data.results || []).slice(0, 8).map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? movie.release_date.slice(0, 4) : null,
      posterPath: movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : null,
    }));

    res.json({ results });
  } catch (err) {
    console.error("TMDB search failed:", err.message);
    res.status(500).json({ error: "Movie search failed" });
  }
});

// 2. TMDB Person Search
router.get("/people/search", async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  try {
    const url = `${TMDB_BASE}/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const tmdbResponse = await fetch(url);
    const data = await tmdbResponse.json();

    const results = (data.results || [])
      .filter((person) => person.profile_path)
      .slice(0, 6)
      .map((person) => ({
        id: person.id,
        name: person.name,
        photo: `https://image.tmdb.org/t/p/w200${person.profile_path}`,
        knownFor: person.known_for_department,
      }));

    res.json({ results });
  } catch (err) {
    console.error("TMDB person search failed:", err.message);
    res.status(500).json({ error: "Person search failed" });
  }
});

// 3. Pexels Image Search
router.get("/images/search", async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim().length === 0) {
    return res.json({ results: [] });
  }

  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`;
    const pexelsResponse = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY },
    });
    
    const data = await pexelsResponse.json();

    if (!pexelsResponse.ok) {
      return res.status(pexelsResponse.status).json({ error: "Pexels rejected the API key" });
    }

    const results = (data.photos || []).map((photo) => photo.src.medium);
    res.json({ results });
  } catch (err) {
    console.error("Pexels search failed:", err.message);
    res.status(500).json({ error: "Image search failed" });
  }
});

// Helper: Guess the Industry
function guessIndustry(movieData) {
  const lang = movieData.original_language;
  const countries = (movieData.production_countries || []).map((c) => c.name);

  const languageMap = {
    hi: "Bollywood", te: "Tollywood", ta: "Kollywood", ml: "Mollywood",
    kn: "Sandalwood", ko: "Korean Cinema", ja: "Japanese Cinema",
    zh: "Chinese Cinema", fr: "French Cinema", es: "Spanish Cinema",
  };

  if (languageMap[lang]) return languageMap[lang];
  if (lang === "en" && countries.includes("United States of America")) return "Hollywood";
  if (lang === "en" && countries.includes("United Kingdom")) return "British Cinema";
  return countries[0] ? `${countries[0]} Cinema` : "World Cinema";
}

// Core Concept Clue
function buildConceptCandidates(movieData) {
  const keywords = movieData.keywords?.keywords || [];
  if (keywords.length > 0) {
    const candidates = [];
    for (let i = 0; i < keywords.length; i += 3) {
      const chunk = keywords.slice(i, i + 3).map((k) => k.name).join(", ");
      candidates.push(`Closely related to: ${chunk}`);
      if (candidates.length >= 3) break; 
    }
    return candidates;
  }
  return ["No specific concept tags on record for this film."];
}

// Plot Clue (Masks the title)
function buildPlotCandidates(movieData) {
  const candidates = [];
  const title = movieData.title || "";
  const overview = movieData.overview || "";

  if (overview) {
    const safeOverview = overview.replace(new RegExp(title, "gi"), "_____");
    const sentences = safeOverview
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 150);
    
    candidates.push(...sentences);
  }

  if (candidates.length === 0) {
    candidates.push("No plot summary available.");
  }
  return candidates;
}

// NEW: Fetch iTunes Song Clue with Playable Audio
async function fetchSongCandidates(movieTitle) {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(movieTitle + " soundtrack")}&entity=song&limit=15`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const uniqueSongs = [];
      const seen = new Set();
      
      for (const track of data.results) {
        // Only include if we haven't seen it AND it has an audio preview
        if (track.previewUrl && !seen.has(track.trackName)) {
          seen.add(track.trackName);
          uniqueSongs.push({
            name: `Features the track: "${track.trackName}"`,
            previewUrl: track.previewUrl // We send the playable audio link!
          });
        }
      }
      
      if (uniqueSongs.length > 0) {
        return uniqueSongs.slice(0, 4); // Allow up to 4 to shuffle through
      }
    }
  } catch (e) {
    console.error("iTunes fetch failed:", e.message);
  }
  // Fallback if nothing is found (previewUrl is null)
  return [{ name: "No soundtrack data available for this film.", previewUrl: null }];
}

const BACKDROP_LANGUAGES = "en,hi,te,ta,ml,kn,ko,ja,zh,fr,es,null";

// 4. Generate all Hints
router.get("/:id/hints", async (req, res) => {
  const { id } = req.params;

  try {
    const url = `${TMDB_BASE}/movie/${id}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits,images,keywords&include_image_language=${BACKDROP_LANGUAGES}`;
    const tmdbResponse = await fetch(url);
    const data = await tmdbResponse.json();

    if (data.success === false) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const industry = guessIndustry(data);
    const conceptCandidates = buildConceptCandidates(data);
    const plotCandidates = buildPlotCandidates(data);
    const songCandidates = await fetchSongCandidates(data.title);

    const castCandidates = (data.credits?.cast || [])
      .slice(0, 15)
      .filter((actor) => actor.profile_path)
      .slice(0, 8)
      .map((actor) => ({
        name: actor.name,
        photo: `https://image.tmdb.org/t/p/w200${actor.profile_path}`,
      }));

    const backdropCandidates = (data.images?.backdrops || [])
      .slice(0, 10)
      .map((img) => `https://image.tmdb.org/t/p/w500${img.file_path}`);

    res.json({
      industry,
      conceptCandidates,
      plotCandidates,
      castCandidates,
      backdropCandidates,
      songCandidates,
    });
  } catch (err) {
    console.error("TMDB hint generation failed:", err.message);
    res.status(500).json({ error: "Hint generation failed" });
  }
});

module.exports = router;