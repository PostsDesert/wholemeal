- Main Page: Spinner View
	- Swipe down/(arrow down, enter, s, j) (add to combo)
		- Should have a nice gravity drop and pop animation
	- Swipe right/(arrow right, d, l) (go to combo page)
	- Swipe left/(arrow left, a, h) (go to lists page)
- Combo Page
	- Styled like a receipt
	- Show combos (spins that were saved)
	- Button to remove combo
	- Send to Email Button, Copy to Clipboard Button (Binded Ctrl + C)
- Lists Page
	- 3 lists
	- Layout
		- On mobile, elongated circle with 3 emojis at the bottom to switch lists
		- On desktop, show 3 lists side-by-side
	- Option to Create/Edit/Delete
	- User must be logged in to edit lists.
	- Emoji is pulled from DB, if emoji doesn't exist, send placeholder emoji and fetch emoji from flash2.0 AI model. Then push new changes to device once table is updated.
- SignIn/Out Screen
	- Accessible from circle with a emoji on the top right of the list page and main page screen.
	- Views
		- Sign in
		- Sign out + Delete Account (and Data) + Get Data

### Done
Overall:
- The layout should respect the iOS safe areas on PWA.
- Auth Screen should be disabled behind a feature flag (or disabled)
- The user should be logged in and always able to edit lists.
- "back to spinner" button should be a component and also the same for both pages
- Refactor out receipt component
  - Content of the receipt is not defined in the component, but rather passed in as a prop.
  - Font should be bigger on mobile devices
- Add socials on bottom of receipts
- minimize CSS usage by removing CSS that's shadowed and shared
- Make it easier to tell that swipe navigation gestures are available on mobile devices.
- Keyboard shortcuts should be explained on desktop devices.
- Back button on lists page should be the same as the combo page.
- Cache emoji label colors to speed up page loads/reduce redundant work.
- Caching emoji generation to speed up page loads/reduce redundent work.
- Update ReadMe with features, and usage instructions.

Combo Page
- The combo page should show the auth button in the top right
- On small width devices, the text should look like it does on the large width devices. Right now it gets way too small and narrow.
- Change the url from '/combo' to '/combos'
- Don't have the background fade in. It should just immediately appear.
- The green checkbox after copying to clipboard is not applied with receipt filter.
- Add delete modal to combo screen to confirm deletion of combo.

List View
- When clicking the auth button it should open the same window as the spinner view. Right now, when the user is authenticated they still have to click the auth button. The auth button should just pull up the same screen as the other views and not change the edit state.
- It should be okay to remove or edit default items.
- When the new item window is open, turn off keyboard and swipe shortcuts.
- The list view needs to support adding, editing and deleting food items.
- Don't have the background fade in. It should just immediately appear.
- The bottom bar is at the wrong height on mobile devices and leaves some random space below it.
- The back gesture should be styled more like the combo (receipt view)
- Since we don't have anything at the bottom of the page, the lists should now show their full height.
- On mobile, the back button should match the style and positioning of the combo page.
- Instead of shrinking the list width when going from desktop to mobile, the lists should just switch to a single list list.
- The list header should have a giant black and white emoji of the list emoji in the background. it should stretch slightly off the receipt but you can only see the part still on the receipt. Then the labels and stuff with be the opposite color on top of it.
    - The emoji might be back and white or a nice solid color. Try out each first with the solid color option picked from the emoji. The target emojis are 🐔, 🍠, 🥦.

Spinner View
- Fix the auth window x button not working on the spinner view.
- remove currentIndex since we don't need the slide functionality anymore.
- The text clips outside of the box on the spinner page for some food labels.
- On mobile, the text shadow should be 1px instead of 2px.
- The spinner view needs to use the custom lists if the user is logged in. (just always use the custom lists, not the default ones)
- Sometime the key press events don't correctly register on first load.
- There should be a message, similar style to Lists and Combos, at the bottom center of the screen that says "Swipe down to create combo" on mobile and "Press enter to create combo" on desktop.
- "Swipe down to create combo" message should be centered at the top on mobile devices.
- Decrease the duration of the fade in animation
- Swipe gestures do not work on mobile (or anywhere else) (now use swipe-navigation lib)
- The navigation buttons should appear after the first rotation and stay via flag in the local storage)
- You shouldn't be able to add a combo in the default items (before first spin).
- On initial load, don't show redirection text and redirection screen, just load the spinner view.
- Combo counter icon should always be visible if combos exist.
- Clicking the swipe button should dismiss the message after adding the combo.
- Buttons should higher off the floor on iOS PWA (is there a safe area that we can use for the bottom of the screen?)
- Experiment with different fonts.
- Add simple animation when adding to cart
    - I'm thinking that the text disappears, the emojis all move the center and a cart emoji fades in over the top as the emojis shrink. Then the cart fades out. This should be ~1 second.
- Shopping cart emoji shouldn't play on start screen (via keyboard/swipe action)

### Future Improvements
Spinner View:
- Nice anime.js falling animation for the spinner view.
- Decrease the duration of the fade in animation
- Gravity fall should have emojis fall according to gravity, so if the user tilts their phone, the emojis should fall in that direction.
   - Swipe up should explode the emojis in the direction of the swipe. They should hit off the edges of the screen and gravity fall down


Auth Screen (this will be after the pocketbase/elixir backend is introduced)
- The auth button should be a random food emoji with a circle background around it of a contrasting color
- The user should be able to change their emoji and password.
- There should be a password reset button that appears if the wrong password is entered.
- Sign out + Delete Account (and Data) + Get Data



### Future Features
- List sharing (public leaderboards) single lists and also list combos (challenges, such as only peas or something absurd). It should have voting.
- Storehouse (that shows all the combos that have been discovered by the user, and if the user has cooked that combo)
    - Spinner view should have an option to only show new combos that the user has not cooked yet.
- Haptics for iOS
