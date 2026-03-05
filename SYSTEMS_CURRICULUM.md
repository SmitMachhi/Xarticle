# Systems Engineering Curriculum — The Data Plumber

## The Goal

Turn a complete beginner into someone who can:

1. Look at any system architecture diagram cold and narrate the data flow within 2 minutes
2. Identify bottlenecks, single points of failure, and security holes from the diagram's shape alone
3. Propose the correct fix for the correct class of problem
4. Design systems from a written requirement using diagrams
5. Understand why every engineering decision exists and what it costs

**This is not a coding course.** The student will never write code. They will become a systems architect — someone who designs what gets built and spots what's broken. AI codes. Humans design.

The single mental model that runs through the entire course: **you are a data plumber.** Data is water. Systems are plumbing. Your job is to understand where the water comes from, where it needs to go, how fast it can get there, what stops it, what contaminates it, and how to fix the pipes when they burst.

---

## The Teaching Philosophy

Every single concept follows this exact loop. No exceptions.

### 1. The Incident (concrete hook — always first)
A short story. Something broke in production. Real consequences. The student is confused alongside the protagonist. **No technical terminology yet.** The goal is to make the student feel the problem before they learn the solution.

### 2. First Principles (derive from scratch)
Strip away the solution that exists. If this technology didn't exist, what would you build? What's the minimum viable answer? Then: what's wrong with that answer? What does it fail to handle? Each failure points at the next concept.

### 3. The Plumbing Analogy (anchor before abstraction)
Before the technical term is introduced, map it to a physical plumbing equivalent. The brain needs a schema to attach new information to. Analogies provide the hook. The analogy comes *before* the concept name, not after.

### 4. The Component (what it actually is)
Now introduce the concept and its proper name. What it does, what it looks like in a diagram, what the standard notation is.

### 5. The Cost (tradeoffs — always explicit)
Every component has a price. A cache costs you consistency. A circuit breaker costs you availability. Rate limiting costs user experience. There are no free lunches. The student must know the price before they can choose the part.

### 6. The Failure Modes (how it breaks)
The component works. Now: what breaks it? What are the edge cases where it fails silently, catastrophically, or in ways that are hard to diagnose? This builds the pattern recognition that separates architects from users.

### 7. Predict → Break → Fix (active production — PRIMM)
Show a working system diagram. Ask "what happens if we remove this component?" Student predicts. Then reveal. Then: "here's a broken version of this diagram. Find the problem." Student works before the answer appears.

### 8. Spaced Retrieval (every module, 2 questions from previous modules)
Each module opens with 2 questions from prior modules before any new content. Ebbinghaus forgetting curve is real. Spaced retrieval is the only thing that defeats it.

---

## The Plumbing Analogy — Full System Map

This map is canonical. Every component in the course is taught through its plumbing equivalent. Use this language consistently throughout all lessons.

### The fundamental metaphor
- **Data** = water
- **System** = plumbing network
- **Request** = turning on the tap
- **Response** = water coming out
- **Latency** = how long until water reaches you
- **Throughput** = how much water per second can flow
- **Bandwidth** = pipe diameter
- **Load** = water pressure in the system

### Moving water (transport)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| HTTP | Fill-and-drain pipe | One request, one response, then pipe closes |
| WebSocket | Always-open pipe | Permanent connection, water flows both ways continuously |
| TCP | Reliable pipe with receipts | Every drop confirmed received, in order |
| UDP | Fire hose with no receipts | Fast, some drops lost, nobody checks |
| DNS | Address book | Turns a name into a pipe address |
| CDN | Local water towers | Reservoir copies placed physically close to users |

### Storing water (persistence)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| Database | Main reservoir | Permanent, structured, survives restarts |
| Cache | Bucket next to workstation | Fast, temporary, may be stale |
| Blob/file storage | Warehouse | Large unstructured objects (images, videos, PDFs) |
| Message queue | Buffer tank | Absorbs pressure spikes, smooths uneven flow |
| In-memory store | Water in your cupped hands | Instant access, gone the moment power dies |

### Controlling flow (routing & logic)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| API | Standardized pipe fitting | Both sides agree on the interface shape |
| Load balancer | Water manifold | Splits flow across multiple identical pipes |
| API gateway | Main valve with rules | Single entry point, enforces all policies |
| Router | Junction box | Sends water down the correct pipe based on label |
| Reverse proxy | Receiving clerk | Accepts water, forwards it, hides what's behind |

### Protecting the system (security)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| Authentication | Keyed front door valve | Proves you are who you say you are |
| Authorization | Zone access control | Proves you're allowed in this specific room |
| Rate limiter | Flow restrictor | Caps how much any one source can send |
| Encryption | Insulated opaque pipe | Contents invisible and unreadable from outside |
| Input validation | Water filter at intake | Removes contaminants before they enter the system |
| Firewall | Perimeter fence with guards | Blocks traffic before it reaches any pipe |

### Handling failure (reliability)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| Timeout | Auto-shutoff valve | Stops waiting after X seconds, takes action |
| Retry | Re-opening the valve | Tries again after a failure, with backoff |
| Circuit breaker | Pressure relief valve | Stops sending when downstream is overwhelmed |
| Fallback | Alternate pipe route | Secondary path when primary is blocked |
| Health check | Pressure gauge | Is this pipe currently flowing? |
| Dead letter queue | Drain bucket | Catches water that couldn't be processed |

### Watching the system (observability)
| Component | Plumbing Equivalent | Key Property |
|---|---|---|
| Logs | Written record of every valve state change | What happened and when |
| Metrics | Continuous pressure gauges across the network | Is the system healthy right now? |
| Traces | Tracking one water molecule end-to-end | Why did this specific request take 3 seconds? |
| Alerts | Alarm triggered when pressure exceeds threshold | Wake someone up when something breaks |
| Dashboards | Control room with all gauges visible | System health at a glance |

