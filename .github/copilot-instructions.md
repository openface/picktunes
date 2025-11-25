<!-- Copilot / AI agent guidance for the picktunes repo -->
# picktunes — AI Contributor Quick Guide

Purpose: help AI coding agents quickly understand this repository's architecture, conventions, and editing rules so changes are safe and high-value.

- **Big picture**: This is a small Sinatra web app (single `app.rb`) using `Sequel` + `mysql2` for persistence, and a simple client built with jQuery + Materialize in `public/` and `views/`.

- **Runtime & entrypoints**:
  - App entry: `app.rb` (also `config.ru` for Rack). Start locally with `bundle install; bundle exec rackup -p 4567` or `ruby app.rb` for quick dev.
  - Static assets live under `public/` (CSS, JS, images, sounds). Views are ERB under `views/`.

- **Major routes / data flows (see `app.rb`)**:
  - `GET '/'` → `views/home.erb` (landing form: user + genre).
  - `POST '/'` → sets `session[:user]` and `session[:genre]`, then redirects to `/play`.
  - `GET '/play'` → `views/play.erb` (client fetches songs and runs the game UI).
  - `GET '/songs.json'` → backend calls iTunes RSS JSON: `https://itunes.apple.com/.../topsongs/limit=200/genre=#{session[:genre]}/json`, maps fields (`id`, `artist`, `name`, `image`, `audio`) and returns `songs.sample(40)`. Note: this endpoint requires an XHR request (it calls `halt unless request.xhr?`).
  - `POST '/endgame'` → creates a `Game` record in DB, returns `last_game_id` JSON.
  - `GET '/scores.json'` → returns grouped scores per `genre` with optional `filter=latest|all_time`. Also guarded by XHR.

- **Database / schema**:
  - Uses `Sequel` with `sinatra-sequel`. Default connection: `mysql2://root@localhost/PICKTUNE` unless `ENV['DATABASE_URL']` set.
  - The migration block in `app.rb` creates a `games` table with columns: `id`, `username`, `genre`, `score`, `created_at`.
  - Model: `class Game < Sequel::Model`.

- **Project-specific conventions & gotchas**:
  - Single-file Sinatra app: most logic lives in `app.rb`. Prefer small, local edits (add routes or helpers) rather than scattering logic across files.
  - JSON endpoints require XHR (`request.xhr?`). When writing tests or automation, set `X-Requested-With: XMLHttpRequest` header.
  - `session` stores `:user` and `:genre` and is used extensively; do not rename these keys without updating client-side code in `public/js` and the ERB views.
  - The iTunes audio URL is taken from the RSS feed entry `link` (the code uses `entry['link'].last['attributes']['href']`). If changing this extraction, validate audio playback in `views/play.erb`.
  - Username sanitization: `Rack::Utils.escape_html(params[:user])` is used on input; follow the same pattern for new text inputs.

- **Dependencies & changes**:
  - Add Ruby gems to `Gemfile` and run `bundle install` (or `bundle update`). Keep `sinatra`, `sinatra-contrib`, `sequel`, and `mysql2` in mind.
  - When adding JS/CSS, place files under `public/` and reference them in the layouts (`layout.erb`).

- **Development & debugging tips**:
  - Run with `bundle exec rackup -p 4567` and open `http://localhost:4567`.
  - To change DB connection locally, set PowerShell env var: `$env:DATABASE_URL = 'mysql2://user:pass@host/dbname'` before running.
  - The app uses the iTunes RSS feed for songs — offline testing may require stubbing `GET /songs.json` or saving sample JSON to `public/samples/` and changing the endpoint temporarily.

- **When modifying behavior, validate these areas**:
  - Session flow: ensure `POST '/'` still sets/clears `session` properly; the app redirects to `/play` and `play.erb` expects session values.
  - AJAX guards: JSON endpoints call `halt unless request.xhr?` — preserve or intentionally remove with tests.
  - DB writes: `POST /endgame` creates `Game` records; keep `created_at` formatting consistent when consuming in `scoreboard`.

- **Where to look for examples in the repo**:
  - `app.rb` — main logic, routes, migrations, and model usage.
  - `views/` — `home.erb`, `play.erb`, `scoreboard.erb` show how client and server interact.
  - `public/js/` and `public/css/` — client patterns (jQuery, templates).

If anything here is unclear or you want more/less detail (examples, code snippets, or a task-specific checklist), tell me which parts to expand and I will iterate.
