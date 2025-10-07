# Async Ricochet Robots - Out of Scope Features

## Overview

This document tracks features and optimizations that have been identified but are explicitly out of scope for the current implementation. These may be revisited in future versions.

---

## Deferred Features

### 1. BFS Solver for Validation

**Description**: Breadth-First Search algorithm to find optimal solutions

**Potential Uses**:
- Validate that generated puzzles are solvable
- Estimate puzzle difficulty (optimal move count)
- Provide hints to players
- Auto-verify solution optimality

**Why Out of Scope**:
- L-shaped wall design guarantees solvability (goal in corner of L-shape)
- Adds complexity without immediate user value
- Solution validation works without knowing optimal path
- Can be added later if difficulty tuning becomes important

**Future Consideration**: Could enhance puzzle generation by filtering out trivially easy puzzles

---

### 2. Skip Cooldown (Prevent Immediate Re-Selection)

**Description**: Prevent immediately re-selecting a goal that was just skipped

**Current Behavior**: 
- Host skips goal → goal returns to available pool
- Starting new round immediately could randomly select same goal
- No cooldown or exclusion logic

**Proposed Enhancement**:
- Exclude most recently skipped goal from next round selection
- OR require at least one round between skip and re-selection
- OR track skip count and deprioritize frequently-skipped goals

**Why Out of Scope**:
- Edge case that won't happen frequently in practice
- Random selection makes immediate re-selection unlikely (1 in N chance where N = remaining goals)
- Host can simply skip again if needed
- Adds state management complexity

**Future Consideration**: Track skip patterns and add smart selection if users report frustration

---

### 3. Timer Function Optimization for Large Scale

**Description**: Optimize cross-partition query for round expiration checking

**Current Implementation**:
- Timer function runs every 1 minute
- Scans ALL partitions to find active rounds where `endTime < now`
- Cross-partition query is expensive at scale

**Scale Concern**:
- At 100+ concurrent games, query performance degrades
- Each game has its own partition
- No secondary index on status + endTime

**Potential Solutions**:
- Add secondary index table for active rounds
- Use Azure Functions Durable Entities for round timers
- Cache active round list in Redis with 1-minute TTL
- Move to time-series database for better range queries

**Why Out of Scope**:
- Current target scale: <50 concurrent games
- Timer runs infrequently (every 1 minute, not per request)
- Performance acceptable at hobby scale
- Premature optimization

**Future Consideration**: Monitor timer execution time; optimize when >50 active games or >1s execution time

---

## Explicitly Rejected Features

### 1. Automatic Round Creation

**Description**: Auto-start next round when previous ends

**Why Rejected**:
- Project brief explicitly requires "host-controlled rounds"
- Removes host agency and timing control
- Not aligned with core design principle

**Status**: Will not implement

---

### 2. Player Solution Resubmission

**Description**: Allow players to update/replace their solution

**Why Rejected**:
- Design choice: "One solution per round" encourages thoughtful solving
- Players can practice locally unlimited before submitting
- Prevents trial-and-error spam
- Creates competitive tension

**Status**: Will not implement (core design decision)

---

## Notes

- This document should be reviewed periodically as the project evolves
- Features may move from "Deferred" to "Active Development" based on user feedback
- Rejected features should only be reconsidered if core requirements change
