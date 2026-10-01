# Skin Preview & Purchase Flow

```mermaid
flowchart TD
  A[Skins] --> B[Select Skin]
  B --> C[8-12s Preview]
  C --> D{Access}
  D -- Free/Owned --> E[Apply]
  D -- Premium --> F[Paywall]
  F --> G{Purchase}
  G -- Success --> E
  G -- Cancel --> A
```
