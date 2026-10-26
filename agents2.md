AGENTS.md — Frontend Development Guidelines
1. Core Principles
You are working on a React + TypeScript frontend application.

Follow these principles for every implementation:

Inspect the existing project structure, package.json, dependency versions, and coding conventions before writing code.
Follow the existing architecture unless there is a clear reason to change it.
Organize code by feature and responsibility.
Keep pages focused on composing components, not implementing entire features.
Separate UI, business logic, API communication, and state management.
Reuse existing components, hooks, utilities, types, and installed libraries.
Prefer simple, maintainable solutions over unnecessary abstractions.
Keep changes scoped to the requested task.
Do not create unnecessary files, folders, dependencies, or abstractions.
Do not refactor unrelated code without a clear reason.
Do not sacrifice readability merely to follow a rigid file-size or directory rule.
2. Project Architecture
Use feature-based architecture as the default.

Recommended structure:


text
src/
├── app/
│   ├── providers/
│   ├── router/
│   ├── layouts/
│   └── config/
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   └── chat/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       ├── types/
│       └── utils/
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
├── assets/
└── main.tsx
This is a reference structure, not a requirement to create every directory. Create folders only when they contain code that needs to be organized.

2.1 Feature Ownership
Business features must live inside src/features/<feature-name>/.
Feature-specific pages, components, hooks, API modules, types, schemas, and utilities belong to their respective feature.
Chat-specific code belongs in features/chat/, authentication-specific code in features/auth/, and so on.
Do not put feature-specific business logic into global folders.
Do not create a generic global API folder for every feature's endpoints.
Avoid arbitrary cross-feature imports into another feature's internal implementation.
2.2 Global vs. Feature-Specific Code
src/components/ui/: Domain-independent UI primitives such as buttons, inputs, and dialogs.
src/components/shared/: UI components genuinely shared by multiple features.
src/hooks/: Hooks shared across features.
src/lib/: Configured third-party clients and library integrations.
src/services/: Genuinely cross-feature infrastructure.
src/features/<feature-name>/: Feature-specific implementation.
Do not move a component to a global directory merely because it might be reusable in the future. Extract shared code when there is a concrete reuse requirement.

3. Component and Page Responsibilities
3.1 Pages
Pages should primarily compose feature components and manage page-level concerns.

A page may:

Compose the page layout from feature components.
Read route parameters and URL search parameters.
Coordinate page-level interactions.
Connect feature hooks to the UI.
Handle page-level loading, error, empty, and success states.
A page should not:

Contain the entire feature implementation.
Contain large amounts of business logic.
Define many unrelated components inline.
Implement HTTP requests directly.
Duplicate query, mutation, or cache management.
Mix complex validation, data transformation, and extensive JSX in one component.
3.2 Components
Each component should have a clear responsibility.

Extract meaningful UI sections into dedicated components when doing so improves readability, reuse, or testability.
Keep component props explicit and strongly typed.
Keep presentation components focused on rendering and user interaction.
Move reusable business logic into custom hooks.
Move pure data transformations into utility functions.
Define reusable components at module scope.
Avoid deeply nested component definitions inside pages.
Avoid duplicating substantial UI or business logic.
Do not extract every small JSX expression into a separate component. Small, cohesive components can remain in their parent when extraction adds no meaningful value.

A component does not need to be globally reusable to justify extraction. Feature-local components are encouraged.

3.3 Component Size and Complexity
Use these as review signals, not absolute limits:

Around 150–200 lines in a component: consider whether it should be split.
A large or deeply nested JSX block: consider extracting meaningful sections.
Multiple unrelated responsibilities: split the component regardless of line count.
Complex business logic mixed with rendering: extract appropriate hooks or utilities.
Do not split code solely to satisfy line counts.

4. File Naming Conventions
Follow the naming conventions already established in the repository.

If no convention exists, use the following rules.

4.1 Filenames
Use kebab-case for filenames.


