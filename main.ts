import "jsr:@std/dotenv/load";
import scrapeAlbums from "./scrapeAlbums.ts";
import { getClientAuth } from "./spotifyAuth.ts";
import getAlbumIds from "./getAlbumIds.ts";
import chalk from "npm:chalk";

const doomChartsUrl: string = Deno.args[0];

const SPOTIFY_ID = Deno.env.get("SPOTIFY_ID");
const SPOTIFY_SECRET = Deno.env.get("SPOTIFY_SECRET");

let descriptionString = "";

function exit(message: string): never {
  console.error(message);
  Deno.exit(1);
}

if (!SPOTIFY_ID || !SPOTIFY_SECRET)
  exit("Spotify client ID or secret is missing.");

// Get names
const albumNames = await scrapeAlbums(doomChartsUrl);
if (!albumNames) exit("Failed to get the album names.");

await confirm(chalk.magenta("Proceed with these albums?"));

// Auth
const clientToken = await getClientAuth(SPOTIFY_ID, SPOTIFY_SECRET);
if (!clientToken) exit("Failed to get a client token.");

// Get Ids
let albumIds = await getAlbumIds(albumNames, clientToken);
if (!albumIds) exit("Couldn't retrieve album ids");

// Filter bad matches
const excludePrompt = await prompt(
  chalk.magenta("Choose matches to exclude: (comma separated)")
);
if (excludePrompt) {
  // Parse prompt
  const toExclude: number[] = excludePrompt.split(",").map(Number);
  // Format description to "Missing: #1 ... | #2..."
  descriptionString = `Missing: ${toExclude
    .map(
      (excludeIndex, index) =>
        `#${excludeIndex} ${albumNames[excludeIndex - 1]} ${
          index === toExclude.length - 1 ? "" : "| "
        }`
    )
    .join("")}`;
  // Filter ids
  albumIds = albumIds.filter((_, i) => !toExclude.includes(i + 1));
}

/** Todo next:
 * - Grab tracks for every album
 * - Spotify account auth
 * - Get all tracks in playlist
 * - Delete tracks
 * - Add new tracks
 * */
