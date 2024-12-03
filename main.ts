import "jsr:@std/dotenv/load";
import scrapeAlbums from "./scrapeAlbums.ts";
import { getClientAuth } from "./spotifyAuth.ts";
import getAlbumIds from "./getAlbumIds.ts";
import chalk from "npm:chalk";

const doomChartsUrl: string = Deno.args[0];

const SPOTIFY_ID = Deno.env.get("SPOTIFY_ID");
const SPOTIFY_SECRET = Deno.env.get("SPOTIFY_SECRET");

if (!SPOTIFY_ID || !SPOTIFY_SECRET) {
  console.error("Spotify client ID or secret is missing.");
  Deno.exit(1);
}

const albumNames = await scrapeAlbums(doomChartsUrl);

if (!albumNames) {
  console.error("Failed to get the album names.");
  Deno.exit(1);
}

await confirm(chalk.magenta("Proceed with these albums?"));

const clientToken = await getClientAuth(SPOTIFY_ID, SPOTIFY_SECRET);

if (!clientToken) {
  console.error("Failed to get a client token.");
  Deno.exit(1);
}

const albumIds = await getAlbumIds(albumNames, clientToken);

await confirm(chalk.magenta("Proceed with these matches?"));

/** Todo next:
 * - Prompt to manually exclude bad matches
 * - Keep track of those as missing for playlist description
 * - Grab tracks for every album
 * - Spotify account auth
 * - Get all tracks in playlist
 * - Delete tracks
 * - Add new tracks
 * */
