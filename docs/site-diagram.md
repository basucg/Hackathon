# Construction Site Diagram

The diagram below captures a compact construction site arrangement highlighting circulation, safety, and operational zones. Modify node labels or positions as needed to match the specifics of your project.

```mermaid
flowchart TB
    direction TB

    subgraph NorthBuffer["North Buffer & Safety"]
        FenceN[Safety Fence]
        Signage[Warning Signage]
    end

    Gate[Security Gate]
    Road[Access Road]
    Parking[Worker Parking]
    Office[Site Office & Control Room]
    Break[Break Area]

    subgraph CoreZone["Core Work Zone"]
        Building[Main Structure Under Construction]
        Crane[Tower Crane]
        Staging[Material Staging]
        Rebar[Rebar Yard]
        Prefab[Prefab Component Zone]
    end

    subgraph Services["Utilities & Support"]
        Fuel[Fuel / Generator]
        Wash[Wheel Wash & Water Point]
        Waste[Waste & Recycling Skip]
    end

    Gate --> Road --> Parking
    Parking --> Office
    Office --> Break
    Road --> Staging
    Road --> Prefab
    Parking --> Wash

    Crane --> Building
    Staging --> Building
    Rebar --> Building
    Prefab --> Building
    Fuel --> Services
    Waste --> Services

    FenceN --> CoreZone
```

## Key Notes

- `Core Work Zone` is centered to minimize crane swing over public areas.
- `Services` block remains downwind to keep fumes/noise away from the office.
- Security gate and wheel wash align with the access road to control vehicle flow.
