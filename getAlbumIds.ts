import cmpstr from "npm:cmpstr";
import chalk from "npm:chalk";

type AlbumResponse = {
  name: string;
  id: string;
  artists: { name: string }[];
};

type Album = {
  pos: number;
  title: string;
};

type AlbumMatch = {
  pos: number;
  title: string;
  id: string;
  log: string;
};

async function getAlbumId(
  query: string,
  token: string
): Promise<{ id: string; log: string } | null> {
  const url = `https://api.spotify.com/v1/search/`;
  const params = new URLSearchParams({
    q: query,
    limit: "50",
    type: "album",
    market: "US",
  });
  const headers = new Headers({
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  });

  try {
    const res = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    const albums: { title: string; id: string }[] = data.albums.items.map(
      (album: AlbumResponse) => {
        return {
          title:
            album.artists[0].name.toUpperCase() +
            " – " +
            album.name.toUpperCase(),
          id: album.id,
        };
      }
    );

    const match = findBestMatch(albums, query);

    // Fancy log
    const distance = Math.round(
      cmpstr.diceCoefficient(query, match.title) * 100
    );

    const distanceStr =
      distance === 100
        ? chalk.green(`${distance}%`)
        : distance > 80
        ? chalk.yellow(`${distance}%`)
        : chalk.red(`${distance}%`);

    const log = `(${distanceStr}) ${chalk.green(query)} - ${chalk.blue(
      match.title
    )}`;
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
  albums: Album[],
  token: string
): Promise<AlbumMatch[] | null> {
  const promises = albums.map((album) => {
    return getAlbumId(album.title, token).then((response) => {
      if (!response) return null;
      return {
        pos: album.pos,
        title: album.title,
        id: response.id,
        log: response.log,
      };
    });
  });

  const results = await Promise.all(promises);
  const filteredResults = results.filter(
    (result): result is AlbumMatch => result !== null
  );

  filteredResults.forEach(({ pos, log }) =>
    console.log(`#${pos}: ${pos < 10 ? " " : ""}${log}`)
  );

  return filteredResults.sort((a, b) => b.pos - a.pos);
}

function findBestMatch(
  albums: { title: string; id: string }[],
  query: string
): { title: string; id: string } {
  const bestMatch = cmpstr.diceClosest(
    query,
    albums.map((album) => album.title)
  );
  return albums.filter((album) => album.title === bestMatch)[0];
}
