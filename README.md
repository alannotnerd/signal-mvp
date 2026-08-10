# Signal MVP — Pre-TGE Due Diligence Dashboard

Mock website demonstrating the Pre-TGE DD dashboard from SIG-014.

## Structure

```
signal-mvp/
├── index.html          # Project list (triage view)
├── project.html?id=X   # Project detail with R1-R5 sections
├── css/style.css       # Dark theme styles
├── js/stubs.js         # Mock API layer (static JSON)
├── js/components.js    # UI component renderers
└── stubs/              # Static mock data
    ├── projects.json        # All projects (list view)
    ├── project-chainx.json  # ChainX — CRITICAL risk
    └── project-lendfi.json  # LendFi — MEDIUM risk
```

## Running

Serve with any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Open http://localhost:8080

## Mock Data

All data is static JSON in `stubs/`. The `js/stubs.js` layer simulates API calls — replace with real endpoints when backend is ready.

### Adding a project

1. Add entry to `stubs/projects.json`
2. Create `stubs/project-{id}.json` with full detail
3. Link works automatically via `project.html?id={id}`

## Projects

| Project | Symbol | Category | Risk |
|---------|--------|----------|------|
| ChainX | CHX | L1 | 🔴 CRITICAL |
| DeFiMax | DFM | DeFi | 🟠 HIGH |
| NFTverse | NFTV | Gaming | 🟠 HIGH |
| LendFi | LFI | DeFi | 🟡 MEDIUM |
| StableVault | SVLT | Stablecoin | 🟡 MEDIUM |
| GameVerse | GVR | Gaming | 🟢 LOW |
| MetaFlow | MFL | Infrastructure | 🟢 LOW |
| PrivacyPay | PRV | Privacy | 🔵 PENDING |
