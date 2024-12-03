import { Buffer } from "node:buffer";
import chalk from "npm:chalk";

export async function getClientAuth(
  id: string,
  secret: string
): Promise<string | null> {
  console.log(chalk.cyan("Getting client auth from Spotify..."));

  const url = "https://accounts.spotify.com/api/token";
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/x-www-form-urlencoded",
    Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    return data.access_token;
  } catch (error) {
    console.error("Error getting auth token:", error);
    throw error;
  }
}
