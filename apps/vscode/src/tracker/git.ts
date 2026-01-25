import { execSync } from "child_process";
import * as vscode from "vscode";

/**
 * Get the current git branch name
 */
export const getCurrentBranch = (workspaceFolder?: string): string | null => {
  try {
    const cwd =
      workspaceFolder ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) return null;

    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    return branch || null;
  } catch {
    return null;
  }
};

/**
 * Get the project name from git remote or folder name
 */
export const getProjectName = (workspaceFolder?: string): string => {
  const folder =
    workspaceFolder ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!folder) {
    return "unknown";
  }

  try {
    // Try to get project name from git remote origin
    const remoteUrl = execSync("git config --get remote.origin.url", {
      cwd: folder,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    if (remoteUrl) {
      // Extract repo name from URL
      // Handles: git@github.com:user/repo.git or https://github.com/user/repo.git
      const match = /[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/.exec(remoteUrl);
      if (match?.[2]) {
        return match[2];
      }
    }
  } catch {
    // Git not available or not a git repo
  }

  // Fallback to folder name
  const folderName = folder.split(/[/\\]/).pop();
  return folderName ?? "unknown";
};

/**
 * Check if the current workspace is a git repository
 */
export const isGitRepo = (workspaceFolder?: string): boolean => {
  try {
    const cwd =
      workspaceFolder ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) return false;

    execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    return true;
  } catch {
    return false;
  }
};

/**
 * Commit info for tracking
 */
export interface CommitInfo {
  sha: string; // Short SHA (7 chars)
  message: string; // Full commit message (subject + body)
  filesChanged: number;
  insertions: number;
  deletions: number;
}

/**
 * Get the latest commit info from HEAD
 * Returns null if not a git repo or no commits
 */
export const getLatestCommit = (
  workspaceFolder?: string,
): CommitInfo | null => {
  try {
    const cwd =
      workspaceFolder ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) return null;

    // Get short SHA
    const sha = execSync("git rev-parse --short HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    // Get full commit message (including body)
    const message = execSync("git log -1 --format=%B", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    // Get diff stats from the latest commit
    // Format: "5 files changed, 120 insertions(+), 45 deletions(-)"
    const statsOutput = execSync("git diff --shortstat HEAD~1 HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;

    if (statsOutput) {
      const filesMatch = /(\d+) file/.exec(statsOutput);
      const insertionsMatch = /(\d+) insertion/.exec(statsOutput);
      const deletionsMatch = /(\d+) deletion/.exec(statsOutput);

      filesChanged = filesMatch ? parseInt(filesMatch[1] ?? "0", 10) : 0;
      insertions = insertionsMatch
        ? parseInt(insertionsMatch[1] ?? "0", 10)
        : 0;
      deletions = deletionsMatch ? parseInt(deletionsMatch[1] ?? "0", 10) : 0;
    }

    return { sha, message, filesChanged, insertions, deletions };
  } catch {
    return null;
  }
};

/**
 * Get just the current HEAD SHA (for detecting new commits)
 */
export const getHeadSha = (workspaceFolder?: string): string | null => {
  try {
    const cwd =
      workspaceFolder ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!cwd) return null;

    return execSync("git rev-parse --short HEAD", {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
};
