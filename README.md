# Governance Board

Dashboard di governance per la gestione di Applications, Projects, Tasks, Milestones, Capacity planning e Todo personali. Refactor in Next.js 15 della SPA originale `governance-app.jsx` (preservata nella root come riferimento).

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript**
- **Server Components** per le letture, **Server Actions** per le mutation
- **Prisma 5** + **SQLite** (file `prisma/dev.db`)
- **Tailwind CSS 4** con palette dark personalizzata via `@theme`

## Setup rapido

Requisiti: Node.js >= 18.

```bash
# macOS / Linux
./start.sh

# Windows
start.bat
```

Lo script installa le dipendenze se mancano, crea/migra il database SQLite, esegue il seed iniziale e avvia il dev server su <http://localhost:3000>.

## Setup manuale

```bash
npm install
cp .env.example .env          # crea il file .env (DATABASE_URL già pronto per SQLite locale)
npx prisma migrate deploy     # applica le migrazioni
npx prisma db seed            # popola con i dati di esempio
npm run dev                   # http://localhost:3000
```

## Script npm

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il dev server Next.js |
| `npm run build` | Build di produzione |
| `npm run start` | Avvia il server di produzione (richiede `build`) |
| `npm run lint` | Lint con ESLint |
| `npm run db:migrate` | Crea/applica migrazioni Prisma in dev |
| `npm run db:seed` | Ripopola il DB col seed iniziale |
| `npm run db:studio` | Apre Prisma Studio (GUI sul DB) |

## Struttura

```
.
├─ prisma/
│  ├─ schema.prisma        # modelli Application, Owner, Project, Task, Milestone, Todo
│  ├─ seed.ts              # dati di esempio
│  └─ migrations/          # storia delle migrazioni (committata)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        # header + nav + footer
│  │  ├─ globals.css       # Tailwind + token palette dark
│  │  ├─ page.tsx          # Dashboard
│  │  ├─ apps/             # Applications
│  │  ├─ projects/         # Projects (kanban per status)
│  │  ├─ board/            # Tasks (kanban)
│  │  ├─ gantt/            # Gantt + Milestones
│  │  ├─ capacity/         # Capacity planning (ore/giorno)
│  │  ├─ todos/            # Todo personali
│  │  └─ api/
│  │     ├─ snapshot/      # GET = export JSON di tutto lo stato
│  │     └─ report/        # GET = report HTML stampabile
│  ├─ components/          # Header, Nav, viste, componenti dashboard
│  ├─ lib/                 # prisma client, utils, theme, types, queries, report HTML
│  └─ actions/             # Server Actions per CRUD entità e import snapshot
├─ governance-app.jsx       # SPA originale (riferimento, NON importata)
├─ start.sh / start.bat
└─ .env.example
```

## Funzionalità

- **Dashboard** con metriche, timeline scadenze (giorni/settimane/mesi), distribuzione task, progress dei progetti, prossime milestone e deadline.
- **Applications · Projects · Tasks · Milestones** con CRUD completo, drag-and-drop kanban e ricalcolo automatico del progress al cambio stato dei task.
- **Gantt** con barre per progetto, milestone come losanghe e linea "oggi".
- **Capacity planning** con ore budget/spese editabili inline e calcolo ore/giorno residue su giorni lavorativi.
- **Todo personali** kanban (To do / Completed) con drag-and-drop.
- **Save / Load** snapshot JSON dell'intero database (dal pulsante in header).
- **Print report** HTML stampabile in PDF.

## Reset del database

```bash
rm prisma/dev.db
npx prisma migrate deploy
npx prisma db seed
```

oppure più rapidamente:

```bash
npx prisma migrate reset
```

## Note

- L'`.env` non è committato (lo è `.env.example`). Crea il tuo file `.env` partendo dall'esempio.
- Il file `prisma/dev.db` è ignorato; viene rigenerato in locale dal seed.
- Le migrazioni sotto `prisma/migrations/` **vanno committate** perché rappresentano la storia dello schema.
