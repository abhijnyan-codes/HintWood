import { useState, useEffect } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const HINT_DEFS = [
  { id: "industry", label: "Industry", icon: "theaters" },
  { id: "concept", label: "Core Concept", icon: "lightbulb" },
  { id: "actor", label: "Actor Riddle", icon: "theater_comedy" },
  { id: "plot", label: "Plot Clue", icon: "psychology" },
  { id: "scene", label: "Movie Scene", icon: "image" },
  { id: "song", label: "Famous Song", icon: "music_note" },
];

export default function MovieSearchScreen({ onStartRound }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);

  const [autoData, setAutoData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [conceptIndex, setConceptIndex] = useState(0);
  const [actorIndex, setActorIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [plotIndex, setPlotIndex] = useState(0);
  const [songIndex, setSongIndex] = useState(0);

  const [hintState, setHintState] = useState(() =>
    Object.fromEntries(
      HINT_DEFS.map((h) => [
        h.id,
        { mode: "auto", manualText: "", manualPerson: null, manualImage: null },
      ])
    )
  );

  const [personQuery, setPersonQuery] = useState("");
  const [personResults, setPersonResults] = useState([]);
  const [isSearchingPerson, setIsSearchingPerson] = useState(false);

  const handleMovieSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearchingMovies(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/movies/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setSearchResults(data.results?.slice(0, 5) || []);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setIsSearchingMovies(false);
    }
  };

  const handlePersonSearch = async () => {
    if (personQuery.trim().length < 2) return;
    setIsSearchingPerson(true);
    try {
      const res = await fetch(
        `${SERVER_URL}/api/movies/people/search?q=${encodeURIComponent(personQuery)}`
      );
      const data = await res.json();
      setPersonResults(data.results || []);
    } catch (err) {
      console.error("Person search failed:", err);
    } finally {
      setIsSearchingPerson(false);
    }
  };

  useEffect(() => {
    if (!selectedFilm) return;
    async function fetchHints() {
      setIsGenerating(true);
      setGenError(null);
      setAutoData(null);
      try {
        const res = await fetch(
          `${SERVER_URL}/api/movies/${selectedFilm.id}/hints`
        );
        if (!res.ok) throw new Error("Failed to generate hints");
        const data = await res.json();
        setAutoData(data);
        
        setConceptIndex(0);
        setActorIndex(0);
        setSceneIndex(0);
        setPlotIndex(0);
        setSongIndex(0);
      } catch (err) {
        console.error(err);
        setGenError("Could not generate hints for this film.");
      } finally {
        setIsGenerating(false);
      }
    }
    fetchHints();
  }, [selectedFilm]);

  function handleSelectFilm(film) {
    setSelectedFilm(film);
    setSearchQuery("");
    setSearchResults([]);
  }

  function setHintMode(id, mode) {
    setHintState((prev) => ({ ...prev, [id]: { ...prev[id], mode } }));
  }

  function setHintManualText(id, text) {
    setHintState((prev) => ({ ...prev, [id]: { ...prev[id], manualText: text } }));
  }

  function setHintManualPerson(id, person) {
    setHintState((prev) => ({ ...prev, [id]: { ...prev[id], manualPerson: person } }));
    setPersonQuery("");
    setPersonResults([]);
  }

  function setHintManualImage(id, url) {
    setHintState((prev) => ({ ...prev, [id]: { ...prev[id], manualImage: url } }));
  }

  function handleStartRound() {
    const concept = autoData?.conceptCandidates?.[conceptIndex];
    const actor = autoData?.castCandidates?.[actorIndex];
    const scene = autoData?.backdropCandidates?.[sceneIndex];
    const plot = autoData?.plotCandidates?.[plotIndex];
    const song = autoData?.songCandidates?.[songIndex]; // This is now an object!

    const hints = HINT_DEFS.map((def) => {
      const state = hintState[def.id];

      if (def.id === "actor") {
        if (state.mode === "manual") {
          return { id: def.id, label: def.label, type: "actor", text: state.manualPerson?.name || "", imageUrl: state.manualPerson?.photo };
        }
        return { id: def.id, label: def.label, type: "actor", text: actor?.name, imageUrl: actor?.photo };
      }

      if (def.id === "scene") {
        if (state.mode === "manual") {
          return { id: def.id, label: def.label, type: "image", imageUrl: state.manualImage };
        }
        return { id: def.id, label: def.label, type: "image", imageUrl: scene };
      }

      if (state.mode === "manual") {
        return { id: def.id, label: def.label, type: "text", text: state.manualText };
      }

      switch (def.id) {
        case "industry":
          return { id: def.id, label: def.label, type: "text", text: autoData?.industry };
        case "concept":
          return { id: def.id, label: def.label, type: "text", text: concept };
        case "plot":
          return { id: def.id, label: def.label, type: "text", text: plot };
        case "song":
          // Include BOTH the name and the audio URL so the guessers can play it!
          return { id: def.id, label: def.label, type: "audio", text: song?.name, audioUrl: song?.previewUrl };
        default:
          return null;
      }
    }).filter(Boolean);

    onStartRound({ film: selectedFilm, hints });
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col relative font-body-md antialiased">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2asA7h9As5E0Nucbsx4SdpzHzkG018VQyflv2RcFty6v0No7_lGAPGCXxmsqRm3mfn4yYas0trZFKp5O3hakQ0kT65-_xGZddEKLiJWyO5fIezHk-ZKU85uM0ZYYXrIKTqv5lpmktMKtaQtWpPV3HH_ITk_rLUccP6gwR6nfOPJsz_dAvyZVRo2Qqg_sr7iFED2WhpXqo4Mw99yYgC8w-yhYWfmaWWgTyzyZRubF-VHLUmBQOfvJL2A"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none select-none z-0"
        style={{ objectPosition: "center 80%" }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(circle, rgba(20,20,15,0) 40%, rgba(20,20,15,0.8) 100%)" }}
      ></div>

      <header className="hidden md:flex w-full top-0 sticky border-b border-outline-variant z-50" style={{ backgroundColor: "#14140f" }}>
        <div className="max-w-[1280px] mx-auto px-16 w-full flex items-center justify-between h-20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>movie</span>
            <span className="font-headline-lg text-headline-lg text-primary uppercase tracking-widest font-bold">HintWood</span>
          </div>
        </div>
      </header>

      <header className="md:hidden w-full flex items-center justify-center h-20 border-b border-outline-variant/30 sticky top-0 z-50" style={{ backgroundColor: "#14140f" }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">movie_filter</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-widest uppercase">HintWood</h1>
        </div>
      </header>

      <main className="flex-grow z-10 relative pt-8 md:pt-16 pb-32 px-5 md:px-0">
        <div className="max-w-3xl mx-auto md:px-6 lg:px-0">
          <div className="hidden md:block text-center mb-12">
            <h1 className="font-display-lg text-display-lg text-on-surface mb-4">Select a Film</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Search the archives to begin crafting hints for your next cinema noir puzzle round.
            </p>
          </div>

          {!selectedFilm && (
            <div className="relative w-full max-w-2xl mx-auto mb-8 z-20 group">
              <div className="flex gap-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleMovieSearch()}
                    className="w-full bg-surface-container border border-outline text-on-surface rounded-md pl-12 pr-4 py-4 font-body-lg text-body-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-outline-variant"
                    placeholder="Type a movie title..."
                  />
                </div>
                <button 
                  onClick={handleMovieSearch}
                  disabled={isSearchingMovies}
                  className="px-8 py-4 bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-md font-label-md uppercase tracking-wider shrink-0 disabled:opacity-50"
                >
                  {isSearchingMovies ? "Searching..." : "Search"}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-outline-variant shadow-2xl z-30 rounded-md overflow-hidden" style={{ backgroundColor: "#20201a" }}>
                  <ul className="py-2">
                    {searchResults.map((film) => (
                      <li key={film.id} onClick={() => handleSelectFilm(film)} className="px-4 py-3 hover:bg-surface-container-high transition-colors cursor-pointer flex items-center gap-4">
                        <div className="w-10 h-14 bg-surface-variant shrink-0 border border-outline-variant relative overflow-hidden rounded-md">
                          {film.posterPath && <img src={film.posterPath} alt={film.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-body-lg text-body-lg text-on-surface">{film.title}</h4>
                          <span className="font-caption text-caption text-on-surface-variant">{film.year || "N/A"}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {selectedFilm && (
            <div className="max-w-2xl mx-auto mb-8 relative">
              <div className="flex items-stretch md:items-center gap-4 md:gap-6 p-0 md:p-4 border border-primary overflow-hidden rounded-md" style={{ backgroundColor: "#1c1c16" }}>
                <div className="w-24 h-32 md:h-36 bg-surface-variant shrink-0 border-r md:border border-outline-variant relative overflow-hidden rounded-md">
                  {selectedFilm.posterPath && <img src={selectedFilm.posterPath} alt={selectedFilm.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-grow py-4 md:py-2 px-2 md:px-0 flex flex-col justify-center">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{selectedFilm.title}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">{selectedFilm.year || "N/A"}</p>
                </div>
                <button onClick={() => { setSelectedFilm(null); setAutoData(null); }} className="absolute top-2 right-2 md:top-4 md:right-4 text-on-surface-variant hover:text-error transition-colors p-2">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
          )}

          {selectedFilm && (
            <div className="max-w-2xl mx-auto">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-6 md:border-b md:border-outline-variant pb-4">
                Hint Configuration
              </h3>

              {isGenerating && <p className="text-on-surface-variant italic mb-6">Generating hint suggestions…</p>}
              {genError && <p className="text-error mb-6">{genError}</p>}

              <div className="space-y-4 mb-10">
                {HINT_DEFS.map((def) => (
                  <HintSlot
                    key={def.id}
                    def={def}
                    state={hintState[def.id]}
                    onModeChange={(mode) => setHintMode(def.id, mode)}
                    onManualTextChange={(text) => setHintManualText(def.id, text)}
                    onManualPersonSelect={(person) => setHintManualPerson(def.id, person)}
                    onManualImageSelect={(url) => setHintManualImage(def.id, url)}
                    autoData={autoData}
                    conceptIndex={conceptIndex}
                    onRegenerateConcept={() => setConceptIndex((i) => (i + 1) % (autoData?.conceptCandidates?.length || 1))}
                    actorIndex={actorIndex}
                    onRegenerateActor={() => setActorIndex((i) => (i + 1) % (autoData?.castCandidates?.length || 1))}
                    sceneIndex={sceneIndex}
                    onRegenerateScene={() => setSceneIndex((i) => (i + 1) % (autoData?.backdropCandidates?.length || 1))}
                    plotIndex={plotIndex}
                    onRegeneratePlot={() => setPlotIndex((i) => (i + 1) % (autoData?.plotCandidates?.length || 1))}
                    songIndex={songIndex}
                    onRegenerateSong={() => setSongIndex((i) => (i + 1) % (autoData?.songCandidates?.length || 1))}
                    personQuery={personQuery}
                    setPersonQuery={setPersonQuery}
                    personResults={personResults}
                    onSearchPerson={handlePersonSearch}
                    isSearchingPerson={isSearchingPerson}
                  />
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={handleStartRound} className="px-8 py-3 bg-primary text-on-primary border border-primary hover:bg-primary-container transition-colors duration-300 font-label-md text-label-md uppercase tracking-wider rounded-md">
                  Start Round
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function HintSlot({
  def,
  state,
  onModeChange,
  onManualTextChange,
  onManualPersonSelect,
  onManualImageSelect,
  autoData,
  conceptIndex,
  onRegenerateConcept,
  actorIndex,
  onRegenerateActor,
  sceneIndex,
  onRegenerateScene,
  plotIndex,
  onRegeneratePlot,
  songIndex,
  onRegenerateSong,
  personQuery,
  setPersonQuery,
  personResults,
  onSearchPerson,
  isSearchingPerson,
}) {
  const concept = autoData?.conceptCandidates?.[conceptIndex];
  const actor = autoData?.castCandidates?.[actorIndex];
  const scene = autoData?.backdropCandidates?.[sceneIndex];
  const plot = autoData?.plotCandidates?.[plotIndex];
  const song = autoData?.songCandidates?.[songIndex]; // Will be an object containing 'name' and 'previewUrl'

  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState([]);
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [hasSearchedImage, setHasSearchedImage] = useState(false);

  const handleImageSearch = async () => {
    if (imageQuery.trim().length < 2) return;
    setIsSearchingImage(true);
    setHasSearchedImage(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/movies/images/search?q=${encodeURIComponent(imageQuery)}`);
      const data = await res.json();
      setImageResults(data.results || []);
    } catch (err) {
      console.error("Image search failed:", err);
    } finally {
      setIsSearchingImage(false);
    }
  };

  function renderAutoContent() {
    if (!autoData) return <span className="text-on-surface-variant italic">Loading…</span>;

    switch (def.id) {
      case "industry":
        return <span>{autoData.industry}</span>;
      case "concept":
        return (
          <div className="flex items-start gap-3">
            <span>{concept}</span>
            {autoData.conceptCandidates && autoData.conceptCandidates.length > 1 && (
              <button onClick={onRegenerateConcept} className="text-primary text-sm underline whitespace-nowrap">Shuffle</button>
            )}
          </div>
        );
      case "plot":
        return (
          <div className="flex items-start gap-3">
            <span>{plot}</span>
            {autoData.plotCandidates && autoData.plotCandidates.length > 1 && (
              <button onClick={onRegeneratePlot} className="text-primary text-sm underline whitespace-nowrap">Shuffle</button>
            )}
          </div>
        );
      case "song":
        return (
          <div className="flex items-start gap-3 w-full">
            <div className="flex flex-col gap-3 flex-grow">
              <span className={!song?.previewUrl ? "text-on-surface-variant italic" : ""}>
                {song?.name}
              </span>
              {/* This renders the actual playable audio player if iTunes gave us one! */}
              {song?.previewUrl && (
                <audio controls src={song.previewUrl} controlsList="nodownload" className="h-10 w-full max-w-[260px] rounded-full" />
              )}
            </div>
            {autoData.songCandidates && autoData.songCandidates.length > 1 && (
              <button onClick={onRegenerateSong} className="text-primary text-sm underline whitespace-nowrap mt-1">Shuffle</button>
            )}
          </div>
        );
      case "actor":
        return actor ? (
          <div className="flex items-center gap-4">
            <img src={actor.photo} alt="actor" className="w-14 h-14 rounded-full object-cover border border-outline-variant" />
            <span>{actor.name}</span>
            {autoData.castCandidates && autoData.castCandidates.length > 1 && (
              <button onClick={onRegenerateActor} className="ml-2 text-primary text-sm underline">Shuffle</button>
            )}
          </div>
        ) : (
          <span className="text-on-surface-variant italic">No cast photos available. Try Manual to pick anyone.</span>
        );
      case "scene":
        return scene ? (
          <div className="flex items-center gap-4">
            <img src={scene} alt="movie scene" className="w-28 h-16 object-cover rounded-md border border-outline-variant" />
            {autoData.backdropCandidates && autoData.backdropCandidates.length > 1 && (
              <button onClick={onRegenerateScene} className="text-primary text-sm underline">Shuffle</button>
            )}
          </div>
        ) : (
          <span className="text-on-surface-variant italic">No scene images available.</span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="border border-outline-variant p-4 md:p-5 rounded-md" style={{ backgroundColor: "#20201a" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[20px]">{def.icon}</span>
          <span className="font-caption text-caption uppercase tracking-widest text-on-surface-variant">{def.label}</span>
        </div>
        <div className="flex p-0.5 bg-surface-container-lowest border border-outline-variant/30 rounded-full text-xs">
          <button onClick={() => onModeChange("auto")} className={`px-3 py-1 rounded-full transition-colors ${state.mode === "auto" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"}`}>Auto</button>
          <button onClick={() => onModeChange("manual")} className={`px-3 py-1 rounded-full transition-colors ${state.mode === "manual" ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"}`}>Manual</button>
        </div>
      </div>

      {state.mode === "auto" ? (
        <div className="font-body-md text-body-md text-on-surface">{renderAutoContent()}</div>
      ) : def.id === "actor" ? (
        <div>
          {state.manualPerson ? (
            <div className="flex items-center gap-4">
              <img src={state.manualPerson.photo} alt="" className="w-14 h-14 rounded-full object-cover border border-outline-variant" />
              <span>{state.manualPerson.name}</span>
              <button onClick={() => onManualPersonSelect(null)} className="text-error text-sm underline">Change</button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearchPerson()}
                  placeholder="Search any actor, director…"
                  className="w-full bg-transparent border border-outline-variant rounded-md px-3 py-2 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={onSearchPerson}
                  disabled={isSearchingPerson}
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-md font-label-md uppercase tracking-wider text-sm shrink-0 disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {isSearchingPerson && <p className="text-xs text-primary mt-2 absolute right-0">Searching...</p>}
              
              {personResults.length > 0 && !isSearchingPerson && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-outline-variant rounded-md overflow-hidden z-30" style={{ backgroundColor: "#14140f" }}>
                  {personResults.map((p) => (
                    <div key={p.id} onClick={() => onManualPersonSelect(p)} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-high cursor-pointer">
                      <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs text-on-surface-variant ml-auto">{p.knownFor}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : def.id === "scene" ? (
        <div>
          {state.manualImage ? (
            <div className="flex items-center gap-4">
              <img src={state.manualImage} alt="selected scene" className="w-28 h-16 object-cover rounded-md border border-outline-variant" />
              <button onClick={() => onManualImageSelect(null)} className="text-error text-sm underline">Change Image</button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageQuery}
                  onChange={(e) => {
                    setImageQuery(e.target.value);
                    setHasSearchedImage(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleImageSearch()}
                  placeholder="Search for an object (e.g., train, sunflower)..."
                  className="w-full bg-transparent border border-outline-variant rounded-md px-3 py-2 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={handleImageSearch}
                  disabled={isSearchingImage}
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-md font-label-md uppercase tracking-wider text-sm shrink-0 disabled:opacity-50"
                >
                  Search
                </button>
              </div>

              {isSearchingImage && <p className="text-xs text-primary mt-2 absolute right-0">Searching Pexels...</p>}
              
              {!isSearchingImage && hasSearchedImage && imageResults.length === 0 && (
                <p className="text-xs text-error mt-2 absolute right-0">No images found or API failed.</p>
              )}
              
              {imageResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 p-2 border border-outline-variant rounded-md overflow-x-auto flex gap-2 z-30 shadow-2xl" style={{ backgroundColor: "#14140f" }}>
                  {imageResults.map((imgUrl, idx) => (
                    <img 
                      key={idx} 
                      src={imgUrl} 
                      alt="search result" 
                      onClick={() => {
                        onManualImageSelect(imgUrl);
                        setImageQuery("");
                        setImageResults([]);
                        setHasSearchedImage(false);
                      }}
                      className="w-24 h-16 object-cover rounded-sm cursor-pointer hover:border-2 hover:border-primary shrink-0 transition-all" 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <input
          type="text"
          value={state.manualText}
          onChange={(e) => onManualTextChange(e.target.value)}
          placeholder={`Write your own ${def.label.toLowerCase()} hint…`}
          className="w-full bg-transparent border border-outline-variant rounded-md px-3 py-2 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary"
        />
      )}
    </div>
  );
}