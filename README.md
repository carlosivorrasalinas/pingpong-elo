# Ping Pong & Spikeball Elo App

A full-stack web application for tracking friendly but competitive Ping Pong and Spikeball matches with Elo ratings, real-time match updates, leaderboards, match history, and tournament support.

The project started as a simple Ping Pong ranking app, that i have used to play with my friends and evolved into a multi-sport competition platform with support for 1v1 Ping Pong, 2v2 Spikeball, Swiss-style tournaments, knockout brackets, player trophies, and automatic Elo calculations.

---

## Preview

> Recommended screenshot: main dashboard showing the player profile, current Elo, and navigation tabs.

![App dashboard screenshot](docs/screenshots/dashboard.png)

> Recommended screenshot: Spikeball match creation screen.

![Spikeball match creation screenshot](docs/screenshots/spikeball-new-match.png)

> Recommended screenshot: tournament screen showing an active tournament match.

![Tournament screen screenshot](docs/screenshots/tournament-active.png)

---

## Features

### Multi-Sport Support

The application supports two different game modes:

- **Ping Pong**
  - 1v1 matches.
  - Match requests must be accepted by the opponent.
  - Both players must confirm the same winner before the result is final.
  - Elo is updated after both confirmations match.

- **Spikeball**
  - 2v2 matches.
  - The creator selects a teammate and two opponents.
  - Matches start immediately without requiring acceptance.
  - Any participant can submit the final score.
  - Elo is calculated using the average Elo of each team.

---

## Elo Rating System

The app uses an Elo-based ranking system to keep competition fair and dynamic.

### Ping Pong

Ping Pong uses a standard 1v1 Elo calculation.

- Each player has an Elo rating.
- The expected result is calculated based on the difference between both players’ ratings.
- Beating a higher-rated player gives more points.
- Losing to a lower-rated player costs more points.

### Spikeball

Spikeball uses a team-based Elo calculation.

- Each team’s Elo is calculated using the average Elo of both players.
- The winning team gains points.
- The losing team loses points.
- Each player on the same team receives the same Elo change.
- Spikeball uses a higher K-factor because matches are played less frequently and rankings should move faster.

---

## Real-Time Match Updates

The app uses Supabase Realtime so players do not need to refresh manually.

Real-time updates include:

- Incoming Ping Pong match requests.
- Accepted or rejected matches.
- Active match status.
- Match confirmations.
- Spikeball result submissions.
- Tournament round progression.
- Tournament match completion.
- Trophy updates.

---

## Tournament System

The app includes a tournament mode available in both Ping Pong and Spikeball.

> Recommended screenshot: tournament creation form.

![Tournament creation screenshot](docs/screenshots/tournament-create.png)

### Tournament Types

The app supports two formats:

#### Classic Format

A knockout-style tournament.

- Players or teams are randomly paired.
- Winners advance.
- Losers are eliminated.
- If the number of participants does not fit a perfect bracket, random participants receive a bye.
- The tournament continues until a winner is decided.

#### Swiss + Playoffs Format

A Swiss-inspired format where players or teams compete against opponents with similar records.

- Participants qualify for playoffs after reaching a target number of wins.
- Participants are eliminated after reaching a target number of losses.
- Players with similar records are paired together.
- Once enough participants qualify, the tournament moves to playoffs.
- Playoffs use a classic knockout format.

Example with 8 participants:

- 2 wins = qualify for playoffs.
- 2 losses = eliminated.
- 4 participants qualify.
- Playoffs are played as semifinals and final.

---

## Tournament Features

The tournament system includes:

- Ping Pong individual tournaments.
- Spikeball team tournaments.
- Classic knockout format.
- Swiss + playoffs format.
- Optional Elo impact.
- Automatic round generation.
- Automatic progression when all matches are completed.
- Tournament withdrawal.
- Tournament cancellation by the creator if no match has been played.
- Tournament history.
- Trophy tracking.

---

## Trophies

Players can earn trophies based on tournament results.

- 🥇 Gold medal for first place.
- 🥈 Silver medal for second place.
- 🥉 Bronze medal for third place.

Trophies are displayed in the player profile.

> Recommended screenshot: player profile showing trophies.

![Trophies screenshot](docs/screenshots/trophies.png)

---

## Tournament History

The app includes a shared tournament history visible to all users.

Each completed tournament displays:

- Sport icon.
- Tournament name.
- Winner.
- Second place.
- Third place.
- Number of participants.
- Format.
- Completion date.

Tournament names are generated based on the number of participants:

- **MiniTournament**: 4 participants or fewer.
- **Tournament**: 5 to 8 participants.
- **SuperTournament**: 9 or more participants.

> Recommended screenshot: tournament history page.

![Tournament history screenshot](docs/screenshots/tournament-history.png)

---

## Tech Stack

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **CSS-in-JS styling**
- **Responsive design**

### Backend

