import cmpstr from "npm:cmpstr";
import chalk from "npm:chalk";

type AlbumResponse = {
  name: string;
  id: string;
  artists: { name: string }[];
};

type Album = {
  name: string;
  id: string;
};

async function getAlbumId(
  query: string,
  token: string
): Promise<{ id: string | null; log: string }> {
  // Building URL
  const url = `https://api.spotify.com/v1/search/`;
  const params = new URLSearchParams({
    q: query,
    limit: "5",
    type: "album",
    market: "US",
  });
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  // Fetch
  try {
    const res = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return { id: null, log: `Error getting ${query}` };
    }

    const data = await res.json();

    const albums = data.albums.items.map((album: AlbumResponse): Album => {
      return {
        name:
          album.artists[0].name.toUpperCase() +
          " – " +
          album.name.toUpperCase(),
        id: album.id,
      };
    });

    const match: Album = findBestMatch(albums, query);

    // Fancy log
    const distance = Math.round(
      cmpstr.diceCoefficient(query, match.name) * 100
    );

    const distanceStr =
      distance === 100
        ? chalk.yellow(`${distance}%`)
        : distance > 80
        ? chalk.green(`${distance}%`)
        : chalk.red(`${distance}%`);

    const log = `${chalk.green(query)} - ${chalk.blue(
      match.name
    )} (${distanceStr})`;
    // End fancy log

    return {
      id: match.id,
      log,
    };
  } catch (error) {
    console.error(`Error getting album id for ${query}`, error);
    throw error;
  }
}

export default async function getAlbumIds(
  albums: string[],
  token: string
): Promise<string[] | null> {
  // Pass index to keep the albums in order
  const promises = albums.map((name, index) =>
    getAlbumId(name, token).then(({ id, log }) => ({
      id,
      log,
      index,
    }))
  );

  const results = await Promise.all(promises);

  results.sort((a, b) => a.index - b.index);
  results.forEach(({ index, log }) => console.log(`${index + 1}: ${log}`));

  return results.map(({ id }) => id).filter((id) => id !== null);
}

function findBestMatch(
  albums: Album[],
  query: string
): { name: string; id: string } {
  const bestMatch = cmpstr.diceClosest(
    query,
    albums.map(({ name }: { name: string }) => name)
  );
  return albums.filter(({ name }: { name: string }) => name === bestMatch)[0];
}
