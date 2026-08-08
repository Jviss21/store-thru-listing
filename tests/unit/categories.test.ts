import { describe, expect, it } from "vitest";
import { defaultAdminImsState } from "@/lib/admin-ims";
import { CATEGORIES } from "@/lib/mock-data";

const REQUIRED = [
  "Clothing",
  "Collectibles",
  "Computers & Electronics",
  "Home",
  "Jewelry",
];

describe("intake categories", () => {
  it("Admin IMS seed includes major intake categories", () => {
    const names = defaultAdminImsState().categories.map((c) => c.name);
    for (const name of REQUIRED) {
      expect(names).toContain(name);
    }
  });

  it("floor mock CATEGORIES includes apparel / jewelry / collectibles / electronics / home-adjacent", () => {
    expect(CATEGORIES.length).toBeGreaterThan(5);
    expect(CATEGORIES).toEqual(expect.arrayContaining(["Electronics", "Collectibles"]));
    expect(
      CATEGORIES.some((c) => /apparel|home|jewelry/i.test(c))
    ).toBe(true);
  });
});
