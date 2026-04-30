# Euclidea Clone: Manual Smoke Tests

Before deploying or submitting major engine refactors, contributors should manually verify the core functionality of the geometry engine. These "smoke tests" are designed to catch regressions in the user experience that unit tests might miss.

To run these tests, start the development server (`npm run dev`) and open the application in your browser.

---

## 1. The DAG Cascade Test (Dependency Graph)
**Goal:** Verify that deleting a parent shape recursively destroys all children that depend on it.

**Steps:**
1. Select the **Line Tool**. Draw two lines that cross each other, forming an "X".
2. Verify that an orange intersection point automatically appears where they cross.
3. Select the **Circle Tool**. Snap to the center intersection point, drag outward, and draw a circle.
4. Select the **Eraser Tool**.
5. Click on **one** of the original lines.

**Expected Result:**
The erased line vanishes. The intersection point instantly vanishes. The circle (which depended on that intersection point for its center) also instantly vanishes. The *other* original line remains perfectly intact.

---

## 2. The Snapping & Auto-Intersection Test
**Goal:** Verify that pure math intersections are generating snappable points correctly.

**Steps:**
1. Select the **Circle Tool**. Draw a circle.
2. Draw a second circle that overlaps the first one (like a Venn diagram).
3. Verify that two orange intersection points automatically appear where the edges cross.
4. Select the **Line Tool**. 
5. Hover your mouse near the top intersection point. Verify the blue "snap ring" appears. Click to start a line.
6. Hover near the bottom intersection point. Verify the blue ring appears. Click to finish the line.

**Expected Result:**
The line should perfectly bisect the two overlapping circles exactly at their mathematical intersections.

---

## 3. The Immutability Test (Undo / Clear)
**Goal:** Verify that the Action History array is properly tracking the board state without mutating previous states.

**Steps:**
1. Click **Clear** to ensure the board is at the starting state (Level 1 base points).
2. Draw a line.
3. Draw a circle.
4. Use the Eraser to delete the line.
5. Click the **Undo** button in the top right.

**Expected Result:**
Clicking Undo once should bring the line back. Clicking it again should remove the circle. Clicking it a third time should remove the line, leaving you with just the starting points.

---

## 4. The Level Verification Test
**Goal:** Verify that the `LevelVerifier` semantic helpers successfully identify a winning condition based on geometric shape, regardless of the exact path taken to get there.

**Steps:**
1. Click **Clear** to reset Level 1.
2. Select the **Circle Tool**. Draw a circle from the left given point to the right given point.
3. Draw a second circle from the right given point back to the left given point.
4. Select the **Line Tool**. Draw a line from the left given point to the *top* intersection of the two circles.
5. Draw a line from the right given point to the *top* intersection.

**Expected Result:**
The moment the mouse is released on the final line, a large green "Level Complete!" overlay should appear in the top center of the screen.

*Alternative test:* Click Clear, and repeat the process but draw the lines to the *bottom* intersection instead. The level should still complete successfully.