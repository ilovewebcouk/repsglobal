Plain-English version:

You are right: cards should not have their own separate “headshot rules”. The correct system is:

1. Trainer uploads one profile/avatar photo.
2. AI checks that photo is actually a headshot.
3. The upload flow crops it into the final square avatar.
4. Every place that shows that trainer’s avatar should reuse that same processed avatar.

So the card should not be trying to invent a crop. It should just show the already-approved, already-cropped avatar.

What went wrong:

- The current upload flow does have the AI check and crop.
- But the app also has older/demo/migrated profile photos that did not go through that same current upload flow.
- I then added a stricter “only show approved avatars” gate, but because the city cards had some live rows, the static demo card images were no longer being used as the fallback set.
- That made the demo imagery disappear in places where we should have kept the locked demo cards until there are enough genuinely approved live headshots.
- Some public surfaces still read the raw avatar URL directly, instead of going through the same approved-avatar rule.

The fix is not to create different image rules per card. The fix is to make the uploaded avatar the single source of truth and make every avatar surface respect that.

Implementation plan:

1. Make the uploaded/cropped avatar canonical
   - Keep the profile upload flow as the source of truth: AI validates, face-box crop runs, final square image is saved.
   - Cards, directory listings, profile pages, shop-fronts, and avatar stacks should all use that same final avatar.

2. Stop bad legacy photos from pretending they passed the new rule
   - Do not treat old migrated photos as approved just because an old import status said “ok”.
   - Those can remain stored, but they should not be used as polished public card headshots unless they pass the current avatar flow or are manually approved later.

3. Restore the demo images properly
   - City and profession featured rails should only switch from locked demo cards to live cards when there are enough approved live avatar photos to fill the row.
   - If there are fewer than 4 approved live headshots, keep the original demo cards/images instead of showing blanks, monograms, or poor live photos.

4. Align every avatar surface
   - Directory result cards.
   - City featured cards.
   - Profession featured cards.
   - Homepage avatar rail/cards.
   - Public profile avatar.
   - Coach shop-front avatar.
   - Enquiry summary avatar.

5. Simplify card image rendering
   - Remove the special `object-top` card crop behaviour.
   - Since the avatar is already processed at upload, cards should just display the processed square image normally.

6. Data cleanup
   - Reclassify legacy imported avatar approvals back to unverified where they only came from the old migration/import path.
   - Keep actual AI-uploaded and AI-generated avatars approved.
   - Do not delete demo assets or stored user images.

7. QA
   - Check the London city featured row from the screenshot.
   - Confirm bad legacy photos no longer fill the cards.
   - Confirm demo cards/images come back when live approved headshots are insufficient.
   - Confirm a newly uploaded approved avatar appears consistently everywhere that trainer’s avatar appears.