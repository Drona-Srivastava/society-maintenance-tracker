const { chromium } = require("playwright");

const BASE_URL =
  process.env.DEMO_URL ||
  "https://society-maintenance-tracker-drona.vercel.app";

const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

/*
 * Demo history we want to create.
 *
 * #8  - existing IN_PROGRESS complaint + admin note
 * #9  - leave OPEN
 * #10 - existing IN_PROGRESS complaint + admin note
 * #11 - leave OPEN
 * #12 - OPEN -> IN_PROGRESS -> RESOLVED
 * #13 - OPEN -> IN_PROGRESS -> RESOLVED
 */

const TARGETS = {
  8: {
    note:
      "Maintenance team has been assigned to inspect the affected area. The issue is being monitored pending completion of the repair.",
  },

  10: {
    note:
      "Lift inspection has been requested from the maintenance team. The lift will remain under observation until the technician's assessment is completed.",
  },

  12: {
    progressNote:
      "Electrical maintenance team has been assigned to inspect the parking area light.",
    resolutionNote:
      "The faulty light was replaced and the parking area was checked to confirm normal operation.",
  },

  13: {
    progressNote:
      "The plumbing team has been asked to inspect the water pressure issue and check the affected supply line.",
    resolutionNote:
      "The water supply line was inspected and the pressure issue was addressed.",
  },
};

/* =========================================================
   CONFIG VALIDATION
========================================================= */

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(`
Missing admin credentials.

Run:

export DEMO_URL="https://society-maintenance-tracker-drona.vercel.app"
export DEMO_ADMIN_EMAIL="your-admin-email"
export DEMO_ADMIN_PASSWORD="your-admin-password"

Then run:

node scripts/seed-demo-history.js
`);

  process.exit(1);
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function waitForApp(page) {
  await page.waitForTimeout(1000);

  try {
    await page.waitForLoadState("networkidle", {
      timeout: 10000,
    });
  } catch {
    // React/Vite/Vercel applications can keep requests open.
    // This is not a failure.
  }
}

async function saveScreenshot(page, filename) {
  const path = `scripts/${filename}.png`;

  await page.screenshot({
    path,
    fullPage: true,
  });

  console.log(`  Screenshot saved: ${path}`);
}

/* =========================================================
   LOGIN
========================================================= */

async function login(page) {
  console.log("→ Opening login page");

  await page.goto(`${BASE_URL}/login`, {
    waitUntil: "domcontentloaded",
  });

  await waitForApp(page);

  console.log(`  URL: ${page.url()}`);

  /*
   * Login.jsx uses:
   *
   * <input type="email">
   * <input type="password">
   *
   * We deliberately use the input types rather than labels.
   */

  const emailInput = page
    .locator('input[type="email"]')
    .first();

  const passwordInput = page
    .locator('input[type="password"]')
    .first();

  await emailInput.waitFor({
    state: "visible",
    timeout: 10000,
  });

  await passwordInput.waitFor({
    state: "visible",
    timeout: 10000,
  });

  console.log("✓ Login form found");

  await emailInput.fill(ADMIN_EMAIL);
  await passwordInput.fill(ADMIN_PASSWORD);

  /*
   * Login is the first form on the page in the current
   * application.
   */

  const form = page
    .locator("form")
    .first();

  const submitButton = form
    .locator('button[type="submit"]')
    .first();

  await submitButton.waitFor({
    state: "visible",
    timeout: 10000,
  });

  console.log("→ Submitting admin login");

  await submitButton.click();

  /*
   * AuthContext performs the API request and Login.jsx
   * redirects admin users to /admin.
   */

  await page.waitForTimeout(2500);

  try {
    await page.waitForLoadState("networkidle", {
      timeout: 10000,
    });
  } catch {
    // Ignore.
  }

  console.log(`  URL after login: ${page.url()}`);

  const body = await page
    .locator("body")
    .innerText();

  const lowerBody = body.toLowerCase();

  if (
    lowerBody.includes("invalid email or password") ||
    lowerBody.includes("unable to log in") ||
    lowerBody.includes("incorrect password")
  ) {
    await saveScreenshot(
      page,
      "login-error"
    );

    throw new Error(
      "Admin credentials were rejected."
    );
  }

  /*
   * Login.jsx explicitly does:
   *
   * if (loggedInUser.role === "admin") {
   *   navigate("/admin");
   * }
   */

  if (page.url().includes("/admin")) {
    console.log("✓ Admin login successful");
    return;
  }

  /*
   * Fallback if React navigation takes a little longer.
   */

  try {
    await page
      .getByText(/complaints/i)
      .first()
      .waitFor({
        state: "visible",
        timeout: 3000,
      });

    console.log("✓ Admin login successful");
    return;
  } catch {
    await saveScreenshot(
      page,
      "login-debug"
    );

    throw new Error(
      "Could not confirm successful admin login.\n" +
        `Current URL: ${page.url()}\n` +
        "See scripts/login-debug.png"
    );
  }
}

/* =========================================================
   OPEN COMPLAINT
========================================================= */

