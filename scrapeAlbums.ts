import * as cheerio from "npm:cheerio";
import chalk from "npm:chalk";

export default async function scrapeAlbums(
  url: string
): Promise<string[] | null> {
  console.log("Getting the album names from Doom Charts...");
  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Black magic
    const content = $(".entry-content").text();
    const pattern = /^\d{1,2}\. ([^–]+ – [^\/]+)/;
    const albums = content
      .split("\n")
      .map((line) => {
        const match = line.match(pattern);
        return match ? match[1].trim() : null;
      })
      .filter(Boolean) as string[];

    // Log
    albums.forEach((a, i) => {
      console.log(`${i + 1}: ${chalk.green(a)}`);
    });

    if (albums.length !== 40)
      console.log(
        `Missing ${40 - albums.length} album${
          40 - albums.length > 1 ? "s" : ""
        }`
      );

    return albums;
  } catch (err) {
    console.error(err);
    return null;
  }
}
