# State Machine

Screen flow: **Login → Slot Selection → Character Creation → Game Hub → (Combat later)**.  
Post-Combat Summary and Recovery

---

## Pure state diagram (Mermaid)

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> SlotSelection : authenticated
    SlotSelection --> CharacterCreation : New Game (empty slot)
    SlotSelection --> GameHub : Continue (occupied slot)
    CharacterCreation --> GameHub : character created
    GameHub --> GameHub : view status / enemies
    GameHub --> Combat : start encounter
    Combat --> PostCombatSummary : fight resolved
    PostCombatSummary --> Recovery : recovery
    Recovery --> GameHub
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
    GameHub --> GameHub : GET /api/game/status, GET /api/game/enemies
    GameHub --> Combat : encounter start
    Combat --> PostCombatSummary : fight end
    PostCombatSummary --> Recovery : recovery
    Recovery --> GameHub 
```
