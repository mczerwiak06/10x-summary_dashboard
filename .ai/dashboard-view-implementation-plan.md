# View Implementation Plan: Dashboard

## 1. Overview
This document outlines the implementation plan for the authenticated Dashboard view. The Dashboard is the primary user workspace, featuring a two-column layout. The right sidebar lists all the user's saved summaries, while the main left column displays either a selected summary's details or an empty state. All functionality for creating, viewing, editing, and deleting summaries is initiated from this view, primarily through a multi-step modal process.

## 2. View Routing
- **Path:** `/dashboard`
- **Access:** This route must be protected and accessible only to authenticated users. Unauthenticated access should redirect to `/login`.

## 3. Component Structure
The view will be composed of the following component hierarchy:

```
DashboardPage
├── Header
│   ├── AddTranscriptButton
│   └── AvatarMenu
├── ErrorBanner
├── DashboardLayout
│   ├── Sidebar
│   │   └── SummaryList
│   │       ├── SummaryCard[]
│   │       └── SkeletonLoader[]
│   └── MainColumn
│       ├── SummaryDetail (if a summary is selected)
│       ├── EditSummaryForm (if editing a summary)
│       └── EmptyState (if no summary is selected)
└── TranscriptModal (portal, opened via AddTranscriptButton)
    ├── SubmitForm
    ├── ProgressView
    └── PreviewView
```

## 4. Component Details

### `DashboardPage`
- **Component Description**: The top-level container component for the dashboard. It orchestrates data fetching for the summary list and manages the state for the currently selected summary and the transcript creation modal.
- **Main elements**: `Header`, `DashboardLayout`, `TranscriptModal`.
- **Handled interactions**: Renders child components with appropriate props derived from the `useDashboardState` hook.
- **Types**: `DashboardViewModel`
- **Props**: None.

### `Header`
- **Component Description**: The main application header, displayed at the top of the page.
- **Main elements**: App logo, page title, `AddTranscriptButton`, user avatar menu.
- **Handled interactions**:
  - `onAddTranscriptClick`: Signals the `DashboardPage` to open the `TranscriptModal`.
- **Props**:
  - `summaryCount: number`
  - `onAddTranscriptClick: () => void`

### `SummaryList`
- **Component Description**: Renders the list of summaries in the right sidebar with infinite scrolling.
- **Main elements**: A vertically scrolling container holding a list of `SummaryCard` components and `SkeletonLoader`s while fetching.
- **Handled interactions**:
  - **Infinite Scroll**: Triggers `fetchNextPage` when the user scrolls near the bottom of the list.
  - **Summary Selection**: Notifies the parent `DashboardPage` when a `SummaryCard` is clicked.
- **Types**: `SummaryListItemDto[]`
- **Props**:
  - `summaries: SummaryListItemDto[]`
  - `isLoading: boolean`
  - `hasNextPage: boolean`
  - `isFetchingNextPage: boolean`
  - `selectedSummaryId: string | null`
  - `onFetchNextPage: () => void`
  - `onSelectSummary: (id: string) => void`

### `SummaryDetail`
- **Component Description**: Displays the full content of a selected summary in a read-only format.
- **Main elements**: Rendered markdown content container, "Edit" button, "Delete" button.
- **Handled interactions**:
  - `onEdit`: Switches the view to the `EditSummaryForm`.
  - `onDelete`: Shows a confirmation dialog and then triggers the delete mutation.
- **Types**: `SummaryDto`
- **Props**:
  - `summary: SummaryDto`
  - `onEdit: () => void`
  - `onDelete: (id: string) => void`