### Scale concepts
| Concept | Plumbing Equivalent |
|---|---|
| Vertical scaling | Replacing a pipe with a bigger diameter pipe |
| Horizontal scaling | Adding more parallel pipes |
| Single point of failure | One pipe with no parallel path or bypass |
| Redundancy | Every critical pipe has a backup |
| Sharding | Dividing one reservoir into many smaller ones by region |
| Replication | Copying a reservoir so reads can come from the nearest copy |

---

## The Parts Catalog — 24 Modules

These are the 24 components every systems engineer must know. Ordered from most fundamental to most advanced. Each is one module.

### Phase 1: The Pipes (how data moves)
1. **HTTP** — the fill-and-drain pipe. The universal language of the web.
2. **DNS** — the address book. How names become locations.
3. **APIs** — standardized fittings. How two systems agree to connect.
4. **WebSockets** — the always-open pipe. When HTTP's open-drain-close isn't enough.

### Phase 2: The Reservoirs (where data lives)
5. **Databases** — the main reservoir. Types of reservoirs: SQL (organized shelves) vs NoSQL (open warehouse).
6. **Caches** — the bucket next to you. Speed vs consistency.
7. **CDN** — water towers near users. Copies of your reservoir at the edge.
8. **Message Queues** — buffer tanks. Handling spikes without bursting.

### Phase 3: The Valves (controlling what flows)
9. **Authentication** — the keyed door. Proving identity.
10. **Authorization** — zone access. Proving permission.
11. **Rate Limiting** — the flow restrictor. Preventing one source from taking everything.
12. **API Gateway** — the main valve with rules. One entry point to govern them all.

### Phase 4: The Infrastructure (how it's all connected)
13. **Load Balancers** — manifolds. Distributing flow across multiple pipes.
14. **Reverse Proxies** — receiving clerks. Hiding complexity behind a single face.
15. **Serverless Functions** — on-demand pumps. Spin up when water arrives, shut down when done.
16. **Containers** — prefabricated pipe sections. Same behavior everywhere.

### Phase 5: Reliability (what keeps it running)
17. **Timeouts & Retries** — auto-shutoffs and valve re-openers. Never waiting forever.
18. **Circuit Breakers** — pressure relief valves. Protecting downstream systems from overload.
19. **Fallback Chains** — alternate routes. When the primary path is blocked.
20. **Health Checks** — pressure gauges. Knowing which pipes are alive.

### Phase 6: Visibility (knowing what's happening)
21. **Logging** — the written record. What happened and when.
22. **Metrics & Alerting** — continuous gauges and alarms. Is the system sick right now?
23. **Distributed Tracing** — following one molecule. Why did this specific request fail?

### Phase 7: Scale (handling more water)
24. **Scaling Patterns** — bigger pipes vs more pipes. The physics and economics of growth.

---

## Then: System Reading (Phase 8)

After all 24 parts are known, the next section teaches how to read full system diagrams.

Given a complete architecture diagram of a real production system, the student must:
1. Narrate the data flow from user action to response
2. Identify every component by name
3. Locate all single points of failure
4. Locate all trust boundary violations
5. Spot cache placement errors
6. Identify unnecessary data movement (extra hops that add latency with no benefit)
7. Propose the minimum change to fix the most critical problem

Exercises use real company architectures (Airbnb, Uber, Netflix, etc.) simplified to diagrams.

---

## Then: System Design (Phase 9)

Given a written product requirement, design the system from scratch.

Example brief: *"Build a URL shortener that handles 1 million shortens per day and 100 million redirects per day. Links should never expire. It should be available globally."*

The student:
1. Identifies what data needs to flow (write path vs read path)
2. Chooses storage (what kind of reservoir? why?)
3. Handles scale (redirects are 100x writes — where does the bottleneck form?)
4. Adds reliability (what happens when the database is down?)
5. Adds observability (how do you know when something is wrong?)
6. Draws the final diagram

---

## Module Format Template

Every module follows this exact structure. No deviation.

```
SECTION 1: The Incident (~300 words)
  - A short story. Production broke. Real consequences.
  - No technical terms yet. Just confusion and stakes.
  - Ends with the question: "Why did this happen?"

SECTION 2: First Principles (~200 words)
  - If this component didn't exist, what would you build?
  - Walk through the minimum viable solution
  - Then: what's wrong with it? What edge case breaks it?
  - Each failure points at the real solution

SECTION 3: The Plumbing Analogy (visual + ~150 words)
  - The physical world equivalent
  - Draw it as a simple plumbing diagram
  - "This is the [component name]"

SECTION 4: The Component (~300 words + diagram)
  - What it actually is
  - How it appears in system diagrams (notation)
  - How data flows through it
  - Interactive visual showing it in action

SECTION 5: The Cost (tradeoff table)
  - What you gain: [list]
  - What you pay: [list]
  - When NOT to use it: [conditions]

SECTION 6: How It Breaks (failure modes)
  - 3-4 specific failure scenarios
  - Each with: trigger → symptom → what the diagram looks like when this is happening

SECTION 7: Spot the Problem (interactive)
  - Show a diagram with this component misused
  - Student clicks/identifies the problem before explanation appears
  - 2-3 variations of increasing subtlety

QUIZ: 7 questions
  - 2 spaced retrieval (from any previous module)
  - 3 MCQ on this module's concepts
  - 2 "spot the broken diagram" (image + multiple choice)
```

---

## Quiz Question Types

### Type 1: Recall (MCQ)
Standard multiple choice. Tests whether the student knows what a component does.

*"A cache is best described as..."*
- A) Permanent storage for user data
- B) A fast, temporary copy of frequently needed data kept close to where it's used ✓
- C) An encrypted pipe between two services
- D) A valve that limits how many requests can pass

### Type 2: Spot the Problem (diagram MCQ)
Shows a system diagram. Student identifies the flaw.

*"This diagram shows a cache placed before the auth service. What is the problem?"*
- A) The cache will run out of memory
- B) Unauthenticated requests may be cached and served to other users ✓
- C) The auth service will be too slow
- D) There is no problem with this design

