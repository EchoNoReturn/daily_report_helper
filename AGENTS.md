# Daily Report Helper - Agent Development Guide

## 🚀 Build & Development Commands

```bash
# Install dependencies
pnpm install                    # Frontend dependencies
cd src-tauri && cargo fetch     # Rust dependencies

# Development
pnpm tauri dev                  # Run development server (port 1420)

# Production build
pnpm tauri build                # Build production application

# Frontend only
pnpm dev                        # Vite dev server
pnpm build                      # Build frontend only
pnpm preview                    # Preview built frontend
```

**Testing**: This project currently has no automated tests. When adding tests, use React Testing Library for components and Rust's built-in testing for backend commands.

## 🏗️ Project Architecture

### Stack Overview
- **Frontend**: React 19 + TypeScript + Zustand + Tailwind CSS + Vite
- **Backend**: Rust + Tauri v2 + SQLx + SQLite
- **State Management**: Zustand store (`src/store.ts`)
- **Database**: SQLite in app config directory (not in repo)

### Key Files & Patterns
- **Main App**: `src/App.tsx` - Three-column layout (LeftNav, MainContent, AIChat)
- **State**: `src/store.ts` - All data operations go through Tauri `invoke` commands
- **Types**: `src/types.ts` - TypeScript interfaces for all data models
- **Commands**: `src-tauri/src/commands.rs` - Rust backend commands
- **Database**: `src-tauri/src/database.rs` - SQLite pool management and schema

## 🎯 Code Style Guidelines

### TypeScript/React
```typescript
// Import order: React → External libraries → Internal modules
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { IdeaCard } from './cards/IdeaCard';

// Component naming: PascalCase, export as function
export function IdeasView() {
  // State: camelCase, type annotations when not inferred
  const [content, setContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Store access: useAppStore hook
  const { records, addIdea, loading } = useAppStore();
}
```

### Error Handling
```typescript
// Always wrap async operations in try/catch
const handleCreate = async () => {
  if (!content.trim()) {
    alert('请输入想法内容'); // User feedback
    return;
  }

  setIsCreating(true);
  try {
    await addIdea(content, attachments);
    setContent(''); // Reset form on success
    alert('想法已保存！');
  } catch (error) {
    console.error('添加想法失败:', error);
    alert('保存失败: ' + error);
  } finally {
    setIsCreating(false);
  }
};
```

### Tailwind CSS
- Use utility classes for all styling
- Follow existing patterns in `src/index.css`
- Component structure: `card`, `p-4`, `border-2`, etc.
- Responsive design: `md:`, `lg:` prefixes when needed

### Backend Commands (Rust)
```rust
// Command signature: async function returning Result<T, String>
#[tauri::command]
pub async fn add_idea(
    content: String,
    attachments: Vec<String>,
    created_at: i64,
    state: tauri::State<'_, DbState>,
) -> Result<(), String> {
    // Database operations use sqlx
    sqlx::query!("INSERT INTO ideas...")
        .execute(&state.pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

## 📝 Data Flow Patterns

### Store Operations
1. **Read Data**: `loadTodayRecords()`, `loadApiConfig()` on app init
2. **Create Data**: `addIdea()`, `addTask()` → invoke command → reload data
3. **Delete Data**: `deleteIdea()`, `deleteTask()` → invoke command → update local state
4. **API Config**: `saveApiConfig()` → invoke command → update store

### Component Patterns
- Load data in `useEffect` on mount
- Show loading state with `loading` from store
- Use alert() for user feedback (current pattern)
- Handle form validation before API calls

## 🛠️ When Adding New Features

### Frontend Components
1. Create component in `src/components/`
2. Add types to `src/types.ts` if needed
3. Update `src/App.tsx` routing via `currentView`
4. Add navigation item to `LeftNav.tsx`

### Backend Commands
1. Define command in `src-tauri/src/commands.rs`
2. Register in `src-tauri/src/lib.rs` with `generate_handler!`
3. Add wrapper in `src/store.ts` with error handling
4. Update database schema in `src-tauri/src/database.rs` if needed

### Database Changes
- Tables are created defensively on each connection
- Dates stored as `"%Y-%m-%d"` strings
- Times as Unix timestamps
- Attachments as JSON string arrays

## ⚠️ Known Issues & Pitfalls

- **Config Persistence**: `save_api_config` stores value as key - fix if touching config logic
- **AI Features**: Moved to frontend - backend methods throw errors
- **Cross-day Time Handling**: Tasks with end < start are handled in TasksView
- **File Paths**: Attachments stored as `file://` paths, not uploaded
- **Error Messages**: Most errors surface as alerts to user

## 🔧 Development Tips

- Use `pnpm tauri dev` for hot reload during development
- Database lives in app config dir, not repo
- Check console for Rust backend errors
- Frontend errors appear in browser dev tools
- All Tauri commands must return `Result<T, String>`