File type	Naming example
Component	message-item.tsx
Page	chat-page.tsx
Custom hook	use-chat-messages.ts
API module	messages.api.ts
Query keys	chat.keys.ts
Validation schema	message.schema.ts
Constants	chat.constants.ts
Context	chat-context.tsx
Provider	chat-provider.tsx
Utility	format-message-time.ts
Test	message-item.test.tsx
Use descriptive filenames that communicate the file's responsibility.

Avoid vague names such as helpers.ts, common.ts, data.ts, or manager.ts when a more specific name is possible.

4.2 Code Identifiers
React components: PascalCase, e.g. MessageItem.
Types and interfaces: PascalCase, e.g. ChatMessage.
Functions and variables: camelCase, e.g. formatMessageTime.
Custom hooks: camelCase with a use prefix, e.g. useChatMessages.
Component prop types: <ComponentName>Props, e.g. MessageItemProps.
Constants: use UPPER_SNAKE_CASE for fixed configuration values when appropriate.
Do not use PascalCase for function or variable names.

4.3 File Granularity
Group related functions in the same file when they have the same responsibility.
Do not create one file per function or endpoint by default.
Do not create extra directories for individual API operations without a clear need.
Do not create barrel files such as index.ts in every folder automatically.
Create a new file when it improves responsibility boundaries, readability, navigation, or reuse.
Keep naming consistent across the same feature.
5. API Layer
All HTTP communication must be separated from pages and presentation components.

Feature-specific API modules belong in:

src/features/<feature-name>/api/

Example:


text
features/chat/
├── api/
│   ├── chat.api.ts
│   └── chat.keys.ts
├── components/
├── hooks/
├── pages/
└── types/
5.1 API Organization
Keep all feature-specific API modules inside the feature's api/ folder.
For small features, a single file such as chat.api.ts may contain all related API functions.
For larger features, group API functions into files by business domain or resource.
For example, use messages.api.ts and conversations.api.ts when those domains have enough independent logic.
Do not create one file per endpoint by default.
Do not split files merely to minimize line counts.
Keep API modules focused on HTTP communication and API-specific transformations.
5.2 API Implementation
Reuse the project's existing HTTP client, interceptors, authentication handling, and error conventions.
Do not call fetch, Axios, or another HTTP client directly inside page or presentation components.
Do not duplicate request logic across components.
Define request and response types when appropriate.
Keep UI state out of API modules.
Do not invent backend endpoints, request payloads, or response fields.
Inspect existing backend contracts and API implementations before adding new operations.
Do not create another HTTP client if the project already has one.
6. React Query / TanStack Query
Before implementing data fetching, inspect package.json, the installed version, and existing query configuration.

If TanStack Query is installed, use it for server-state management when appropriate.

Do not build a separate fetching and caching system when the installed query library already solves the problem.

6.1 Use TanStack Query for Server State
Use queries and mutations for appropriate operations such as:

Fetching and caching server data.
Loading and error state management.
Background refetching and synchronization.
Creating, updating, or deleting server resources.
Cache invalidation and targeted cache updates.
Pagination and infinite scrolling.
Avoid implementing query behavior using useEffect and useState when TanStack Query already provides the required functionality.

6.2 Query Keys
Keep query keys organized and consistent within each feature.

Example:


ts
// features/chat/api/chat.keys.ts

export const chatKeys = {
  all: ["chat"] as const,

  conversations: () => [...chatKeys.all, "conversations"] as const,

  messages: (conversationId: string) =>
    [...chatKeys.all, "messages", conversationId] as const,
};
Use the existing query-key convention if the project already has one.

6.3 Query Hooks
Place feature-specific query and mutation hooks in features/<feature-name>/hooks/ when that matches the project's conventions.

Example:


ts
// features/chat/hooks/use-chat-messages.ts

import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../api/chat.api";
import { chatKeys } from "../api/chat.keys";

export function useChatMessages(conversationId: string) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: () => getMessages(conversationId),
    enabled: Boolean(conversationId),
  });
}
Adapt the implementation to the actual API, types, query configuration, and installed library version.