### Type 3: What Breaks When (scenario MCQ)
Shows a scenario. Student predicts the failure mode.

*"The circuit breaker is removed from this diagram. The payment service starts responding in 8 seconds instead of 200ms. What happens to the checkout service?"*
- A) Checkout becomes faster because there's one fewer component
- B) Checkout threads are held open for 8 seconds each, exhausting the thread pool ✓
- C) Checkout fails immediately with a timeout
- D) Nothing changes, they are independent services

### Type 4: Choose the Right Tool (comparative)
Two scenarios. Which component solves each problem?

*"Your app needs to serve the same user profile data to 10,000 simultaneous requests. Which component most directly solves this?"*
- A) A load balancer
- B) A cache ✓
- C) A circuit breaker
- D) A message queue

---

## Visual Design System

The course is primarily visual. Every concept is shown before it is explained in words. The student should be able to understand 80% of a module just from its visuals before reading a single sentence.

---

### The Visual Color Language

Every diagram uses the same color system. The student learns it once in module 1 and it never changes.

| Color | Meaning | What it looks like |
|---|---|---|
| **Blue** | Data flowing normally | Animated dots moving along pipes |
| **Green** | Healthy / success / correct | Green border, green glow on component |
| **Red** | Failure / error / blocked | Red fill, pulsing red border |
| **Orange/Yellow** | Warning / slow / degraded | Orange border, slow-moving dots |
| **Grey** | Inactive / locked / offline | Greyed out, no animation |
| **Purple** | Trust boundary / security layer | Dashed purple border around protected zone |
| **Dark dashed line** | System boundary | Where your control ends and theirs begins |

---

### The 7 Visual Types

Every concept in the course is taught through one or more of these 7 visual types. No plain text without a visual attached.

---

#### Type 1: The Plumbing Sketch
**When:** Section 3 (Plumbing Analogy) of every module — always the first visual
**What it is:** A literal hand-drawn-style illustration of pipes, valves, water, and pressure. No technical boxes. Pure physical metaphor.
**Purpose:** Give the brain a concrete anchor before any abstraction. The student understands the physical version first.

Examples:
- Cache = drawing of a bucket sitting next to a workstation vs. a far-away reservoir. Worker reaches to bucket instead of walking to reservoir every time.
- Circuit breaker = drawing of a pressure relief valve. Pipe pressure too high → valve pops open → downstream pipe protected → valve resets when pressure drops.
- Load balancer = drawing of a water manifold splitting one fat incoming pipe into 3 smaller outgoing pipes, each going to an identical tank.
- Rate limiter = drawing of a flow restrictor on a garden hose. One neighbor can't drain the whole street's water pressure.
- Message queue = drawing of a buffer tank absorbing a flood. The service (worker) drinks from the tank at its own pace. Tank absorbs the spike.

---

#### Type 2: The System Diagram
**When:** Section 4 (The Component) — the technical view after the plumbing sketch
**What it is:** SVG architecture diagram using consistent notation. Boxes, cylinders, arrows, icons.
**Purpose:** Teach the visual vocabulary of real engineering diagrams.

**Notation:**
```
┌─────────────┐   = service / application
│  Service A  │
└─────────────┘

╔═════════════╗   = database (double border = persistent)
║   DB        ║
╚═════════════╝

┌── Cache ──┐   = cache (lighter fill, lightning bolt icon)
└───────────┘

[▓▓▓ Queue ▓▓▓]   = message queue (striped = buffer)

──────────→       = synchronous data flow
- - - - - →       = asynchronous data flow
══════════→       = high-volume primary path
──✕──────→       = blocked / failed connection
─ 🔒 ──────→     = encrypted / auth-gated connection
```

Every diagram in the course uses this notation. By module 5, the student reads it faster than prose.

---

#### Type 3: The Flow Animator
**When:** Section 4 (The Component) — runs automatically when the section loads
**What it is:** The system diagram from Type 2, but animated. Blue dots travel along the arrows at realistic relative speeds. The student watches data move.
**Purpose:** Show the dynamic behavior of a system, not just its static shape. A diagram tells you the pipes exist. The animation shows you the water moving.

Behaviors:
- Dots spawn at the source (user/browser icon)
- Travel along arrows at speed proportional to the real-world timing
- Slow segments: dots bunch up, turn orange
- Fast segments: dots zip through, stay blue
- Blocked path: dot hits ✕ and turns red, bounces back
- Cache hit: dot never reaches the database, gets intercepted by cache, returns immediately (fast)
- Cache miss: dot passes through empty cache, travels to database, returns slower

Student can press: **Pause** / **Step-by-step** / **Show failure** (injects a red broken component, watch cascade)

---

#### Type 4: The Failure Cascade Animator
**When:** Section 6 (How It Breaks) — one animation per failure mode
**What it is:** Flow Animator (Type 3) but with a deliberate failure injected. The student watches the failure propagate.
**Purpose:** Build pattern recognition for failure modes. The student sees the cascade before they can explain it. Pattern recognition comes first.

How it works:
1. System starts healthy — blue dots flowing
2. A component turns red (failure injected — labeled: "Database goes down")
3. The cascade unfolds in slow motion:
   - Dots arriving at the broken component pile up (orange, then red)
   - Upstream components fill up (buffer overflow: their borders pulse red)
   - Services waiting for responses hang (dots freeze, timer appears)
   - Timeouts fire (auto-shutoff valves activate — shown as valve icon closing)
   - Error responses propagate back to user (red dot reaches browser)
4. Text appears: "What just happened? → [explanation]"

Each failure animation has a "With vs Without" toggle:
- **Without circuit breaker**: watch the cascade spread to every connected service
- **With circuit breaker**: watch the circuit breaker trip, isolate the failure, other services unaffected

---

