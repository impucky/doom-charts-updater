import chalk from "npm:chalk";

export default async function updateDetails(
  id: string,
  token: string,
  description: string
): Promise<null> {
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const name = `Doom Charts - ${date.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })}`;

  try {
    const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name,
        description,
      }),
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    console.log(chalk.green("Updated details"));
    return null;
  } catch (error) {
    console.error(`Error while updating playlist details`, error);
    throw error;
  }
}
