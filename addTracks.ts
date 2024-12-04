import chalk from "npm:chalk";

export default async function addTracks(
  id: string,
  token: string,
  uris: string[]
): Promise<void> {
  function chunkArray(arr: string[]) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += 100) {
      chunks.push(arr.slice(i, i + 100));
    }
    return chunks;
  }

  const chunks = chunkArray(uris);
  try {
    for (const uriBatch of chunks) {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${id}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: uriBatch,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add tracks: ${response.statusText}`);
      }
    }

    console.log(chalk.green("Added tracks"));
  } catch (error) {
    console.error("Error adding tracks:", error);
  }
}
