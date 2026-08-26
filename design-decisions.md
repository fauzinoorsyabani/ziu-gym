# Ziu Gym — Design & Data Decisions

## Experience direction

Ziu Gym uses a **dark performance-lab** direction: charcoal surfaces, off-white typography, and acid-lime accents. The public home page is an editorial, asymmetric landing experience focused on strength, conditioning, and disciplined progression. The protected management area uses the template's dashboard shell, adapted with the same visual language to keep member administration clear and calm.

## Navigation

| Surface | Primary actions |
| --- | --- |
| Landing page | Explore programs, view membership options, enter the member dashboard |
| Member dashboard | Review membership health, search members, add a member, edit a member, update member status |

## Route and responsive structure

| Route | Desktop composition | Mobile composition |
| --- | --- | --- |
| `/` | Fixed compact top navigation, editorial two-column hero, horizontal program cards, two-column benefits and membership sections, then a dashboard call-to-action. | Collapsible navigation, single-column hero, vertically stacked cards and actions, with headline and primary action shown before supporting content. |
| `/dashboard` | Persistent left navigation, high-level metrics, a toolbar, then a wide member table with row actions. | Sheet-style navigation, stacked metrics, compact toolbar, and horizontally scrollable table with retained edit action. |

The landing page is public. The dashboard is protected at the layout layer through the existing authenticated dashboard component, while member procedures enforce administrator access at the server layer.

## Member domain model

| Field | Purpose |
| --- | --- |
| `name` | Member's display name |
| `email` | Contact email, stored uniquely |
| `phone` | Contact number |
| `plan` | Membership tier: Flex, Unlimited, or Coach |
| `status` | Membership lifecycle: active, paused, or expired |
| `joinedAt` | Date the member joined Ziu Gym |
| `expiresAt` | Plan expiry date used for operational follow-up |

All member-management operations require an authenticated administrator. The UI will show current member counts from the live database rather than fabricated testimonial, rating, or review content.
