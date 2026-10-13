import { describe, expect, it } from "vitest";

import { followUpState, groupLeads, timeAgo } from "./time";
import type { Lead } from "./types";

// Built with local-time constructors so the tests pass in any timezone.
const now = new Date(2026, 9, 15, 12, 0);
const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).toISOString();

const lead = (id: number, next_follow_up_at: string | null): Lead => ({
  id,
  name: `Lead ${id}`,
  company: null,
  phone: null,
  status: "new",
  next_follow_up_at,
  created_at: at(1, 9),
  last_note: null,
});

describe("followUpState", () => {
  it("compares by calendar day, not by hour", () => {
    expect(followUpState(at(15, 8), now)).toBe("today"); // earlier today is still "today"
    expect(followUpState(at(15, 23), now)).toBe("today");
    expect(followUpState(at(14, 23), now)).toBe("overdue");
    expect(followUpState(at(16, 0), now)).toBe("upcoming");
    expect(followUpState(null, now)).toBeNull();
  });
});

describe("groupLeads", () => {
  it("puts overdue and today's leads in their own sections, soonest first", () => {
    const groups = groupLeads(
      [lead(1, null), lead(2, at(15, 17)), lead(3, at(12, 9)), lead(4, at(15, 9)), lead(5, at(20, 9)), lead(6, at(13, 9))],
      now,
    );
    expect(groups.overdue.map((l) => l.id)).toEqual([3, 6]);
    expect(groups.today.map((l) => l.id)).toEqual([4, 2]);
    expect(groups.rest.map((l) => l.id)).toEqual([1, 5]); // keeps the API's order
  });
});

describe("timeAgo", () => {
  it("uses the largest whole unit", () => {
    expect(timeAgo(new Date(now.getTime() - 30_000).toISOString(), now)).toBe("just now");
    expect(timeAgo(new Date(now.getTime() - 2 * 3600_000).toISOString(), now)).toBe("2 hours ago");
    expect(timeAgo(new Date(now.getTime() - 2 * 86400_000).toISOString(), now)).toBe("2 days ago");
    expect(timeAgo(new Date(now.getTime() - 86400_000).toISOString(), now)).toBe("yesterday");
    expect(timeAgo(new Date(now.getTime() - 21 * 86400_000).toISOString(), now)).toBe("3 weeks ago");
  });
});
