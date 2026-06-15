## Goal
Make inbound support emails appear in the support queue and update the sidebar/bell unread counts without you manually configuring Mailgun.

## What I found
- Mailgun is already connected to the project.
- The Mailgun domain `repsuk.org` is active.
- A Mailgun route already exists for `support@repsuk.org`.
- The likely break is the route action: it is currently using Mailgun storage notification style (`store(...notify=...)`), while the app endpoint is written for direct inbound email forwarding fields. That means Mailgun can hit the app but the app may not receive the actual sender/subject/body in the shape it expects.

## Plan
1. **Make the inbound webhook handle Mailgun properly**
   - Update the existing inbound endpoint so it accepts both Mailgun formats:
     - direct forwarded inbound email payloads
     - stored-message notification payloads
   - If Mailgun sends a stored-message URL, the app will fetch the full message through the linked Mailgun connector and then create/update the support ticket.

2. **Repair the Mailgun route automatically through the connector**
   - Use the connected Mailgun account to update the existing `support@repsuk.org` route so future inbound messages are sent in the cleanest format for the app.
   - No manual Mailgun dashboard work from you.

3. **Preserve ticket threading**
   - Keep matching replies via `In-Reply-To` / `References` headers.
   - Keep fallback matching to the latest open ticket from the same sender.
   - New emails still create new support tickets.

4. **Make failures visible**
   - Add safer logging for rejected/unsupported Mailgun payloads so we can tell whether Mailgun delivered the webhook, the signature failed, or the message failed to save.
   - Avoid exposing sensitive email body content in logs.

5. **Verify end-to-end**
   - Check the route configuration after updating it.
   - Confirm the endpoint can accept Mailgun’s payload shape.
   - Once you send a test email to `support@repsuk.org`, it should appear in the support queue and increment the bell/sidebar unread count automatically.