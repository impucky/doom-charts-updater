import chalk from "npm:chalk";
import { open } from "https://deno.land/x/open@v1.0.0/index.ts";

const baseUrl = "http://localhost:3000";
const redirectUri = "http://localhost:3000/callback";

export default function getUserAuth(
  id: string,
  secret: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
  // Start HTTP server
  console.log(chalk.cyan("Logging in..."));
  return new Promise((resolve) => {
    const controller = new AbortController();
    const options = {
      port: 3000,
      onListen: () => {},
      signal: controller.signal,
    };
    open("http://localhost:3000/login");
    Deno.serve(options, async (req) => {
      const pathname = new URL(req.url).pathname;

      if (pathname === "/login") {
        const params = new URLSearchParams({
          client_id: id,
          response_type: "code",
          redirect_uri: redirectUri,
          scope:
            "playlist-modify-public playlist-modify-private ugc-image-upload",
        });
        const authUrl = `https://accounts.spotify.com/authorize?${params}`;

        return new Response(null, {
          status: 302,
          headers: { location: authUrl },
        });
      } else if (pathname === "/callback") {
        const code = new URL(req.url).searchParams.get("code");

        if (!code)
          return new Response("Couldn't get request code", {
            status: 400,
          });

        try {
          const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: id,
                client_secret: secret,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.statusText}`);
          }

          const { access_token, refresh_token } = await response.json();

          if (!access_token || !refresh_token)
            return new Response("Failed to login", {
              status: 500,
            });

          resolve({ accessToken: access_token, refreshToken: refresh_token });

          setTimeout(() => controller.abort(), 500);

          return new Response(
            "Logged in successfully, you can close this tab",
            { status: 200 }
          );
        } catch (error) {
          console.error("Error while logging in", error);
          throw error;
        }
      } else {
        return new Response("Not found", {
          status: 404,
        });
      }
    });
  });
}
