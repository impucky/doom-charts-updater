import "jsr:@std/dotenv/load";
import scrapeAlbums from "./scrapeAlbums.ts";
import getClientAuth from "./clientAuth.ts";
import getUserAuth from "./userAuth.ts";
import getAlbumIds from "./getAlbumIds.ts";
import getAllTracks from "./getAlbumTracks.ts";
import clearPlaylist from "./clearPlaylist.ts";
import addTracks from "./addTracks.ts";
import updateDetails from "./updateDetails.ts";
import updateCover from "./updateCover.ts";
import chalk from "npm:chalk";

const doomChartsUrl: string = Deno.args[0];
const playlistId = "6zVF0xeVebktWpbW0wI6JL";

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
const albumTitles = await scrapeAlbums(doomChartsUrl);
if (!albumTitles) exit("Failed to get the album names.");

await confirm(chalk.magenta("Proceed with these albums?"));

// Auth
const clientToken = await getClientAuth(SPOTIFY_ID, SPOTIFY_SECRET);
if (!clientToken) exit("Failed to get a client token.");

// Get Ids
let albumResults = await getAlbumIds(albumTitles, clientToken);
if (!albumResults) exit("Couldn't retrieve album ids");

// Filter bad matches
const excludePrompt = await prompt(
  chalk.magenta("Choose matches to exclude: (comma separated #)")
);

if (excludePrompt) {
  // Parse input positions
  const toExclude: number[] = excludePrompt.split(",").map(Number);
  // Format description to "Missing: #1 ... | #2..."
  descriptionString = `Missing: ${toExclude
    .map((pos, index) => {
      const title = albumTitles.filter((album) => album.pos === pos)[0].title;
      return `#${pos} ${title} ${index === toExclude.length - 1 ? "" : "| "}`;
    })
    .join("")}`;
  // Filter albums
  albumResults = albumResults.filter((a) => !toExclude.includes(a.pos));
}

// Get all tracks
const trackUris = await getAllTracks(
  albumResults.map((a) => a.id),
  clientToken
);
if (!trackUris) exit("Couldn't get the album tracks");

// Login
const userTokens = await getUserAuth(SPOTIFY_ID, SPOTIFY_SECRET);
if (!userTokens) exit("Failed to get user tokens.");

const { accessToken } = userTokens;

await confirm(chalk.red(`Proceed with nuking playlist ${playlistId} ?`));

await clearPlaylist(playlistId, accessToken);
await addTracks(playlistId, accessToken, trackUris);
await updateDetails(playlistId, accessToken, descriptionString);
await updateCover(
  playlistId,
  accessToken,
  albumResults[albumResults.length - 1].id as string
);

console.log(chalk.green("All done 🤘"));
