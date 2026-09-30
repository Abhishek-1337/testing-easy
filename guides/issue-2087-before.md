# #2087: Practice-level notification preferences — "before" UI test

Steps to run on your local app **before** the change, on `development` with the Service Bus emulator running. Each test says what to click and what you should see today.

> Row names are the exact labels from the preferences catalog. Menu and button names come from the Angular templates and haven't been clicked through yet, so expect small wording differences.

## Two things that will fool you

- If the **Service Bus emulator isn't running**, *no* test creates any task. Everything will look broken in the same way.
- For Tests 2–4, **don't use a patient whose Providing Doctor and Monitoring Doctor are the same person**. That case gets no task today, and #2087 doesn't change it (#2109 does).

## Setup (once, as SuperAdmin)

1. Log in as **SuperAdmin**.
2. Go to **Practices**, create or pick **Practice A**, and open its **Team** tab.
3. Click **+ Member** and add:
   - **Doctor D1**: Role = Doctor, Practice = Practice A **and** Practice B.
   - **Doctor D2**: Role = Doctor, Practice = Practice A.
   - **Staff S1**: Role = Staff, Practice = Practice A.
4. Pick **Practice B** and add no staff to it.
5. Go to **Patients** and create:

| Patient | Practice | Providing Doctor | Monitoring Doctor |
|---|---|---|---|
| **P1** | Practice A | D1 | D2 |
| **P2** | Practice B | D1 | D2 |

6. Keep the `dotnet run` backend console visible; some results only show up there.

## Test 1: Preferences are per user today

1. Log in as **D1**. Click your avatar → **Profile** → **Preferences** tab.
2. **Look:** the header "Notification Preferences", with **Email** and **App** switches on each row. This is D1's own copy.
3. Find the row **"Appointment requested"**. Note that App is on and Email is off.
4. Log out and log in as **D2**, then open **Profile → Preferences**.
5. **Look:** D2 has a separate copy of the same list. Changing D1's rows doesn't change D2's.
6. **Also look:** there's a row **"Scan past due"**, switched off. It's one of the ten codes #2087 retires; after the change it should be gone.
7. As SuperAdmin, go to **Practice A → Preferences** tab.
8. **Look:** you only see Video Selections, Monitoring Protocols and Calendar Settings. There are no notification settings at practice level.

## Test 2: A deactivated staff account still counts as staff

1. As **SuperAdmin**, go to **Users** (sidebar) → **Active** tab → click **S1**.
2. Click the **Archive** icon (top of the page) → **Yes**. Despite the label, this deactivates S1.
3. Go to **Practice A → Team**. **Look:** S1 shows **Inactive**.
4. Open patient **P1** → **Schedule Appointment** → choose **"An office team member will schedule it"** → **Submit**.
5. Log in as **D1** (P1's Providing Doctor) → **Tasks** → **My Tasks** and **Team Tasks**.
6. **Look:** there is **no "Appointment requested" task**.
   - **That's the bug:** Practice A has no working staff, yet D1 isn't given the task, because the deactivated S1 still counts as staff and gets it instead.
7. Afterwards, go back to **Users → Suspended → S1 → Restore** to reactivate S1.

## Test 3: A staffless practice already falls back to the Providing Doctor (control)

1. As SuperAdmin, open **P2** (Practice B, no staff) → **Schedule Appointment** → **"An office team member will schedule it"** → **Submit**.
2. Log in as **D1** → **Tasks**.
3. **Look:** D1 **does** get "Appointment requested", in-app only.
4. **Look in the backend console:** no email is sent for it.

> **After #2087:** D1 should get it in-app **and** by email.

## Test 4: The Providing Doctor can't opt into appointment tasks at a staffed practice

1. Make sure S1 is **active** (restore it if you did Test 2).
2. Log in as **D1** → **Profile → Preferences** → row **"Appointment requested"**. Make sure **App** is on and click **Save**.
3. As SuperAdmin, open **P1** → **Schedule Appointment** → **"An office team member will schedule it"** → **Submit**.
4. Log in as **S1** → **Tasks**. **Look:** S1 has the task.
5. Log in as **D1** → **Tasks**. **Look:** D1 has **nothing**, even with the toggle on. Today the toggle can only switch this task off, never on.

> **After #2087:** turning on *Appointments → PD* for the practice should give D1 the task alongside S1.

## Test 5: Staff get appointment tasks in-app only

1. From Test 4, S1's task has already been created.
2. **Look in the backend console:** no email is sent to S1 for it.
3. Optionally, log in as **S1** → **Profile → Preferences**: row "Appointment requested" shows App on, Email off.

> **After #2087:** S1 should also get an email.

## Test 6 (optional): A switch that's off stops the task from being created at all

1. Log in as **D1** → **Profile → Preferences** → switch **App off** on **"Simulation ready for approval (PD)"** → **Save**.
2. As SuperAdmin, open P1's case → case review → **Bypass Simulation** → confirm.
3. Log in as the case's planning doctor and click **Notify Doctor**.
4. **Look:** D1 gets no task, and the backend console shows:

```text
User … has muted definition simulation.ready.pd-notified; skipping task creation
```

Only D1 is muted; any other doctor still gets theirs.

## Record your results

For each test, write down:

- [ ] Who got a task
- [ ] Whether an email line appeared in the console
- [ ] What the Preferences screens showed

After #2087 ships, you'll rerun the same steps and compare. The biggest differences will be:

- **Profile → Preferences is gone.**
- **Practice A → Preferences** shows the new grid.
- **Tests 2, 3, 4 and 5** give the "after" results described above.