#### Type 5: The Spot-the-Problem Interactive
**When:** Section 7 (Spot the Problem) — the active exercise before the quiz
**What it is:** A static system diagram with a deliberate flaw. Student taps/clicks the component or connection that is wrong.
**Purpose:** Force active pattern recognition. The student must find the problem, not just recognize it when told. This is the hardest exercise type and the most valuable.

How it works:
1. Diagram renders with 6–10 components
2. Instruction: "Something is wrong with this system. Tap the part that will cause a problem."
3. Student taps a component
   - **Correct**: component highlights green, brief explanation pops up, ✓ XP
   - **Wrong**: component highlights red for 1 second, resets, hint appears ("Look at the relationship between the cache and the auth layer")
4. After 2 wrong attempts: "Reveal" button appears
5. After reveal: comparison diagram shows the fixed version

Difficulty progression across modules:
- **Easy**: Only one obvious thing is wrong (cache before auth)
- **Medium**: Two things wrong, student must find the more critical one
- **Hard**: System looks correct at first glance, problem is in the absence of a component (missing circuit breaker, missing health check, single database with no replica)

---

#### Type 6: The Before/After Comparison
**When:** Section 6 (Failure Modes) and Quiz Type 2
**What it is:** Two diagrams side by side (desktop) or toggled (mobile). Left: broken/inefficient. Right: fixed. The difference is highlighted in green.
**Purpose:** Show the exact structural difference between a bad and good design. The student sees the fix, not just hears about it.

Toggle states:
- **Broken**: red highlights on the problem area, flow animator shows the failure
- **Fixed**: green highlights on what changed, flow animator shows normal operation
- **Diff mode**: only the changed components show, everything else is greyed out (shows the minimal intervention)

---

#### Type 7: The Tradeoff Dial
**When:** Section 5 (The Cost) of every module
**What it is:** An interactive dial or slider that visually shows the tradeoff inherent in a component. Moving the slider changes both sides simultaneously.
**Purpose:** Make the "no free lunch" principle visceral. The student feels the tradeoff, not just reads about it.

Examples:
- **Cache TTL dial**: Slide from "1 minute" to "24 hours"
  - Left side: Freshness meter (drops as TTL increases)
  - Right side: Performance meter (rises as TTL increases)
  - Visual: water in bucket gets darker (staler) as TTL increases, but the bucket fills faster
- **Database replicas**: Slide from 1 replica to 5 replicas
  - Left side: Read speed meter (rises)
  - Right side: Cost meter + Write complexity meter (both rise)
  - Visual: more water towers appear on the map, but the plumber has more pipes to maintain
- **Timeout duration**: Slide from 100ms to 30 seconds
  - Left side: False failure rate (drops as timeout increases)
  - Right side: Cascade risk meter (rises — hung threads pile up)

---

### Per-Module Visual Specification

Each module has a defined set of visuals. This is the complete spec.

---

**Module 1: HTTP** — The Fill-and-Drain Pipe
- Type 1 (Plumbing): Faucet opens → water flows through a pipe into a glass → pipe drains completely → faucet closes. Label: "One request. One response. Then the connection closes."
- Type 2 (System): Browser → arrow → Server. Show the request envelope going right, response envelope coming left.
- Type 3 (Flow): Animated dot leaves browser, travels to server, server processes (dot pulses), dot returns to browser as different color. Pipe closes (greys out) after response.
- Type 4 (Failure): Server goes red (crashes). Dot reaches server, bounces back as red error dot. Browser shows error state.
- Type 7 (Tradeoff): Connection overhead dial. Each HTTP request opens/closes connection. New connection costs ~50ms. Show: many small requests = many connection costs vs fewer large requests = less overhead.

---

**Module 2: DNS** — The Address Book
- Type 1 (Plumbing): You ask a postal worker "where does John Smith live?" They check a book, give you the address. You now have the pipe address to send your letter.
- Type 2 (System): Show the lookup chain — Browser cache → OS cache → DNS Resolver → Root Nameserver → TLD Nameserver (.com) → Authoritative Nameserver → IP address returned.
- Type 3 (Flow): Animated lookup chain. Dot travels right asking each node. First cache hit stops the chain immediately and returns fast. Cache miss travels all the way to the end.
- Type 4 (Failure): DNS server down. Dot reaches broken DNS node. Nothing can resolve. All requests fail even though the actual app server is healthy. Visual shows: app server is green, but nobody can find it.
- Type 5 (Spot): Diagram where a cached DNS entry is pointing to old IP (server was migrated). Show traffic going to wrong server.

---

