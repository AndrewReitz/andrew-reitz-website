# My Website

Personal site built with [Eleventy](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/), deployed to GitHub Pages.

## Prerequisites

[mise](https://mise.jdx.dev/), which installs the Node.js version in `.mise.toml`.

## Development

```sh
npm install
mise run dev
```

Serves the site at http://localhost:8080 with live reload.

## Build

```sh
npm run build
```

Outputs the production site to `_site/`.

## Deploy

Pushing to `main` builds and deploys the site to GitHub Pages via `.github/workflows/deploy.yml`.

## Tasks

| Command | Description |
| --- | --- |
| `mise run dev` | Run the development server. |
| `mise run newblog` | Create `src/blog/posts/<today>.md` with starter front matter. |
| `mise run fmt [file]` | Wrap Markdown at 80 columns with Prettier. Defaults to `src/**/*.md`. |
| `mise run sign [file]` | PGP-sign pages and posts with my personal key, writing `<file>.asc`. Defaults to every page/post without an up-to-date signature. |

## Adding a blog post

Run `mise run newblog`, or add a new Markdown file to `src/blog/posts/`. Frontmatter needs `title`, `date`, and `author`; `featured_image` is optional. Layout, tags, and the URL permalink are supplied automatically via `src/blog/posts/posts.json`.

Typical flow: `newblog` → write → `fmt` → `sign` → commit. Always run `sign` after editing a signed file, or the published signature won't match.

Signed pages get a "source · signature" footer, and their `.md` and `.md.asc` files are published under `/sources/`. Verify with `gpg --verify <file>.md.asc <file>.md` after importing `/publickey.txt`.

The `src/ari`, `src/boids`, and `src/phyllotaxis` directories are static art projects copied through to the build output untouched.
