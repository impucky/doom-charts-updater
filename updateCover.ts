import chalk from "npm:chalk";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  uint8Array.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

async function getCoverUrl(token: string, albumId: string): Promise<null> {
  const headers = new Headers({
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  });

  try {
    const res = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      method: "GET",
      headers,
    });

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    return data.images[1].url;
  } catch (error) {
    console.error("Error while getting album cover", error);
    throw error;
  }
}

async function downloadCover(url: string): Promise<string> {
  try {
    // Fetch the image from the URL
    console.log(chalk.cyan("Downloading cover..."));
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch cover: ${res.statusText}`);
    }

    // Convert the response body into an ArrayBuffer
    const arrayBuffer = await res.arrayBuffer();

    // Convert the ArrayBuffer to a Base64 string
    const base64String = arrayBufferToBase64(arrayBuffer);

    return base64String;
  } catch (error) {
    console.error("Error while downloading cover:", error);
    throw error;
  }
}

export default async function updateCover(
  id: string,
  token: string,
  albumId: string
): Promise<null> {
  const imgUrl = await getCoverUrl(token, albumId);
  if (!imgUrl) return null;
  const img = await downloadCover(imgUrl);
  if (!imgUrl) return null;

  const headers = new Headers({
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
    "Content-Type": "application/json",
  });

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/playlists/${id}/images`,
      {
        method: "PUT",
        headers,
        body: img,
      }
    );

    if (!res.ok) {
      console.error(`Error: ${res.status} - ${res.statusText}`);
      return null;
    }

    console.log(chalk.green("Updated cover"));
    return null;
  } catch (error) {
    console.error("Error while updating album cover", error);
    throw error;
  }
}
