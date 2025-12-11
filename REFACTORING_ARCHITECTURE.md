# IdeaGenerationForm Refactoring Architecture

## Component Hierarchy

```
idea-generation-form.tsx (286 lines) - Main Orchestrator
│
├── useIdeaGenerationForm() - Custom Hook (320 lines)
│   ├── State Management
│   ├── Form Validation
│   ├── API Integration
│   ├── Plan Limits
│   └── Progress Tracking
│
├── Constants (166 lines)
│   ├── industries[]
│   ├── problemAreas[]
│   ├── audiences[]
│   ├── budgetOptions[]
│   ├── timelineOptions[]
│   └── steps[]
│
└── Step Components
    ├── StepNavigation (91 lines)
    │   └── Visual progress tracker
    │
    ├── Step 1: IndustrySelectionStep (70 lines)
    │   └── Industry picker
    │
    ├── Step 2: ProblemAreaStep (77 lines)
    │   ├── Problem selection
    │   └── DynamicPromptDisplay (63 lines)
    │
    ├── Step 3: TargetAudienceStep (78 lines)
    │   ├── Audience selection
    │   └── DynamicPromptDisplay (63 lines)
    │
    ├── Step 4: BudgetTimelineStep (138 lines)
    │   ├── Budget picker
    │   ├── Timeline picker
    │   └── DynamicPromptDisplay (63 lines)
    │
    ├── Step 5: DescriptionStep (149 lines)
    │   ├── User prompt textarea
    │   └── Dynamic AI questions
    │
    ├── GenerateButton (92 lines)
    │   ├── Plan limits display
    │   └── Generate trigger
    │
    └── GeneratedIdeaCard (86 lines)
        └── Success state display
```

## Data Flow

```
User Interaction
      ↓
Step Component (UI)
      ↓
Event Handler (onClick, onChange)
      ↓
useIdeaGenerationForm Hook
      ↓
State Update
      ↓
Re-render with New State
      ↓
Updated UI
```

## File Organization

```
features/dashboard/
│
├── components/
│   ├── idea-generation-form.tsx         (Main Component - 286 lines)
│   └── idea-generation/                 (Step Components Directory)
│       ├── index.ts                     (Exports - 9 lines)
│       ├── IndustrySelectionStep.tsx    (70 lines)
│       ├── ProblemAreaStep.tsx          (77 lines)
│       ├── TargetAudienceStep.tsx       (78 lines)
│       ├── BudgetTimelineStep.tsx       (138 lines)
│       ├── DescriptionStep.tsx          (149 lines)
│       ├── DynamicPromptDisplay.tsx     (63 lines)
│       ├── GeneratedIdeaCard.tsx        (86 lines)
│       ├── StepNavigation.tsx           (91 lines)
│       └── GenerateButton.tsx           (92 lines)
│
├── hooks/
│   └── useIdeaGenerationForm.ts         (Business Logic - 320 lines)
│
└── constants/
    └── idea-generation.ts               (Configuration - 166 lines)
```

## Dependency Graph

```
idea-generation-form.tsx
├── imports useIdeaGenerationForm from hooks/
├── imports constants from constants/
└── imports all step components from idea-generation/index

useIdeaGenerationForm.ts
├── imports constants from constants/
└── imports types from @/types/startup-ideas

Step Components
├── import constants (when needed)
├── import types from @/types/startup-ideas
└── import shared UI components from @/components/ui/

constants/idea-generation.ts
└── imports icons from lucide-react
```

## State Management Flow

```
┌─────────────────────────────────────────────────────┐
│         useIdeaGenerationForm Hook                  │
├─────────────────────────────────────────────────────┤
│ State:                                              │
│  - currentStep                                      │
│  - formData { industry, problemArea, ... }          │
│  - isGenerating                                     │
│  - generatedIdea                                    │
│  - error                                            │
│  - dynamicQuestions                                 │
│  - planLimits & usage                               │
├─────────────────────────────────────────────────────┤
│ Computed Values:                                    │
│  - selectedIndustry (memoized)                      │
│  - selectedProblem (memoized)                       │
│  - completedSteps                                   │
│  - progress                                         │
├─────────────────────────────────────────────────────┤
│ Actions:                                            │
│  - updateFormData(key, value)                       │
│  - autoAdvance()                                    │
│  - handleGenerate()                                 │
│  - resetGeneratedIdea()                             │
└─────────────────────────────────────────────────────┘
         │                          ▲
         │                          │
         ▼                          │
┌─────────────────────────────────────────────────────┐
│         Step Components (UI Layer)                  │
├─────────────────────────────────────────────────────┤
│  IndustrySelectionStep                              │
│    - receives: formData, onSelect                   │
│    - emits: selection + autoAdvance                 │
│                                                     │
│  ProblemAreaStep                                    │
│    - receives: formData, onSelect                   │
│    - emits: selection + autoAdvance                 │
│                                                     │
│  TargetAudienceStep                                 │
│    - receives: formData, onSelect                   │
│    - emits: selection + autoAdvance                 │
│                                                     │
│  BudgetTimelineStep                                 │
│    - receives: formData, onBudget/TimelineSelect    │
│    - emits: selections + autoAdvance                │
│                                                     │
│  DescriptionStep                                    │
│    - receives: formData, dynamicQuestions           │
│    - emits: userPrompt changes                      │
└─────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Custom Hook Pattern
- Encapsulates all business logic
- Returns state and actions
- Reusable and testable

### 2. Controlled Components
- All inputs controlled by parent state
- Unidirectional data flow
- Predictable state updates

### 3. Render Props (Partial)
- renderDynamicPrompt for flexible rendering
- Keeps step components focused

### 4. Compound Components
- StepNavigation + Step Components work together
- Shared state through hook
- Clear separation of concerns

### 5. Progressive Enhancement
- Required steps enforced
- Optional step (description) clearly marked
- Auto-advance for better UX

## Performance Considerations

### Memoization
- useMemo for derived values (selectedIndustry, etc.)
- Prevents unnecessary recalculations
- Optimizes re-renders

### Event Debouncing
- 300ms delay for dynamic questions fetch
- AbortController for cleanup
- Prevents excessive API calls

### Conditional Rendering
- Only render current step content
- Lazy load generated idea card
- Progressive loading states

## Scalability

### Easy to Add New Steps
1. Create new step component in idea-generation/
2. Add to constants steps array
3. Add case in renderStepContent()
4. Update hook if new state needed

### Easy to Modify Existing Steps
- Each step is self-contained
- Clear props interface
- Minimal coupling