**Module 3: APIs** — Standardized Fittings
- Type 1 (Plumbing): Two pipes with different fitting shapes — they cannot connect. A standardized fitting (API) in the middle: both sides connect to the standard shape. Change one side without affecting the other, as long as the fitting stays the same.
- Type 2 (System): Service A → [API Contract] → Service B. Show the contract as a document icon between them.
- Type 3 (Flow): Request leaves A, passes through the contract check (does it have the right shape?), enters B. Return response does the same.
- Type 4 (Failure): Service A changes the shape of the data it sends without updating the contract. Dot hits the contract checker, bounces back. Service B never receives the data.
- Type 6 (Before/After): No API contract (A talks directly to B's internals) → With API contract (A talks to the public interface). Show: changing B's internals now doesn't break A.

---

**Module 4: WebSockets** — The Always-Open Pipe
- Type 1 (Plumbing): HTTP = walkie-talkie (press to talk, release, wait for reply, conversation ends). WebSocket = telephone call (both can speak at any time, line stays open).
- Type 2 (System): Side-by-side. Left: HTTP showing open→request→response→close for each message. Right: WebSocket showing one open→[many messages flowing both ways continuously]→close.
- Type 3 (Flow): HTTP side: dot travels, returns, line goes grey, new dot has to re-establish (small delay each time). WebSocket side: dots flow continuously both directions on a permanently lit connection.
- Type 7 (Tradeoff): Connection persistence slider. WebSocket: one connection open forever → low latency for subsequent messages, but resources held. HTTP: new connection per request → higher latency, but resources released immediately.

---

**Module 5: Databases** — The Main Reservoir
- Type 1 (Plumbing): A large underground reservoir. Water goes in (writes). Water comes out (reads). Even if the pump above ground breaks, the water is still there when it's fixed. Compare to: water in a bucket (in-memory) — pump breaks, bucket spills, water gone.
- Type 2 (System): SQL DB shown as organized shelving unit with labeled rows and columns. NoSQL DB shown as open warehouse floor with boxes of different shapes.
- Type 3 (Flow): Write operation — dot enters reservoir, reservoir level rises. Read operation — dot exits reservoir via labeled pipe (the query). Show an index as a fast-access shortcut pipe directly to the right shelf.
- Type 4 (Failure): No index on a large table. Read query dot has to check every single shelf (full table scan). Show it as the dot wandering through every aisle in the warehouse. With index: dot goes directly to the right location.
- Type 5 (Spot): Show a system where 3 different services all write directly to the same database with no connection limit. Database gets overwhelmed (too many pipes draining from the reservoir simultaneously).

---

**Module 6: Caches** — The Bucket Next to You
- Type 1 (Plumbing): Plumber working far from the reservoir. Every time they need water, they walk 200 meters to the reservoir and back. Then they put a bucket next to their workstation. Same water. But 95% of trips are now 1 meter, not 200 meters.
- Type 2 (System): Browser → Cache (fast, nearby) → Database (slow, far). Show cache hit (dot stops at cache, returns fast) vs cache miss (dot passes through empty cache, continues to database).
- Type 3 (Flow): Cache hit: blue dot travels to cache, immediately returns. Total trip: very short. Cache miss: dot passes through cache, continues to DB, returns slowly, deposits copy in cache on the way back.
- Type 4 (Failure): Cache poisoning. Bad data enters cache. Now 1000 users get the bad data until TTL expires. Visual: contamination spreading from cache to all users reading from it.
- Type 7 (Tradeoff): TTL dial. Short TTL = fresh water in bucket but you refill it constantly. Long TTL = stale water but you rarely make the long trip. Freshness vs performance meters.

---

**Module 7: CDN** — Water Towers Near Users
- Type 1 (Plumbing): City water tower. Rather than pumping water from the treatment plant to every house on demand (high latency, high load on treatment plant), you fill local towers at low traffic times. Users draw from the nearest tower.
- Type 2 (System): World map. Origin server in Toronto. CDN nodes in: Singapore, London, São Paulo, Tokyo. User in each city sends request. Arrow goes to nearest CDN node, not to Toronto.
- Type 3 (Flow): Without CDN: dot from Singapore travels visually all the way to Toronto (long journey, labeled ~200ms). With CDN: dot from Singapore travels to Singapore CDN node (short journey, labeled ~20ms).
- Type 4 (Failure): CDN serves stale content after the origin server updated. Show origin server with new version (green), CDN nodes still serving old version (orange). Users in CDN regions get old data. "Cache invalidation" animation: origin sends purge signal to all CDN nodes.
- Type 5 (Spot): Diagram where dynamic personalized content (user's account balance) is being cached at the CDN. Show user A's data being served to user B.

---

**Module 8: Message Queues** — Buffer Tanks
- Type 1 (Plumbing): A sudden storm floods your water intake with 10x normal flow. Without a buffer tank: flood overwhelms the treatment plant, plant breaks. With a buffer tank: tank absorbs the flood, plant processes at its normal rate, tank drains over time.
- Type 2 (System): Producer → [Queue] → Consumer. Show multiple producers dumping into queue. One consumer draining at its own pace.
- Type 3 (Flow): Spike of 1000 dots arriving at once. Without queue: service overwhelmed, dots turn red. With queue: dots fill the buffer tank, consumer processes them at steady pace. Tank drains over minutes.
- Type 4 (Failure): Queue fills up (no consumer, or consumer too slow). Tank overflows. Messages lost. Visual: queue meter at 100%, new dots bouncing off the full tank.
- Type 7 (Tradeoff): Queue depth vs processing delay slider. Small queue = messages dropped in spikes. Large queue = messages processed but with delay. Real-time vs reliability dial.

---

**Module 9: Authentication** — The Keyed Door
- Type 1 (Plumbing): Building with a locked front door. You present your key (credential). If the key fits the lock, the door opens and you receive a temporary access wristband. You don't show your key again — the wristband proves you already authenticated.
- Type 2 (System): User → [Login] → Auth Service → issues JWT token → User stores token → subsequent requests: User presents token → service validates token → request allowed.
- Type 3 (Flow): First request: dot travels to auth service, token issued, dot returns with token attached. Subsequent requests: dot arrives already carrying token, passes through validator quickly, reaches protected service.
- Type 4 (Failure): Token stored in localStorage (accessible by JS). XSS attack: malicious script reads the token and sends it to attacker's server. Attacker makes requests as the user. Visual: token being copied and sent sideways to bad actor.
- Type 6 (Before/After): No auth (any request can reach any endpoint) → With auth (all requests pass through validator, unauthorized requests bounced).

---

**Module 10: Authorization** — Zone Access Control
- Type 1 (Plumbing): Hotel key card. Gets you through the front door (authentication). But your card only opens your room, the gym, and the pool. Not other guests' rooms. Not the server room. Not the kitchen.
- Type 2 (System): User (authenticated) → API Gateway → Authorization layer (RBAC) → routes to allowed services, blocks routes to forbidden services.
- Type 3 (Flow): Authenticated user with "viewer" role sends request to admin endpoint. Dot reaches authorization layer, checked against role permissions, blocked (turns red), bounced back with 403 error.
- Type 5 (Spot): A system where auth check happens but role check is missing — any authenticated user can access any endpoint. "You verified they're in the building. You didn't check which rooms they're allowed in."

---

**Module 11: Rate Limiting** — The Flow Restrictor
- Type 1 (Plumbing): A water main serving a neighborhood. One neighbor attaches a fire hose and tries to drain the entire main. Without a flow restrictor per address: they drain everyone's pressure. With a flow restrictor: each address gets its fair share, one person can't steal from others.
- Type 2 (System): Multiple users → Rate Limiter (counts requests per user per second) → allowed through or bounced.
- Type 3 (Flow): Normal traffic: dots pass through at reasonable pace. One user suddenly sends 1000 req/sec: their dots start hitting a counter, first 100 pass through, remaining 900 bounce back (red, labeled 429 Too Many Requests). Other users' dots unaffected.
- Type 4 (Failure): Rate limiter implemented per-server, not globally. 10 servers → each allows 100 req/sec → attacker spreads requests across all 10 → gets 1000 req/sec through. Visual: attacker distributing load to bypass per-server limit.

---

**Module 12: API Gateway** — The Main Valve
- Type 1 (Plumbing): A building's main valve with a control panel. Instead of each apartment having its own set of safety checks, filters, and meters — there's one set at the building's entrance. Everything coming in goes through one controlled point.
- Type 2 (System): Before: 5 services each with their own auth, rate limiting, logging — messy, inconsistent. After: 1 gateway handles auth + rate limiting + logging, routes to 5 clean services behind it.
- Type 3 (Flow): Request enters gateway. Auth check (fast). Rate limit check (fast). Request routed to correct service. Response returned. All logged automatically.
- Type 6 (Before/After): Without gateway (complexity everywhere) → With gateway (complexity consolidated at entry point, services are simple).

---

**Module 13: Load Balancers** — The Manifold
- Type 1 (Plumbing): A water manifold in a house. One cold water inlet splits into separate supply lines for: kitchen, bathroom 1, bathroom 2, laundry. Each gets a portion of the flow. If one line is overloaded, it doesn't affect others.
- Type 2 (System): User requests → Load Balancer → [Server A | Server B | Server C]. Show distribution of incoming dots to 3 servers with roughly equal frequency.
- Type 3 (Flow): Servers shown with load meters. Dots distributed round-robin. One server gets slow (orange meter rising). Load balancer starts sending fewer dots there. When a server goes red (down), load balancer stops routing to it entirely.
- Type 5 (Spot): A load balancer that uses sticky sessions + no cache synchronization. User's session data lives on Server A. Load balancer sends them to Server B. Session not found. Visual: user's state disappearing between requests.

---

**Module 14: Reverse Proxies** — The Receiving Clerk
- Type 1 (Plumbing): A large company mailroom. External mail arrives addressed to "Acme Corp". The mailroom clerk (reverse proxy) receives everything, sorts it, delivers to the right department internally. External world only knows "Acme Corp" — they never know which department actually handled it.
- Type 2 (System): Internet → Reverse Proxy → [Internal Service A, B, C, Static Files, etc.]. Proxy hides the internal topology.
- Type 3 (Flow): Request for /api → goes through proxy → routed to API service. Request for /images → goes through proxy → routed to CDN/static service. External sender never knows multiple services exist.

---

**Module 15: Serverless** — On-Demand Pumps
- Type 1 (Plumbing): Instead of a pump that runs 24/7 whether you need water or not, imagine a pump that materializes the moment you turn on the tap and disappears when you're done. You pay only for the water pumped, not for the pump sitting idle.
- Type 2 (System): 0 requests → 0 functions. 1 request → 1 function spins up. 10,000 requests → 10,000 functions. Back to 0 → back to nothing. Compare to: traditional server sitting at 100% cost regardless of traffic.
- Type 3 (Flow): Idle state: blank canvas. Request arrives: function spins up (brief cold start delay shown). Request processed. Function disappears. Scale-to-zero visualization.
- Type 7 (Tradeoff): Scale vs cold start dial. Massive scale possible, but cold starts add ~100ms on first request. Consistent server: no cold start, but paying even at 0 traffic.

---

**Module 16: Containers** — Prefabricated Pipe Sections
- Type 1 (Plumbing): Pre-assembled, standardized pipe section. Made in a factory to exact specifications. Works in any building. No on-site fitting required. Same part runs the same way in every installation.
- Type 2 (System): Show: same container image → runs on developer laptop → runs on staging server → runs on production cloud. Identical behavior everywhere. Compare to: "works on my machine" problem.
- Type 4 (Failure): Container without resource limits. One rogue container consumes all server memory. Other containers starve. Visual: one container growing to fill the whole server, others shrinking.

---

**Module 17: Timeouts & Retries** — Shutoffs and Valve Reopeners
- Type 1 (Plumbing): A washing machine that won't start if it doesn't get water within 60 seconds (timeout). If the tap was just temporarily stuck, it tries again (retry). After 3 tries with no water, it gives up and shows an error.
- Type 2 (System): Caller → [Timer] → Called Service. Timer counts. If response arrives before timer fires: success. If timer fires first: caller aborts, takes action. Retry shows the same flow happening again with exponential backoff labels.
- Type 3 (Flow): Dot sent to slow service. Timer appears, counting up. Service hasn't responded by T=5s. Dot is recalled (turns grey), new dot sent after 1s wait (retry 1), then 2s wait (retry 2), then 4s wait (retry 3). After 3 tries, error returned to user.
- Type 4 (Failure): No timeout + downstream service hangs. Threads accumulate waiting for response. Thread pool exhausted. New requests queue. Queue fills. System appears completely hung. Visual: threads piling up, new requests unable to start.

---

**Module 18: Circuit Breakers** — Pressure Relief Valves
- Type 1 (Plumbing): A pressure relief valve on a boiler. Normal operation: valve closed, pressure contained. Pressure exceeds safe threshold: valve pops open, releases pressure, boiler protected. Pressure normalizes: valve closes, system restored.
- Type 2 (System): Three states shown side by side: CLOSED (normal, requests flow), OPEN (tripped, all requests immediately rejected), HALF-OPEN (testing, one request let through to check health).
- Type 3 (Flow): Normal: dots flow through circuit breaker to service (CLOSED). Service fails repeatedly → circuit opens → subsequent dots bounce immediately at the circuit breaker (OPEN, fast fail). After timeout, one test dot sent (HALF-OPEN). Succeeds → circuit closes. Fails → circuit stays open.
- Type 6 (Before/After): Without circuit breaker: service A slowdown → all threads in service B waiting → service B unresponsive → service C (which calls B) also hangs → full cascade. With circuit breaker: service A slowdown → circuit opens → service B fails fast, threads released → service B still serves other requests normally.

---

**Module 19: Fallback Chains** — Alternate Routes
- Type 1 (Plumbing): A main water supply + backup tank + emergency well. If main supply cuts out, valve automatically switches to backup tank. If tank empties, switch to emergency well. If that's dry, turn on water conservation mode (reduced pressure). At each stage: something, not nothing.
- Type 2 (System): Request → Try Provider A → [fail?] → Try Provider B → [fail?] → Return cached result → [no cache?] → Return degraded response.
- Type 3 (Flow): Dot hits provider A. Provider A is red (down). Dot automatically redirected to provider B. B is slow (orange) but works. Dot returns with response. Show the auto-rerouting as branching arrows with conditions.
- Type 7 (Tradeoff): Fallback quality vs reliability dial. More fallbacks = higher reliability but each fallback produces a lower quality response. Zero fallbacks = either perfect or nothing.

---

**Module 20: Health Checks** — Pressure Gauges
- Type 1 (Plumbing): A smart water system that checks each pipe segment every 30 seconds: send a small pulse of water, check if it returns. If a segment doesn't respond, mark it as broken, reroute flow around it.
- Type 2 (System): Load balancer → periodic ping to each server (every 10s). Server responds "healthy" → green, continues receiving traffic. Server misses 3 pings → red, removed from pool. Server recovers → re-added.
- Type 3 (Flow): Periodic small dots sent from load balancer to each server (health check pings). One server stops responding. After 3 missed pings, load balancer stops routing real traffic to it. Server fixed, pings resume, traffic restored.

---

**Module 21: Logging** — The Written Record
- Type 1 (Plumbing): An inspector watching your entire plumbing network. At every valve, junction, and pump, they write: time, state, flow rate, any anomalies. When something breaks later, they can read back through the log to find exactly when and where it went wrong.
- Type 2 (System): Request flows through 5 services. At each service, a log entry is written to a central log store. Show the log store filling up with timestamped entries.
- Type 3 (Flow): Request travels through the system. At each service hop, a small log entry visually peels off and flies to the log store. After the request completes, the log store has a complete trail.
- Type 4 (Failure): Unstructured logs (`console.log("error happened")`). Show: trying to search 1 million log lines for all 500 errors affecting user ID 42. Contrast with structured logs (JSON): instant filter query.
- Type 6 (Before/After): Unstructured logs (single unsearchable string) → Structured logs (JSON with fields: userId, requestId, status, duration, error). Show search query finding all relevant entries in milliseconds.

---

**Module 22: Metrics & Alerting** — Gauges and Alarms
- Type 1 (Plumbing): Control room. Wall of pressure gauges — one per pipe segment. All in the green zone. One gauge moves into red. Alarm sounds. Engineer checks that specific pipe. Without the gauges: you find out when users complain or when the pipe bursts.
- Type 2 (System): System → [Metrics Collector] → [Dashboard with gauges: Request Rate, Error Rate %, Latency p99, CPU, Memory]. Alert thresholds shown as red lines on each gauge. When gauge crosses red line → Alert fires → PagerDuty → Engineer's phone.
- Type 3 (Flow): Normal operation: all gauges in green. Slow increase in error rate. Error rate gauge approaches red line. Alert fires. Simultaneously: latency p99 rises. Dashboard shows both anomalies. Root cause: database running slow (DB gauge also rising).
- Type 5 (Spot): System with metrics but alerts set too sensitive (alerts fire for every tiny spike → alert fatigue → engineers ignore alerts → real incident missed). Show: 50 alerts per day, all ignored, then a real incident fires alert #51.

---

**Module 23: Distributed Tracing** — Following One Molecule
- Type 1 (Plumbing): Dye testing. You inject a colored tracer chemical into one specific water molecule in a complex network of pipes. Then you watch which pipes it passes through, how long it spends in each section, where it slows down.
- Type 2 (System): Request enters system. A unique trace ID is attached. Every service adds a "span" (start time + end time + metadata) to the trace. Final trace shows a waterfall: Service A (50ms) → Service B (200ms) → DB query (180ms) → Service C (5ms).
- Type 3 (Flow): One request enters as a specifically colored dot (unique trace). The dot travels through services. At each service, a span bar appears in a timeline panel below. Spans stack in the waterfall. One span is clearly much longer than others — that's the bottleneck.
- Type 5 (Spot): Distributed trace showing a service that calls another service synchronously 5 times in a loop rather than once in parallel. Waterfall shows 5 sequential spans that could be 1 parallel span — a massive latency optimization waiting to happen.

---

**Module 24: Scaling Patterns** — Bigger Pipes vs More Pipes
- Type 1 (Plumbing): Your restaurant's kitchen sink is overwhelmed. Option A: replace it with a bigger sink (vertical scaling). Option B: add more sinks (horizontal scaling). Bigger sink hits a physical limit (they don't make them infinitely big). More sinks: keep adding until the building runs out of space.
- Type 2 (System): Side by side. Left: one very large box (vertical scaling). Right: load balancer + 10 smaller identical boxes (horizontal scaling). Show cost, complexity, and maximum capacity for each.
- Type 3 (Flow): Traffic load slider. Drag slider from "low" to "extreme". Vertical: one server handles more and more until it hits 100% CPU → requests start failing. Horizontal: load balancer distributes across growing fleet, auto-scales with traffic.
- Type 7 (Tradeoff): Scale ceiling vs complexity dial. Vertical = simple, hard ceiling. Horizontal = complex (shared state problem, consistency), no ceiling.

---

### Visual Progression Rule

Every module introduces exactly one new visual concept. The student is never shown something visually unfamiliar without it being introduced explicitly.

- Module 1: introduces the Flow Animator (watch data move)
- Module 2: introduces the lookup chain animation (multi-hop traversal)
- Module 3: introduces the contract check animation (shape matching)
- Module 5: introduces the Spot-the-Problem interactive
- Module 6: introduces the Tradeoff Dial
- Module 8: introduces the buffer fill animation (queue depth visualization)
- Module 13: introduces the Before/After Comparison toggle
- Module 18: introduces the three-state machine animation (circuit breaker states)
- Module 23: introduces the waterfall trace visualization

By module 24, all 7 visual types are familiar. The Phase 8 (System Reading) exercises use all of them simultaneously.

---

## The Five Mental Models (woven throughout, not taught once)

These thinking patterns appear in every module. They are the difference between someone who memorizes components and someone who can reason about systems they've never seen.

### 1. Inversion
Don't ask "how do I make this work?" Ask "how does this fail?" Design backwards from the failure. List every way the system can break before you build it. Fix the most catastrophic ones first.

### 2. Trust Boundaries
Every system has a line between data you control and data you don't. Find that line. Everything crossing it is a potential vulnerability. Never trust data that crosses a trust boundary without validating it.

### 3. The Cost of Coupling
Every time component A needs to know about component B to work, you've created a dependency. Dependencies are the source of cascading failures. Good systems fail independently. Bad systems fail together.

### 4. Latency is Physics
Data travels at roughly the speed of light. A round trip from Toronto to London takes ~100ms minimum, no matter how fast your code is. You cannot optimize physics. You can only move data closer to where it's needed.

### 5. Observability Before Optimization
You cannot optimize what you cannot measure. You cannot fix what you cannot see. Every system needs instruments before it needs improvements. Build the window into your system before you need to look through it.

---

## App Requirements (for the new build)

### Core experience
- Student progresses through 24 modules in order (each unlocks on completion of previous)
- Each module: lesson → interactive diagram exercises → quiz
- XP system for motivation (existing pattern is good, keep it)
- Skill tree view of all 24 modules with lock/unlock state

### New interaction types needed (beyond existing)
- **Diagram viewer** — render ASCII-style or SVG system diagrams inline in lessons
- **Spot the problem** — clickable diagram where student taps the broken component
- **Flow animator** — animate data flowing through a diagram (show the water moving)
- **Quiz type 2/3/4** — diagram-based questions, not just text MCQ

### Technical stack
- React + TypeScript
- **Tailwind CSS** (required — shadcn/ui depends on it)
- **shadcn/ui** — use for ALL UI components. Do not build buttons, cards, dialogs, sliders, progress bars, tabs, tooltips from scratch. Every interactive element comes from shadcn.
- **animata.design** — use for ALL animations. Do not build animations from scratch. Map every visual type to an animata component before writing custom animation code.
- Vite
- Deploy: Fly.io
- No backend — all content is static TypeScript data, progress in localStorage

### Theme
- **Light mode only. No dark mode. No dark mode toggle. No `dark:` Tailwind classes.**
- Background: warm off-white (not pure white)
- Primary accent: the course's green (#58cc02 or similar — keep from current brand)
- Danger: red. Warning: orange. Success: green. These map directly to the visual color language.

### animata.design → Visual Type mapping
Before building any animation, check animata.design first. Likely matches:
- **Flow Animator (Type 3)** → animata beam / particle / flow components
- **Failure Cascade (Type 4)** → animata pulse / ripple / border-beam on components turning red
- **Tradeoff Dial (Type 7)** → shadcn Slider + animata number ticker for the meters
- **Plumbing Sketch (Type 1)** → animata draw / path animation components
- **Before/After toggle (Type 6)** → animata flip / morph components
- **Spot the Problem (Type 5)** → shadcn card components + animata shake/highlight on tap

### shadcn/ui → UI element mapping
- Module cards on skill tree → shadcn `Card`
- Progress bar → shadcn `Progress`
- Quiz options → shadcn `Button` (variant: outline, with state classes)
- Tradeoff Dial → shadcn `Slider`
- Before/After toggle → shadcn `Tabs` or `Toggle`
- Hint tooltips → shadcn `Tooltip`
- Module locked state → shadcn `Badge`
- XP display → shadcn `Badge` with custom color
- Diagrams → raw SVG (no component library needed — it's drawing, not UI)

### Content authoring
All lesson content lives in TypeScript data files.
No CMS needed at this stage. Content is code.

---

## What Success Looks Like

A student who completes this course can:

**Given a diagram they've never seen:**
*"This is an e-commerce checkout flow. Data enters through the API gateway → hits the auth service → goes to the product service → hits the inventory database. I see two problems immediately: the inventory database is a single instance with no read replica — that's a single point of failure and a read bottleneck during sales. And the cache is placed before auth, which means product data could be served to unauthenticated users. The fix: add a read replica to the database, and move the cache to after the auth boundary."*

**Given a performance complaint:**
*"Users say checkout is slow on mobile in Southeast Asia. The servers are in Toronto. That's 200ms of physics before a single line of code runs. The fix isn't faster code — it's a CDN or edge function that handles product catalog reads from Singapore."*

**Given a reliability incident:**
*"The payment service went down and took down the entire app. That means the checkout service was making synchronous calls to payment with no circuit breaker. When payment slowed to 10 second responses, checkout's thread pool filled up, and then every other service that called checkout also hung. Add a circuit breaker on the payment call. Make checkout degrade gracefully when payment is unavailable — queue the request, show the user a 'processing' state, confirm asynchronously."*

That person is a systems architect. That's the goal.
