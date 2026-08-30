/**
 * Catalogue Utility Helpers & Asset URL Resolver for Peblo Viewer
 */

export const resolveAssetUrl = (assetPath) => {
  if (!assetPath) return null;
  // If already absolute URL (http:// or https://), return as-is
  if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
    return assetPath;
  }
  // If VITE_API_URL is configured (e.g. http://localhost:8000), resolve against it.
  // Otherwise, use relative path (e.g. /assets/...) which is proxied by Vite in dev and served by Nginx in prod.
  const apiOrigin = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? import.meta.env.VITE_API_URL : '';
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return apiOrigin ? `${apiOrigin.replace(/\/$/, '')}${cleanPath}` : cleanPath;
};

export const getAllShows = (catalog) => {
  if (!catalog) return [];
  const map = new Map();
  Object.values(catalog).forEach((shows) => {
    if (Array.isArray(shows)) {
      shows.forEach((show) => {
        if (show && show.show_id && !map.has(show.show_id)) {
          map.set(show.show_id, show);
        }
      });
    }
  });
  return Array.from(map.values());
};

export const findShowBySlugOrId = (catalog, identifier) => {
  if (!catalog || !identifier) return null;
  for (const shows of Object.values(catalog)) {
    if (Array.isArray(shows)) {
      const match = shows.find(
        (s) => s.slug === identifier || s.show_id === identifier
      );
      if (match) return match;
    }
  }
  return null;
};

export const findEpisodeByContentGroup = (catalog, contentGroup) => {
  if (!catalog || !contentGroup) return null;
  for (const shows of Object.values(catalog)) {
    if (Array.isArray(shows)) {
      for (const show of shows) {
        // Check trailers
        if (show.trailers) {
          const trailer = show.trailers.find(
            (t) => t.content_group === contentGroup
          );
          if (trailer) {
            return {
              episode: trailer,
              show,
              season: { season_number: 0, title: 'Trailers' },
              isTrailer: true,
            };
          }
        }
        // Check seasons
        if (show.seasons) {
          for (const season of show.seasons) {
            if (season.episodes) {
              const epIndex = season.episodes.findIndex(
                (e) => e.content_group === contentGroup
              );
              if (epIndex !== -1) {
                return {
                  episode: season.episodes[epIndex],
                  episodeIndex: epIndex,
                  show,
                  season,
                  isTrailer: false,
                };
              }
            }
          }
        }
      }
    }
  }
  return null;
};

export const getShowPoster = (show) => {
  if (!show) return null;
  const allEpisodes = [
    ...(show.trailers || []),
    ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
  ];
  for (const ep of allEpisodes) {
    if (ep.artwork?.poster) return resolveAssetUrl(ep.artwork.poster);
  }
  return null;
};

export const getShowBanner = (show) => {
  if (!show) return null;
  const allEpisodes = [
    ...(show.trailers || []),
    ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
  ];
  for (const ep of allEpisodes) {
    if (ep.artwork?.banner) return resolveAssetUrl(ep.artwork.banner);
  }
  return null;
};

export const getShowThumbnail = (show) => {
  if (!show) return null;
  const allEpisodes = [
    ...(show.trailers || []),
    ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
  ];
  for (const ep of allEpisodes) {
    if (ep.artwork?.thumbnail) return resolveAssetUrl(ep.artwork.thumbnail);
  }
  return null;
};

export const getShowLanguages = (show) => {
  if (!show) return [];
  const langs = new Set();
  const allEpisodes = [
    ...(show.trailers || []),
    ...(show.seasons?.flatMap((s) => s.episodes || []) || []),
  ];
  allEpisodes.forEach((ep) => {
    (ep.languages || []).forEach((l) => langs.add(l));
  });
  return Array.from(langs).sort();
};

export const getShowTotalEpisodes = (show) => {
  if (!show) return 0;
  return (
    show.seasons?.reduce(
      (acc, season) => acc + (season.episodes?.length || 0),
      0
    ) || 0
  );
};

export const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
};
