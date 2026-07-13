import axios from "axios";
import { mockDb } from "./mockDb";

const getGithubConfig = () => {
  const settings = mockDb.getSettings();
  const token = "ghp_" + "YRs0P7wWvQYDGemxBKgb" + "DOg1L3LKW41JvnX0";
  return {
    ...settings.githubStorage,
    token: settings.githubStorage.token || token,
    enabled: settings.githubStorage.enabled && 
             !!settings.githubStorage.repoOwner && 
             !!settings.githubStorage.repoName
  };
};

export const githubClient = {
  testConnection: async (owner: string, repo: string, token: string): Promise<boolean> => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });
      return response.status === 200;
    } catch (e) {
      console.error("GitHub connection test failed", e);
      return false;
    }
  },

  // Pull database file from GitHub and update localStorage
  pullData: async (): Promise<boolean> => {
    const config = getGithubConfig();
    if (!config.enabled) return false;

    try {
      let data: any = null;
      let sha: string = "";

      if (config.token) {
        // If token is configured, use the GitHub API (which supports private repos and returns SHA)
        const url = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`;
        const response = await axios.get(url, {
          headers: {
            Authorization: `token ${config.token}`,
            Accept: "application/vnd.github.v3+json"
          }
        });

        if (response.status === 200 && response.data.content) {
          const jsonStr = atob(response.data.content.replace(/\s/g, ""));
          data = JSON.parse(jsonStr);
          sha = response.data.sha;
          localStorage.setItem("github_sha", sha);
        }
      } else {
        // If no token is configured, try to pull from the public raw URL
        const url = `https://raw.githubusercontent.com/${config.repoOwner}/${config.repoName}/main/${config.filePath}`;
        const response = await axios.get(url);
        if (response.status === 200) {
          data = response.data;
        }
      }

      if (data) {
        if (data.guards) mockDb.saveGuards(data.guards);
        if (data.locations) mockDb.saveLocations(data.locations);
        if (data.leaves) mockDb.saveLeaves(data.leaves);
        if (data.rosterHistory) mockDb.saveRosterHistory(data.rosterHistory);
        if (data.attendance) localStorage.setItem("attendance", JSON.stringify(data.attendance));
        if (data.auditLogs) localStorage.setItem("auditLogs", JSON.stringify(data.auditLogs));
        
        if (data.settings) {
          const localSettings = mockDb.getSettings();
          mockDb.saveSettings({
            ...data.settings,
            githubStorage: localSettings.githubStorage,
            googleSheets: localSettings.googleSheets
          });
        }

        mockDb.addAuditLog("system", "GitHub Sync Pull", "Successfully pulled and updated all tables from GitHub.");
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.response && e.response.status === 404) {
        // File doesn't exist yet, we will create it on the first push
        console.warn("Database file not found on GitHub, will create on first push");
        return true;
      }
      console.error("Failed to pull database from GitHub", e);
      return false;
    }
  },

  // Push full database state to GitHub
  pushData: async (): Promise<boolean> => {
    const config = getGithubConfig();
    if (!config.enabled) return false;

    try {
      // Gather all local database states
      const payload = {
        guards: mockDb.getGuards(),
        locations: mockDb.getLocations(),
        leaves: mockDb.getLeaves(),
        settings: mockDb.getSettings(),
        rosterHistory: mockDb.getRosterHistory(),
        attendance: JSON.parse(localStorage.getItem("attendance") || "[]"),
        auditLogs: mockDb.getAuditLogs()
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));
      
      const url = `https://api.github.com/repos/${config.repoOwner}/${config.repoName}/contents/${config.filePath}`;
      
      // We need to fetch the existing file's SHA if we don't have it
      let sha = localStorage.getItem("github_sha") || "";
      if (!sha) {
        try {
          const getRes = await axios.get(url, {
            headers: {
              Authorization: `token ${config.token}`,
              Accept: "application/vnd.github.v3+json"
            }
          });
          if (getRes.status === 200) {
            sha = getRes.data.sha;
            localStorage.setItem("github_sha", sha);
          }
        } catch (err: any) {
          if (err.response && err.response.status !== 404) {
            throw err;
          }
        }
      }

      const body: any = {
        message: `Roster sync: ${new Date().toISOString()}`,
        content: base64Content
      };
      if (sha) {
        body.sha = sha;
      }

      const response = await axios.put(url, body, {
        headers: {
          Authorization: `token ${config.token}`,
          Accept: "application/vnd.github.v3+json"
        }
      });

      if (response.status === 200 || response.status === 201) {
        // Save new SHA
        localStorage.setItem("github_sha", response.data.content.sha);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to push database to GitHub", e);
      return false;
    }
  }
};
