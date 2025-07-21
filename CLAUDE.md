# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glimpse is a Korean dating app frontend built with React Native and Expo. The app focuses on **anonymity and privacy** with group/company-based matching. Key features include anonymous "like" systems, SMS-based verification, real-time chat, and secure data handling.

**Core Concept:** Users join groups (company, university, hobby groups) and can anonymously express interest in other group members. Only when interest is mutual do users learn each other's nicknames for chatting.

## Technology Stack

- **Frontend Framework:** React Native with Expo (managed workflow)
- **Language:** TypeScript with strict mode enabled
- **Build Tool:** Vite for bundling and development
- **State Management:** Zustand for application state
- **Styling:** Tailwind CSS with utility-first approach
- **Authentication:** Clerk for user auth and session management
- **Testing:** Playwright for E2E testing, Jest for unit tests
- **Code Quality:** ESLint + Prettier
- **API Integration:** Notion API for some features

## Development Commands

Since the project is not yet initialized, these are the expected commands once the project is set up:

```bash
# Development
expo start              # Start development server
expo start --web        # Start web version
expo start --ios        # Start iOS simulator
expo start --android    # Start Android emulator

# Building
expo build:android      # Build for Android
expo build:ios         # Build for iOS
eas build --platform all  # Build with Expo Application Services

# Testing
npm test               # Run unit tests
npx playwright test    # Run E2E tests
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript checks

# Code Quality
npm run format        # Format code with Prettier
npm run lint:fix      # Auto-fix ESLint issues
```

## Architecture Guidelines

### Directory Structure (Expected)
```
src/
├── components/           # Reusable UI components
│   ├── auth/            # Authentication-related components
│   ├── chat/            # Chat and messaging components
│   ├── groups/          # Group management components
│   └── common/          # Common UI elements
├── screens/             # Main app screens
│   ├── auth/           # Login, signup, verification
│   ├── home/           # Main dashboard
│   ├── groups/         # Group browsing and management
│   ├── chat/           # Chat interface
│   └── profile/        # User profile management
├── navigation/          # Navigation configuration
├── services/           # API calls and external services
│   ├── api/           # Backend API integration
│   ├── clerk/         # Clerk authentication service
│   └── notion/        # Notion API integration
├── store/              # Zustand state management
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # App constants and configuration
```

### Key Patterns

1. **Component Architecture**
   - Use functional components with hooks
   - Separate presentational and container components
   - Follow single responsibility principle

2. **State Management with Zustand**
   - Create feature-based stores (authStore, chatStore, groupStore)
   - Use selectors for performance optimization
   - Implement persistence for critical data

3. **Authentication Flow**
   - Use Clerk for all authentication
   - Implement SMS verification for anonymity
   - Store minimal user data (nickname only until matching)

4. **Security Practices**
   - Never store sensitive data in client state
   - Use Expo SecureStore for tokens
   - Implement proper input validation
   - Follow anonymity requirements strictly

## Important Business Rules

### Anonymity System
- Users only see nicknames, never real names
- Real identity revealed only after mutual matching
- All interactions are anonymous until both users "like" each other

### Group Types
1. **Official Groups** - Company/university verified groups
2. **Created Groups** - User-created hobby/interest groups  
3. **Instance Groups** - One-time event-based groups
4. **Location Groups** - GPS/QR code verified location groups

### Matching Rules
- Daily free "like" limit (1 free, payment for more)
- 2-week cooldown between likes to same person
- Mutual likes create matches and reveal nicknames
- Groups need minimum gender balance to activate matching

## Testing Strategy

### Unit Testing
- Test individual components and utility functions
- Mock all external dependencies (Clerk, API calls)
- Focus on business logic and state management

### Integration Testing  
- Test component interactions with stores
- Test authentication flows
- Test chat functionality

### E2E Testing with Playwright
- Test complete user journeys (signup → join group → match → chat)
- Test authentication flows
- Test payment integration
- Cross-platform testing (iOS/Android/Web)

## Security Considerations

**Critical:** This is a dating app handling sensitive personal data and anonymity requirements.

- **Data Privacy:** Implement GDPR-compliant data handling
- **Anonymous Until Match:** Strict enforcement of anonymity rules
- **SMS Verification:** Secure phone number verification flow
- **Secure Storage:** Use Expo SecureStore for sensitive data
- **Input Sanitization:** Prevent XSS in chat messages
- **Rate Limiting:** Implement client-side rate limiting for API calls

## Performance Guidelines

### React Native Optimizations
- Use FlatList for any lists of users/groups/messages
- Implement image lazy loading and caching
- Use React.memo for expensive components
- Optimize bundle size with code splitting

### State Management
- Use Zustand selectors to prevent unnecessary re-renders
- Implement optimistic updates for chat messages
- Cache user and group data appropriately

## Development Notes

### Environment Setup
- Requires Expo CLI and development environment
- Configure environment variables for Clerk keys
- Set up testing devices/simulators

### Code Quality Rules
- **Response Requirement:** Always respond in Korean (응답은 한글로한다)
- **TypeScript:** Strict mode enabled, explicit types required
- **ESLint:** Follow React Native and Expo best practices
- **File Naming:** PascalCase for components, camelCase for utilities

### External Integrations
- **Clerk:** Handle all authentication and user sessions
- **Notion API:** Used for some app features (check integration requirements)
- **Payment System:** Integration required for premium features
- **Push Notifications:** For matches and messages

## Debugging and Development

### Common Issues
- **Expo Compatibility:** Ensure all dependencies work with Expo managed workflow
- **Platform Differences:** Test authentication flow on both iOS and Android
- **Network Handling:** Implement proper error handling for API failures
- **State Persistence:** Ensure critical data persists across app restarts

### Tools
- **React Native Debugger** for debugging
- **Expo DevTools** for testing
- **Clerk Dashboard** for auth debugging
- **Zustand DevTools** for state inspection

Remember: This is a privacy-focused dating app. Always prioritize user anonymity and data security in all development decisions.



# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results
