# State Machine

Screen flow: **Login → Slot Selection → Character Creation → Game Hub → (Combat later)**.  
Post-Combat Summary and Recovery are Phase 1C.

---

## Pure state diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> SlotSelection : authenticated
    SlotSelection --> CharacterCreation : New Game (empty slot)
    SlotSelection --> GameHub : Continue (occupied slot)
    CharacterCreation --> GameHub : character created
    GameHub --> GameHub : view status / enemies (Phase 1A)
    GameHub --> Combat : start encounter (Phase 1C)
    Combat --> PostCombatSummary : fight resolved (Phase 1C)
    PostCombatSummary --> Recovery : Phase 1C
    Recovery --> GameHub : Phase 1C
```

---

## API-driven state diagram (Mermaid)

Shows which API calls drive transitions.

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> SlotSelection : POST /api/auth/login → GET /api/game/slots
    SlotSelection --> CharacterCreation : user picks empty slot → GET /create?slotIndex=#
    SlotSelection --> GameHub : user picks occupied slot → GET /game?slotIndex=#
    CharacterCreation --> GameHub : POST /api/game/character/create → GET /api/game/status, GET /api/game/enemies
    GameHub --> GameHub : GET /api/game/status, GET /api/game/enemies (read-only Phase 1A)
    GameHub --> Combat : (Phase 1C) encounter start
    Combat --> PostCombatSummary : (Phase 1C) fight end
    PostCombatSummary --> Recovery : (Phase 1C)
    Recovery --> GameHub : (Phase 1C)
```
