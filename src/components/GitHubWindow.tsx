import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import PopupWindow from "./PopupWindow";
import "./GitHubWindow.css";

const REPOSITORY_URL = "https://github.com/sujalchan/symphony";
const API_URL = "https://api.github.com/repos/sujalchan/symphony";

type Repository = {
  default_branch: string;
  description: string | null;
  forks_count: number;
  full_name: string;
  html_url: string;
  language: string | null;
  open_issues_count: number;
  stargazers_count: number;
  watchers_count: number;
};

function launchUrl(url: string) {
  if (isTauri()) void openUrl(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}

export default function GitHubWindow({ onClose, onMinimizeStart, onMinimize, minimized, uiScale, popupGlide }: {
  onClose: () => void;
  onMinimizeStart: () => void;
  onMinimize: () => void;
  minimized: boolean;
  uiScale: number;
  popupGlide: number;
}) {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [readme, setReadme] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    void Promise.all([
      fetch(API_URL, { headers, signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.json() as Promise<Repository>;
      }),
      fetch(`${API_URL}/readme`, {
        headers: { ...headers, Accept: "application/vnd.github.html+json" },
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
        return response.text();
      }),
    ]).then(([details, renderedReadme]) => {
      setRepository(details);
      setReadme(renderedReadme);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not load GitHub");
    });

    return () => controller.abort();
  }, []);

  function openReadmeLink(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;
    event.preventDefault();
    const branch = repository?.default_branch ?? "main";
    launchUrl(new URL(anchor.getAttribute("href")!, `${REPOSITORY_URL}/blob/${branch}/`).href);
  }

  return (
    <PopupWindow title="Project GitHub" windowId="github" onClose={onClose} onMinimizeStart={onMinimizeStart}
      onMinimize={onMinimize} minimized={minimized} uiScale={uiScale}
      popupGlide={popupGlide}
      initialSize={{ width: 780, height: 560 }} minSize={{ width: 520, height: 380 }} bodyClassName="github-popup-body">
      <div className="github-browser-bar">
        <span className="github-browser-lock" aria-hidden="true">●</span>
        <span className="github-browser-address">github.com/sujalchan/symphony</span>
        <button type="button" onClick={() => launchUrl(REPOSITORY_URL)}>Open externally</button>
      </div>

      <div className="github-view">
        {!repository && !error && <div className="github-status" role="status">Loading repository…</div>}
        {error && <div className="github-status github-error" role="alert">
          <strong>GitHub could not be loaded.</strong>
          <span>{error}</span>
          <button type="button" onClick={() => launchUrl(REPOSITORY_URL)}>Open in browser</button>
        </div>}
        {repository && <>
          <header className="github-repo-header">
            <div className="github-repo-name"><span aria-hidden="true">◉</span> {repository.full_name}</div>
            <button type="button" onClick={() => launchUrl(repository.html_url)}>View on GitHub ↗</button>
          </header>
          <nav className="github-repo-tabs" aria-label="Repository sections">
            <span className="is-active">Code</span>
            <span>Issues <b>{repository.open_issues_count}</b></span>
          </nav>
          <section className="github-repo-summary">
            <p>{repository.description || "Symphony project repository"}</p>
            <div>
              {repository.language && <span>{repository.language}</span>}
              <span>★ {repository.stargazers_count}</span>
              <span>⑂ {repository.forks_count}</span>
              <span>◉ {repository.watchers_count}</span>
            </div>
          </section>
          <section className="github-readme">
            <div className="github-readme-title">README.md</div>
            <article onClick={openReadmeLink} dangerouslySetInnerHTML={{ __html: readme }} />
          </section>
        </>}
      </div>
    </PopupWindow>
  );
}