async function openComplaint(page, id) {
  console.log(`  Opening complaint #${id}`);

  await page.goto(
    `${BASE_URL}/admin/complaints/${id}`,
    {
      waitUntil: "domcontentloaded",
    }
  );

  /*
   * IMPORTANT:
   * Pass page here.
   */
  await waitForApp(page);

  /*
   * ComplaintDetail.jsx contains:
   *
   * id="complaint-status"
   *
   * Wait for it to confirm the page loaded.
   */

  await page
    .locator("#complaint-status")
    .waitFor({
      state: "visible",
      timeout: 10000,
    });
}

/* =========================================================
   GET COMPLAINT BODY
========================================================= */

async function getComplaintBody(page, id) {
  await openComplaint(page, id);

  return await page
    .locator("body")
    .innerText();
}

/* =========================================================
   ADD ADMIN NOTE
========================================================= */

async function addNote(page, id, note) {
  console.log(
    `\n→ Processing admin note for #${id}`
  );

  /*
   * First inspect existing server-rendered history.
   *
   * Comparison is CASE-INSENSITIVE because the UI currently
   * transforms the note when displaying history.
   */

  let body =
    await getComplaintBody(page, id);

  if (
    normalizeText(body).includes(
      normalizeText(note)
    )
  ) {
    console.log(
      `✓ Note already exists on #${id}; skipping.`
    );

    return;
  }

  /*
   * Fill the actual admin-note textarea.
   */

  const noteBox =
    page.locator("#admin-note");

  await noteBox.fill(note);

  console.log("  Note entered.");

  /*
   * Submit through the actual application UI.
   */

  const saveButton =
    page.getByRole("button", {
      name: /save changes/i,
    });

  await saveButton.waitFor({
    state: "visible",
    timeout: 10000,
  });

  await saveButton.click();

  console.log("  Save clicked.");

  /*
   * Give React/API time to finish.
   */

  await page.waitForTimeout(1500);

  /*
   * Reload from the production server and inspect
   * the persisted history.
   */

  body =
    await getComplaintBody(page, id);

  if (
    normalizeText(body).includes(
      normalizeText(note)
    )
  ) {
    console.log(
      `✓ Note successfully recorded for #${id}`
    );

    return;
  }

  /*
   * If we reach here, something genuinely went wrong.
   */

  await saveScreenshot(
    page,
    `complaint-${id}-note-debug`
  );

  console.log(
    "\n  Last part of complaint page:"
  );

  console.log(
    body
      .slice(-2500)
      .replace(/\n/g, " | ")
  );

  throw new Error(
    `Could not verify note for complaint #${id}.`
  );
}

/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(
  page,
  id,
  targetStatus,
  note
) {
  console.log(
    `\n→ Complaint #${id}: target status = ${targetStatus}`
  );

  await openComplaint(page, id);

  const statusSelect =
    page.locator("#complaint-status");

  const currentStatus =
    await statusSelect.inputValue();

  console.log(
    `  Current status: ${currentStatus}`
  );

  /*
   * If the desired state already exists, don't create
   * another status history entry.
   */

  if (currentStatus === targetStatus) {
    console.log(
      `  Complaint #${id} is already ${targetStatus}.`
    );

    /*
     * If a note is associated with this transition,
     * make sure that note exists.
     */

    if (note) {
      const body =
        await page
          .locator("body")
          .innerText();

      if (
        !normalizeText(body).includes(
          normalizeText(note)
        )
      ) {
        const noteBox =
          page.locator("#admin-note");

        await noteBox.fill(note);

        await page
          .getByRole("button", {
            name: /save changes/i,
          })
          .click();

        await page.waitForTimeout(1500);

        const updatedBody =
          await getComplaintBody(
            page,
            id
          );

        if (
          !normalizeText(updatedBody).includes(
            normalizeText(note)
          )
        ) {
          await saveScreenshot(
            page,
            `complaint-${id}-note-debug`
          );

          throw new Error(
            `Could not verify note for #${id}.`
          );
        }

        console.log(
          `✓ Note recorded for #${id}`
        );
      } else {
        console.log(
          `✓ Note already exists for #${id}`
        );
      }
    }

    return;
  }

  /*
   * Change status using the actual UI.
   */

  await statusSelect.selectOption(
    targetStatus
  );

  if (note) {
    await page
      .locator("#admin-note")
      .fill(note);
  }

  await page
    .getByRole("button", {
      name: /save changes/i,
    })
    .click();

  console.log("  Save clicked.");

  await page.waitForTimeout(1500);

  /*
   * Reload from server.
   */

  await openComplaint(page, id);

  const savedStatus =
    await page
      .locator("#complaint-status")
      .inputValue();

  if (savedStatus !== targetStatus) {
    await saveScreenshot(
      page,
      `complaint-${id}-status-debug`
    );

    throw new Error(
      `Complaint #${id}: expected status "${targetStatus}", ` +
        `but server returned "${savedStatus}".`
    );
  }

  console.log(
    `✓ Complaint #${id} → ${targetStatus}`
  );

  /*
   * Verify associated history note.
   */

  if (note) {
    const body =
      await page
        .locator("body")
        .innerText();

    if (
      !normalizeText(body).includes(
        normalizeText(note)
      )
    ) {
      await saveScreenshot(
        page,
        `complaint-${id}-history-debug`
      );

      throw new Error(
        `Status changed successfully for #${id}, ` +
          `but the expected history note was not found.`
      );
    }

    console.log(
      `✓ Admin note verified for #${id}`
    );
  }
}