6.4 Mutations and Cache Management
Keep request implementations in API modules.
Use mutation hooks to coordinate server mutations and related side effects.
Invalidate or update only the query keys affected by a mutation.
Use optimistic updates when the interaction benefits from them and rollback behavior is clear.
Avoid unnecessary refetches and broad cache invalidation.
Follow existing error handling and notification conventions.
6.5 Choose the Correct State Management
Do not use TanStack Query for every kind of state.

Server state: TanStack Query when available and appropriate.
Local UI state: useState or useReducer.
URL-shareable state: route parameters or search parameters when appropriate.
Form state: the existing form library, if installed.
Global client state: the existing state-management solution when necessary.
Avoid duplicating the same server data in multiple independent state stores without a clear reason.

7. Package.json and Dependencies
Before adding functionality, inspect package.json, the lockfile, and the existing implementation.

Prefer installed libraries when they meet the requirement.
Check existing solutions for routing, server state, forms, validation, UI, date handling, global state, and testing.
Reuse configured clients and shared abstractions.
Check installed versions before using library APIs.
Do not assume that a library is installed just because it is common in React projects.
Do not introduce a new dependency if an existing dependency already solves the problem adequately.
Explain why a new dependency is needed when existing solutions are insufficient.
Avoid unnecessary dependency and lockfile changes.
Do not reimplement complex library functionality without a clear reason.
8. Custom Hooks
Create custom hooks when they encapsulate meaningful business logic, reusable behavior, or complex state coordination.

Rules:

Follow the Rules of Hooks.
Name custom hooks with the use prefix.
Keep query and mutation behavior in appropriate hooks.
Keep HTTP request implementations in API modules.
Avoid hooks that merely wrap trivial expressions without adding value.
Do not combine unrelated responsibilities into one hook.
Keep dependencies and side effects explicit.
Use useMemo and useCallback when justified by performance, referential stability, or downstream memoization requirements.
9. TypeScript
Use explicit types for public component props, API contracts, and shared data structures.
Avoid any; prefer unknown with appropriate type narrowing when the type is not known.
Reuse existing domain types rather than defining duplicates.
Keep feature-specific types inside features/<feature-name>/types/ when they are shared across feature modules.
Use a local type definition when it is only relevant to one component and does not need to be shared.
Keep request and response types aligned with actual backend contracts.
Avoid unnecessary type assertions and non-null assertions.
Do not suppress TypeScript errors merely to make the build pass.
10. Forms and Validation
Inspect installed form and validation libraries before implementation.

Reuse the existing form library and schema validator when suitable.
Keep complex or shared validation schemas separate.
Avoid duplicating validation rules.
Separate form orchestration from field-level UI when the form is complex.
Handle validation errors, server errors, pending states, and successful submission.
Do not add another form library if the existing solution meets the requirements.
11. UI, Styling, and Accessibility
Follow the existing styling approach and design system.
Reuse existing buttons, inputs, dialogs, dropdowns, tables, and other shared UI primitives.
Do not implement a duplicate component when a suitable existing component is available.
Avoid mixing multiple styling systems without a clear reason.
Avoid large blocks of inline styles when the project uses a dedicated styling solution.
Use semantic HTML and appropriate ARIA attributes.
Ensure interactive elements are keyboard accessible.
Maintain responsive behavior.
Keep feature-specific styles close to their components according to existing conventions.
Avoid duplicating styles across features when a shared abstraction is justified.
12. Imports and Module Boundaries
Follow the repository's existing import and export conventions.
Reuse configured path aliases.
Avoid circular dependencies.
Keep feature internals private unless other modules genuinely need them.
Prefer public feature entry points when the project defines them.
Do not import arbitrary internal files from other features.
Extract shared functionality only when there is a concrete cross-feature requirement.
Do not create barrel files solely to re-export every module.
Avoid abstractions that make the codebase harder to navigate.
13. Loading, Error, and Empty States
Data-driven UI must handle the states relevant to its behavior:

