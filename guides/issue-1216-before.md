# #1216: Providing Doctor not authorized with Invisalign — "before" UI test

Run this on the local app **before** the change, on `development` (not the #1216 branch), with `docker compose up -d` running so Azurite can store the record uploads.

No Invisalign account is needed: the bug appears whenever the Providing Doctor never connected Invisalign.

> The labels come from the Angular templates and seed data and haven't been clicked through yet, so expect small wording differences.

## Things that will fool you

- **The toast only fires when you click a Patient Type card.** Reopening the workflow resumes silently (that's Test 3). If you expect a toast and see none, click **Adult** again.
- **Don't connect Invisalign for Dr A.** Connecting (**Profile** → **Integrations** → **Aligners** → **Connect**) would need a real Align account and the staging OAuth relay. If a working connection somehow existed, the bug wouldn't reproduce at all.
- **Without the record uploads, the Prescription step stays locked.** That's a setup gap, not the bug. Azurite must be running for uploads to save.
- **Invisalign's own rejection path can't be reproduced locally.** That path covers errors like "VS-100 API Subscription validation failed" and needs a real Align account. It's covered by automated tests only.
- **Ignore `Failed to sync patient images for patient …` in the console.** It's a side effect of the same missing connection, not a separate failure.

## Setup (once, as SuperAdmin)

1. Log in as `administrator@localhost` / `Administrator1!`.
2. **Practices** → **New Practice**. Create practice **P-Test**.
3. **Users** → **New User**. Create **Dr A Tester**, **Role** Doctor, **Practice** P-Test, **Is Remote Doctor** unticked. **Never connect Invisalign for this user.**
4. **Users** → **New User**. Create **S1 Staff**, **Role** Staff, **Practice** P-Test.
5. **Patients** → **New Patient**. Create patient **P1 Test** in P-Test.
6. In P1's workflow, open **Case Assignment**. Set **Providing Doctor** = Dr A Tester and **Case Planning Doctor** = Dr A Tester (the same doctor, so every role can see the Prescription step). Click **Submit**.
7. Open **Treatment Type**. Under **Case Type** choose **Aligners**, under **Brand Selection** choose **Invisalign**, then click **Continue**.
8. Open **Chief Concern & Records**. Enter a chief concern and upload the Invisalign records:
   - 5 intraoral photos (or 1 composite photo)
   - the upper and lower scans

   Until these are in, **Prescription** won't open.
9. Keep the `dotnet run` console visible: the backend log is half the evidence.

## Test 1: A delegated user gets a dead-end "try again" on Treatment Options

1. Logged in as SuperAdmin (who is not P1's Providing Doctor), open P1. Use the **Workflow** toggle in the top bar, then click **Prescription** in the sidebar.
2. Under **01 Patient Type**, click **Adult**.
3. **Look:** step **02 Treatment Options** shows "No treatment options available for this patient type." and **Next** stays disabled.
4. **Look:** a red toast reads **Load Failed** / "Failed to load eligible products. Please try again."
5. Click **Adult** again. **Look:** the same toast comes back. Retrying never helps.

> **After #1216:** the toast should read **Providing Doctor Not Authorized** / "Dr. Tester is not authorized with Invisalign. Please have them authorize before submitting the prescription."

## Test 2: The same failure as Staff

1. **Users** → S1 Staff → **Log in as this user**.
2. **Patients** → P1 → **Workflow** → **Prescription** → **Adult**.
3. **Look:** the same empty state and the same **Load Failed** / "…Please try again." toast.
4. Stop impersonating and return to SuperAdmin.

> **After #1216:** the toast should name Dr. Tester, exactly as in Test 1.

## Test 3: Reopening a saved draft shows no toast at all

1. As SuperAdmin, after Test 1, go to another patient (or back to the patient list), then open P1 → **Workflow** → **Prescription** again.
2. **Look:** it resumes on **02 Treatment Options** with "No treatment options available for this patient type." and **no toast at all**. The page just sits empty.

> **After #1216:** a toast should appear here too: **Providing Doctor Not Authorized** with Dr. Tester's name.

## Test 4: The backend console hides the real cause

1. During Test 1 or 2, look at the `dotnet run` console.
2. **Look:** there's an error `Failed to get eligible products for patient <id>`, whose stack includes:

```text
DelegatedTokenRefreshException: No refresh token on file for owner … (Invisalign)
```

   There is **no** `Delegation refresh failed for PD … returning structured 400` line.

3. **Look:** the browser network tab shows this request returning **500**:

```http
GET …/eligible-products?treatmentWorkflow=ADULT&externalType=Invisalign
```

```json
{"message":"Failed to get eligible products"}
```

> **After #1216:** the same request should return **400** with `"error":"providing_doctor_not_authorized"`, and the console should log `Delegation refresh failed for PD … returning structured 400`.

## Test 5 (control): The Providing Doctor opening their own patient

1. **Users** → Dr A Tester → **Log in as this user**.
2. **Patients** → P1 → **Workflow** → **Prescription** → **Adult**.
3. **Look:** today you get the same **Load Failed** / "…Please try again." toast. Dr A has no Invisalign connection of their own, and no one else's login is being borrowed, so no "not authorized" message can appear here.
4. Stop impersonating.

> **After #1216:** this case still fails, but the toast detail should show the server's own reason rather than "Please try again" (exact wording not verified). It must **not** say "Providing Doctor Not Authorized".

## Record your results

For each test, write down:

- [ ] The toast title and text (or "no toast")
- [ ] The empty-state text
- [ ] For Tests 1 and 4: the eligible-products status code and response body from the network tab
- [ ] For Tests 1 and 4: the console line

After #1216 ships, you'll rerun the same steps and compare. The biggest differences will be:

| Test | Before | After #1216 |
|---|---|---|
| 1 and 2 | **Load Failed** / "Please try again." | **Providing Doctor Not Authorized** / "Dr. Tester is not authorized with Invisalign…" |
| 3 | No toast | The same named-doctor toast |
| 4 | **500** `Failed to get eligible products` | **400** `providing_doctor_not_authorized`, plus the `Delegation refresh failed for PD …` log line |
| 5 | **Load Failed** / "Please try again." | Still **Load Failed**, but the detail shows the server's reason |