/* =========================================================
   FINAL HISTORY VERIFICATION
========================================================= */

async function verifyHistory(
  page,
  id,
  expectedTexts
) {
  console.log(
    `\n→ Verifying history for #${id}`
  );

  const body =
    await getComplaintBody(page, id);

  const normalizedBody =
    normalizeText(body);

  for (const expected of expectedTexts) {
    if (
      !normalizedBody.includes(
        normalizeText(expected)
      )
    ) {
      await saveScreenshot(
        page,
        `complaint-${id}-verification-failed`
      );

      throw new Error(
        `Expected history text missing for complaint #${id}:\n\n` +
          expected
      );
    }
  }

  console.log(
    `✓ History verified for #${id}`
  );
}

/* =========================================================
   FINAL STATUS VERIFICATION
========================================================= */

async function verifyFinalStatus(
  page,
  id,
  expectedStatus
) {
  await openComplaint(page, id);

  const actualStatus =
    await page
      .locator("#complaint-status")
      .inputValue();

  if (actualStatus !== expectedStatus) {
    await saveScreenshot(
      page,
      `complaint-${id}-final-status-failed`
    );

    throw new Error(
      `Complaint #${id}: expected final status ` +
        `"${expectedStatus}", got "${actualStatus}".`
    );
  }

  console.log(
    `✓ #${id} final status: ${expectedStatus}`
  );
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  console.log(`
========================================
 Society Maintenance Tracker
 Demo History Seeder
========================================

Target:
${BASE_URL}

`);

  const browser =
    await chromium.launch({
      headless: true,
    });

  const context =
    await browser.newContext();

  const page =
    await context.newPage();

  try {
    /* =====================================
       LOGIN
    ===================================== */

    await login(page);

    /* =====================================
       #8
       Existing IN_PROGRESS
       Add admin note
    ===================================== */

    await addNote(
      page,
      8,
      TARGETS[8].note
    );

    /* =====================================
       #9
       Leave OPEN / untouched
    ===================================== */

    console.log(
      "\n✓ Complaint #9 left untouched"
    );

    /* =====================================
       #10
       Existing IN_PROGRESS
       Add admin note
    ===================================== */

    await addNote(
      page,
      10,
      TARGETS[10].note
    );

    /* =====================================
       #11
       Leave OPEN / untouched
    ===================================== */

    console.log(
      "✓ Complaint #11 left untouched"
    );

    /* =====================================
       #12
       OPEN
         ↓
       IN_PROGRESS
         ↓
       RESOLVED
    ===================================== */

    await changeStatus(
      page,
      12,
      "in_progress",
      TARGETS[12].progressNote
    );

    await changeStatus(
      page,
      12,
      "resolved",
      TARGETS[12].resolutionNote
    );

    /* =====================================
       #13
       OPEN
         ↓
       IN_PROGRESS
         ↓
       RESOLVED
    ===================================== */

    await changeStatus(
      page,
      13,
      "in_progress",
      TARGETS[13].progressNote
    );

    await changeStatus(
      page,
      13,
      "resolved",
      TARGETS[13].resolutionNote
    );

    /* =====================================
       FINAL VERIFICATION
    ===================================== */

    console.log(`
========================================
 Final Verification
========================================
`);

    await verifyHistory(
      page,
      8,
      [
        TARGETS[8].note,
      ]
    );

    await verifyHistory(
      page,
      10,
      [
        TARGETS[10].note,
      ]
    );

    await verifyHistory(
      page,
      12,
      [
        TARGETS[12].progressNote,
        TARGETS[12].resolutionNote,
      ]
    );

    await verifyHistory(
      page,
      13,
      [
        TARGETS[13].progressNote,
        TARGETS[13].resolutionNote,
      ]
    );

    await verifyFinalStatus(
      page,
      12,
      "resolved"
    );

    await verifyFinalStatus(
      page,
      13,
      "resolved"
    );

    /* =====================================
       SUCCESS
    ===================================== */

    console.log(`
========================================
 SUCCESS
========================================

Demo history has been generated through
the real application UI.

Complaints:

#8  → IN_PROGRESS + admin note
#9  → OPEN
#10 → IN_PROGRESS + admin note
#11 → OPEN
#12 → OPEN → IN_PROGRESS → RESOLVED
#13 → OPEN → IN_PROGRESS → RESOLVED

========================================
`);

  } catch (error) {
    console.error(`
========================================
 DEMO SEEDING FAILED
========================================
`);

    console.error(error);

    process.exitCode = 1;

  } finally {
    await browser.close();
  }
}

main();