Initial loading.
Error and retry behavior where appropriate.
Empty results.
Successful data rendering.
Pending mutations.
Mutation errors.
Disabled actions during pending operations when necessary.
Reuse existing loading indicators, empty-state components, error components, and notification systems.

Avoid duplicating state-handling UI when an appropriate shared component already exists.

14. Chat and Real-Time Features
For chat-like features, separate responsibilities by UI, API, and behavior.

Example:


text
features/chat/
├── api/
│   ├── chat.api.ts
│   └── chat.keys.ts
├── components/
│   ├── chat-layout.tsx
│   ├── conversation-list.tsx
│   ├── conversation-item.tsx
│   ├── message-list.tsx
│   ├── message-item.tsx
│   └── message-input.tsx
├── hooks/
│   ├── use-chat-messages.ts
│   ├── use-send-message.ts
│   └── use-chat-scroll.ts
├── pages/
│   └── chat-page.tsx
├── types/
└── utils/
Adapt this structure to the actual feature size. Do not create every file before it is needed.

Rules:

Keep the page responsible for composing the chat layout.
Keep message rendering in message components.
Keep the conversation list separate from the message list when they have distinct responsibilities.
Keep message composition separate from message rendering.
Keep HTTP operations in API modules.
Use the existing query library for server state when appropriate.
Keep local interaction state separate from server state.
Reuse existing WebSocket, SSE, or real-time infrastructure when available.
Do not introduce a new real-time library without verifying the requirements.
Handle pagination, optimistic updates, duplicate messages, synchronization, and error recovery when required.
Do not put the entire chat implementation into chat-page.tsx.
15. Performance
Avoid unnecessary state duplication.
Avoid unnecessary re-renders and expensive computations.
Use stable keys when rendering lists.
Avoid unnecessary network requests.
Avoid overly broad query invalidation.
Use lazy loading when it provides meaningful benefits.
Use list virtualization when data size justifies it.
Avoid premature optimization and unnecessary memoization.
Prefer readable, straightforward code unless profiling or requirements justify additional complexity.
16. Testing
Inspect the existing testing setup before writing tests.

Reuse the installed testing framework and utilities.
Test important business logic and user-visible behavior.
Test relevant loading, error, empty, and success states.
Test critical mutations and cache behavior when appropriate.
Follow existing conventions for query-client test setup.
Avoid tests that only duplicate implementation details.
Do not introduce a new testing framework without a clear reason.
17. Required Workflow
For every implementation task:

Inspect the repository structure and identify the relevant feature.
Read package.json and inspect installed dependency versions.
Inspect relevant pages, components, hooks, API modules, types, and tests.
Identify existing abstractions and libraries that can be reused.
Decide which files need to be created or modified.
Place code in the appropriate feature directory.
Separate page composition, UI, API communication, and business logic according to their responsibilities.
Reuse existing dependencies and project conventions.
Implement the smallest coherent solution that satisfies the requirement.
Run available lint, type-check, test, or build commands when practical.
Review the final diff for unnecessary files, oversized components, duplicated logic, incorrect file placement, and unrelated changes.
Do not start by placing the entire implementation into a page and refactor it only when it becomes difficult to maintain.

18. Definition of Done
Before considering a task complete, verify:

Feature-specific code is placed in the appropriate feature directory.
Pages compose components instead of containing the entire feature implementation.
Components have clear responsibilities.
API requests are separated from presentation components.
Files follow consistent naming conventions.
Related functions are grouped appropriately without unnecessary file fragmentation.
Existing dependencies and abstractions are reused when appropriate.
Server state uses the existing query library when appropriate.
Query keys, mutations, and cache invalidation are handled consistently.
Types align with actual API contracts.
Relevant loading, error, empty, and success states are handled.
No unnecessary dependencies, abstractions, or directories were introduced.
Existing module boundaries and conventions are respected.
Relevant lint, type-check, test, or build checks have been run when available.
No unrelated code or behavior was changed unnecessarily.
If existing project conventions conflict with these guidelines, inspect the codebase and prioritize compatibility. Explain significant deviations rather than blindly restructuring the project.