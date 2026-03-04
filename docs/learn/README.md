# Backend Engineering Mastery

An interactive, visual-first learning platform for backend engineering fundamentals.

## 🎓 What is this?

A Duolingo-style educational platform that teaches backend engineering concepts using the Xarticle.co codebase as a living textbook. Perfect for visual learners!

## 🚀 Features

- **25 Interactive Lessons** across 5 worlds:
  - World 1: Foundations (HTTP, Servers, URLs)
  - World 2: APIs (REST, JSON, Requests)
  - World 3: Backend (Serverless, Routing, Error Handling)
  - World 4: Data (Caching, State, External APIs)
  - World 5: Production (Auth, CORS, Testing, Deployment)

- **Visual-First Learning:**
  - Animated server lifecycle diagrams
  - Interactive HTTP packet builders
  - URL routing visualizations
  - Status code wheels
  - Request lifecycle simulations

- **Gamification:**
  - XP system with streaks
  - Skill tree progression
  - Achievement badges
  - Quiz system with immediate feedback

## 🛠 Tech Stack

- **Framework:** React 19 + Vite 7 + TypeScript 5.9
- **Animations:** Framer Motion
- **State:** Zustand
- **Styling:** Tailwind CSS

## 📦 Installation

```bash
cd docs/learn
npm install
npm run dev
```

## 🎯 How to Use

1. Open the skill tree to see all 25 lessons
2. Click on an available lesson to start
3. Progress through sections:
   - **Learn:** Interactive visual explanations
   - **Code:** Real examples from the codebase
   - **Quiz:** Test your knowledge
   - **Challenge:** Hands-on coding exercises

4. Earn XP and unlock achievements!

## 🎨 Visual Components

Each lesson includes interactive visualizations:
- `ServerLifecycle`: Watch servers start, listen, and process requests
- `HttpPacketAnatomy`: Build and send HTTP requests
- `UrlBreakdown`: Explore URL structure interactively
- `StatusCodeWheel`: Learn HTTP status codes through scenarios
- `RequestLifecycle`: Step through the complete request journey

## 🏆 Learning Path

1. **Start with World 1** - Master the fundamentals
2. **Progress sequentially** - Each lesson builds on the previous
3. **Complete all quizzes** - 80% passing score required
4. **Finish World 5** - Become a backend engineering master!

## 📚 Lesson Structure

Each lesson (30-45 minutes):
- 10-15 min: Visual concept learning
- 5 min: Interactive quiz
- 15-30 min: Code challenge
- XP reward: 50-150 points

## 🔧 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck
```

## 📝 License

Part of the Xarticle.co project.