### `TranscriptModal`
- **Component Description**: A multi-step modal that handles the entire transcript submission and summary generation workflow. It manages internal state to show the correct step: submission form, progress indicator, or summary preview.
- **Main elements**: A modal container that conditionally renders `SubmitForm`, `ProgressView`, or `PreviewView`.
- **Handled interactions**: Manages the flow between steps based on API call outcomes.
- **Types**: `TranscriptModalViewModel`
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`

## 5. Types

### DTOs (Data Transfer Objects - from API)
- **`SummaryListItemDto`**: Used for summaries in the `SummaryList`.
- **`SummaryDto`**: Used for the detailed view of a single summary.
- **`CreateTranscriptCommand`**: Request body for `POST /api/transcripts`.
- **`CreateTranscriptResponseDto`**: Response from `POST /api/transcripts`.
- **`UpdateSummaryCommand`**: Request body for `PUT /api/summaries/:id`.
- **`SummarisationStatusDto`**: Response from `GET /api/summarise/status/:transcriptId`.

### ViewModels (UI-specific types)
- **`DashboardViewModel`**
  ```typescript
  interface DashboardViewModel {
    // Data from useInfiniteQuery for the summary list
    summaries: InfiniteData<SummaryListItemDto[]>;
    summaryCount: number;

    // State for the selected summary detail view
    selectedSummaryId: string | null;
    selectedSummary: SummaryDto | null;
    isSummaryDetailLoading: boolean;

    // State for the modal
    isTranscriptModalOpen: boolean;
  }
  ```
- **`TranscriptModalViewModel`**
  ```typescript
  interface TranscriptModalViewModel {
    // The current step of the modal workflow
    step: 'submit' | 'progress' | 'preview' | 'error';

    // State for the submission form
    transcriptText: string;
    wordCount: number;

    // State after submission
    transcriptId: string | null;

    // State for the preview step
    generatedSummaryMarkdown: string;
    summaryId: string | null; // ID of the created summary

    // Generic error message for any step
    errorMessage: string | null;
  }
  ```

## 6. State Management
State will be managed via two custom hooks, leveraging TanStack Query for server state.

### `useDashboardState`
- **Purpose**: To encapsulate all logic for the main dashboard page.
- **State Managed**:
  - `useInfiniteQuery` for fetching and paginating the list of summaries (`GET /api/summaries`).
  - `useState` to track the `selectedSummaryId`.
  - `useQuery` to fetch the details of the selected summary (`GET /api/summaries/:id`), enabled by `selectedSummaryId`.
  - `useMutation` for deleting summaries (`DELETE /api/summaries/:id`) with optimistic updates.
  - `useMutation` for updating existing summaries (`PUT /api/summaries/:id`).
  - `useState` to manage the open state of the `TranscriptModal`.
- **Returns**: A `DashboardViewModel` object and handler functions (`handleSelectSummary`, `handleOpenModal`, etc.).

### `useTranscriptModalState`
- **Purpose**: To manage the complex, multi-step state of the transcript submission process.
- **State Managed**:
  - `useState` for the entire `TranscriptModalViewModel`.
  - `useMutation` for submitting the new transcript (`POST /api/transcripts`).
  - `useQuery` for polling the summarization status (`GET /api/summarise/status/:transcriptId`), configured with a refetch interval.
  - `useMutation` for saving the generated and edited summary (`PUT /api/summaries/:id`).
- **Returns**: The `TranscriptModalViewModel` and handler functions (`handleSubmit`, `handleSave`, `handleClose`).

## 7. API Integration

- **List Summaries**: `useInfiniteQuery` will call `GET /api/summaries`. The `getNextPageParam` function will use the `nextCursor` from the API response.
  - **Response Type**: `{ items: SummaryListItemDto[], nextCursor: string | undefined }`
- **Create Transcript**: `useMutation` will call `POST /api/transcripts`.
  - **Request Type**: `CreateTranscriptCommand`
  - **Response Type**: `CreateTranscriptResponseDto`
- **Poll Status**: `useQuery` will call `GET /api/summarise/status/:transcriptId`. It should be configured to poll every 5 seconds and time out after 3 minutes.
  - **Response Type**: `SummarisationStatusDto & { summaryId?: string }`. **Dependency**: The API must return the `summaryId` when the status is `ready`.
- **Update Summary**: `useMutation` will call `PUT /api/summaries/:id`.
  - **Request Type**: `UpdateSummaryCommand`
  - **Response Type**: `SummaryDto`
- **Delete Summary**: `useMutation` will call `DELETE /api/summaries/:id`.
  - **Response Type**: `204 No Content`

## 8. User Interactions

- **Open Modal**: User clicks "Add transcript". The `DashboardPage` sets `isTranscriptModalOpen` to `true`.
- **Submit Transcript**: User types text and clicks "Summarise". The `useTranscriptModalState` hook triggers the `POST` mutation, then transitions the modal `step` to `progress`.
- **Polling**: The modal automatically polls the status endpoint. On `ready`, it transitions to `preview`. On `error`, it transitions to `error`.
- **Save Summary**: User edits the markdown and clicks "Save". The `PUT` mutation is called. On success, the modal closes, and the `useDashboardState` summary list query is invalidated to show the new item.
- **Select Summary**: User clicks a `SummaryCard`. `onSelectSummary` is called, updating `selectedSummaryId` in `useDashboardState`, which triggers the detail `useQuery` to fetch and display the full summary.

## 9. Conditions and Validation

- **Transcript Length**: The "Summarise" button in the `SubmitForm` will be disabled if the word count of the input text is over 1000. A visual counter will provide real-time feedback.
- **Summary Quota**: The `AddTranscriptButton` in the `Header` will be disabled if `summaryCount >= 20`. A tooltip will inform the user why it's disabled.
- **Modal Lock**: The `TranscriptModal` will not be closable via Escape key or overlay click while in the `progress` or `saving` state to prevent users from accidentally losing their submission.

## 10. Error Handling

- **API Errors (4xx, 5xx)**: All TanStack Query mutations and queries will have `onError` handlers.
  - **Modal Errors**: For failures within the `TranscriptModal` (e.g., 429 Quota Exceeded on submit, `error` status from polling), an error message will be displayed inline within the modal. A "Retry" button will be provided where applicable.
  - **Global Errors**: For failures on the main page (e.g., deleting a summary), a message will be displayed in the global `ErrorBanner` component.
- **Authentication Error (401)**: A global response interceptor should catch any `401 Unauthorized` responses, clear the user's session, and redirect to the `/login` page.

## 11. Implementation Steps
1.  **Component Scaffolding**: Create empty files for all new components (`DashboardPage`, `SummaryList`, `SummaryCard`, `SummaryDetail`, `TranscriptModal`, etc.).
2.  **State Hooks**: Implement the `useDashboardState` and `useTranscriptModalState` hooks with placeholder logic and typed interfaces.
3.  **Dashboard Layout**: Implement the `DashboardPage` and its layout. Wire up the `useDashboardState` hook.
4.  **Summary List**: Implement the `SummaryList` and `SummaryCard`. Connect them to the `useInfiniteQuery` data from the hook. Implement infinite scroll logic.
5.  **Summary Detail**: Implement the `SummaryDetail` view, connecting it to the `useQuery` for a single summary.
6.  **Transcript Modal - Step 1 (Submit)**: Implement the `SubmitForm`. Add word count validation and connect the submit button to the `POST /api/transcripts` mutation in `useTranscriptModalState`.
7.  **Transcript Modal - Step 2 (Progress)**: Implement the `ProgressView` and the status polling logic using `useQuery` with `refetchInterval`.
8.  **Transcript Modal - Step 3 (Preview)**: Implement the `PreviewView` with an editable markdown component. Connect the "Save" button to the `PUT /api/summaries/:id` mutation.
9.  **CRUD Operations**: Implement the update (`EditSummaryForm`) and delete logic for existing summaries, including optimistic updates for a smoother UX.
10. **Error Handling**: Implement UI for all identified error states in the modal and the main `ErrorBanner`.
11. **Final Touches**: Add skeleton loaders, polish styles, and ensure all accessibility attributes (ARIA roles, focus management in the modal) are correctly implemented.
