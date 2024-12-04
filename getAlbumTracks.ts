async function getAlbumTracks(
  id: string,
  token: string
): Promise<string[] | null> {
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/albums/${id}/tracks?limit=50`,
      {
        method: "GET",
        headers,
      }
    );

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    const trackUris = data.items.map((track: { uri: string }) => track.uri);

    return trackUris;
  } catch (error) {
    console.error(`Error getting tracks for ${id}`, error);
    throw error;
  }
}

export default async function getAllTracks(
  ids: string[],
  token: string
): Promise<string[] | null> {
  // Pass index to keep the albums in order
  const promises = ids.map((id, index) =>
    getAlbumTracks(id, token).then((uris) => ({
      uris,
      index,
    }))
  );

  const results = await Promise.all(promises);

  results.sort((a, b) => a.index - b.index);

  return results
    .map(({ uris }) => uris)
    .filter((id) => id !== null)
    .flat();
}
