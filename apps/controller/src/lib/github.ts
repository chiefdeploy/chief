import { APP_DOMAIN } from "./constants";
import { App } from "octokit";

export async function get_access_token(code: string) {
  return await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json"
    },
    body: JSON.stringify({
      client_id: "Iv23lil3BngV250mo0sV",
      client_secret: "ede539fd99c6633250454a73cd88ca2170efc8a6",
      code,
      redirect_uri: `${APP_DOMAIN}/api/github/callback`
    })
  })
    .then((res) => res.json())
    .then((data: any) => data.access_token)
    .catch((err) => null);
}

export async function get_user_info(access_token: string) {
  return await fetch("https://api.github.com/user", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      Authorization: `token ${access_token}`
    }
  })
    .then((res) => res.json())
    .then((data: any) => data)
    .catch((err) => null);
}

/**
 * Get all repositories for the Github App.
 * @param APP_ID Github App ID
 * @param PRIVATE_KEY Github App Private Key
 * @returns Count and list of repositories.
 */
export async function get_github_repositories(
  APP_ID: string,
  PRIVATE_KEY: string
) {
  try {
    const app = new App({
      appId: APP_ID,
      privateKey: PRIVATE_KEY
    });

    let repos: any[] = [];

    await app.eachRepository(async (repo) => {
      repos.push(repo.repository);
    });

    return {
      count: repos.length,
      repositories: repos
    };
  } catch (error) {
    console.log(error);
    return {
      count: 0,
      repositories: []
    };
  }
}