- **Supabase**
- **PostgreSQL**
- **Supabase Auth**
- **Supabase Realtime**
- **PostgreSQL functions / RPC**
- **Row Level Security policies**

### Deployment

- **GitHub Pages**

---

## Architecture Overview

The project uses React on the frontend and Supabase as the backend service.

The frontend is responsible for:

- Rendering the user interface.
- Managing active tabs and sport modes.
- Calling Supabase RPC functions.
- Subscribing to real-time database changes.
- Displaying rankings, histories, matches, and tournaments.

Supabase is responsible for:

- Authentication.
- Player profiles.
- Elo persistence.
- Match storage.
- Tournament state.
- Tournament progression.
- Secure result confirmation.
- Realtime events.

---

## Main Data Models

The app is built around several core concepts:

### Profiles

Stores user information and Ping Pong statistics.

### Spikeball Player Stats

Stores independent Spikeball Elo and statistics.

### Ping Pong Matches

Stores 1v1 matches, match requests, confirmations, winners, and Elo changes.

### Spikeball Matches

Stores 2v2 matches, team scores, winners, and team-based Elo changes.

### Tournaments

Stores tournament metadata, sport type, format, status, Elo configuration, and final podium.

### Tournament Participants

Stores either individual players for Ping Pong or pairs for Spikeball.

### Tournament Matches

Stores tournament rounds, matchups, winners, scores, and progression status.

### Tournament Trophies

Stores gold, silver, and bronze medals earned by players.

---

## Getting Started

### Prerequisites

You need:

- Node.js
- npm
- A Supabase project
- A GitHub account if deploying to GitHub Pages

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env.local` file in the root of the project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The Supabase client reads these variables to connect the frontend to the backend.

---

## Running Locally

Start the development server:

```bash
npm run dev
```

Then open the local URL shown in the terminal.

---

## Building for Production

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Deployment

The app is deployed using GitHub Pages.

To deploy:

```bash
npm run deploy
```

If you are using PowerShell on Windows and script execution is blocked, use:

```powershell
npm.cmd run deploy
```

---

## Suggested Screenshots to Add

To make this project stand out to recruiters and interviewers, add screenshots in the `docs/screenshots/` folder.

Recommended screenshots:

1. **Login screen**
   - Shows the authentication flow.

2. **Player profile**
   - Shows Elo, wins, losses, matches played, and trophies.

3. **Ping Pong match request**
   - Shows the 1v1 challenge flow.

4. **Ping Pong active match**
   - Shows winner confirmation and Elo preview.

5. **Spikeball match creation**
   - Shows teammate and opponent selection.

6. **Spikeball result submission**
   - Shows team score input.

7. **Leaderboard**
   - Shows official and unclassified rankings.

8. **Tournament creation**
   - Shows sport, format, participants, and Elo options.

9. **Active tournament**
   - Shows current match, waiting state, or pending matches.

10. **Tournament history**
    - Shows completed tournaments and podium results.

---

## What I Learned

This project helped me practice and improve several important full-stack development skills:

- Designing a real-time multiplayer-style application.
- Building a ranking system based on Elo.
- Handling different game modes with different business rules.
- Managing complex tournament state.
- Using PostgreSQL functions to keep sensitive logic on the backend.
- Working with Supabase Auth, Row Level Security, and Realtime.
- Structuring a React app with TypeScript types for complex data flows.
- Deploying a production frontend with GitHub Pages.

---

## Engineering Highlights

Some of the most interesting technical parts of the project are:

- A dual-sport architecture with separate ranking systems.
- Team-based Elo calculation for Spikeball.
- Real-time synchronization across multiple users.
- Backend-controlled match confirmation logic.
- Automatic tournament round generation.
- Swiss-style qualification and elimination logic.
- Tournament withdrawal handling without affecting Elo.
- Trophy generation after tournament completion.
- A responsive interface designed for quick mobile use during live matches.

---

## Future Improvements

Possible future improvements include:

- Prevent repeated matchups in Swiss tournaments whenever possible.
- Add tournament brackets visualization.
- Add admin tools for correcting mistakes.
- Add player avatars.
- Add detailed Elo history charts.
- Add match score history for Ping Pong.
- Add dark mode.
- Add automated tests for tournament progression logic.
- Improve mobile animations and transitions.
- Add public shareable tournament pages.

---

## Project Status

The application is functional and actively evolving.

Current core functionality includes:

- Authentication.
- Ping Pong matches.
- Spikeball matches.
- Independent leaderboards.
- Match history.
- Real-time updates.
- Tournament creation.
- Tournament progression.
- Tournament history.
- Trophy tracking.

---

## Author

Built by **Carlos Ivorra Salinas** as a personal full-stack project focused on real-time competition tracking, ranking systems, and practical product design.

---

## License

This project is intended as a personal portfolio project. Add a license here if you plan to make it open source.
