import chalk from "npm:chalk";

export default async function clearPlaylist(
  id: string,
  token: string
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${id}/tracks?uris=`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to clear playlist: ${response.statusText}`);
    }

    console.log(chalk.green("Nuked!"));
  } catch (error) {
    console.error("Error clearing playlist:", error);
  }
}
