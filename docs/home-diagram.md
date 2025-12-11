# Simple Home Layout

The diagram below sketches a compact single-story home suited for conceptual discussions. Edit node names or connections to reflect your actual layout.

```mermaid
flowchart TD
    direction TB

    subgraph Public["Public Zone"]
        Living[(Living Room)]
        Dining[(Dining)]
        Kitchen[(Kitchen)]
    end

    subgraph Private["Private Zone"]
        Bed1[(Bedroom 1)]
        Bed2[(Bedroom 2)]
        Bath[(Bathroom)]
        Closet[(Storage / Laundry)]
    end

    subgraph Service["Service / Outdoor"]
        Porch[(Front Porch)]
        Patio[(Rear Patio)]
        Garage[(Garage / Carport)]
    end

    Porch --> Living
    Living --> Dining --> Kitchen
    Living --> Hallway
    Hallway --> Bed1
    Hallway --> Bed2
    Hallway --> Bath
    Kitchen --> Patio
    Garage --> Kitchen
    Closet --> Bath
```

## Notes

- Public rooms align on the south facade (porch → living → dining) for natural light.
- Bedrooms cluster off a short hallway to minimize circulation space.
- Service spaces (garage, patio) connect near the kitchen for easy egress and deliveries.
- Adjust the grouping or add nodes for offices, flex rooms, or multi-story stairs as needed.
