# Next up:

- Figure out why cart animation is not smooth


- Refactor and clean up the code
    - Move FoodSpinner to a route and move functions to the page
    - Add a layout page to perform transitions between pages.
- Add swipe does to add to menu (arrow down on computer)
    - Calendar view appears, allows selecting multiple days.

Calendar page:
- Should show emojis for each day
- allow user to click on a day to see the menu
    - menu appears from side on desktop, bottom on mobile
- allows the user to remove items from the menu
- maybe allows the user to manually add items to the menu


Items Page:
- Preselects at top, similar to spotify playlist filters for pesco-vegetarian, vegetarian, vegan, etc.
- Allows user to add items to each list
    - When the user adds an item, the corresponding emoji should be generated via Gemini 2.0 Flash
        - Have cache for emoji generation


Intro:
- Click here for the intro button on first load
    - interactively shows how to use basic app features
        - press to start/stop
        - swipe down to add to menu
        - items screen (just makes text big)
        - calendar screen
        - account screen


Account Page:
- Basic Account settings


Layout:

                     Account settings
   Items Page                           Calendar Page
                        Add to Menu

- Should show Text on side of screen indicating what each swipe does
- Should show keyboard shortcuts on desktop


Other things:
- Add light/dark mode
- What's the logo?
- What's the name? -> Wholemeal
- Add new colors for default P, C, V.
- Convert to Runes mode from Legacy
- Precompute shuffle on page load so it's ready to go on the press.
- Going to need fallback emojis when apple emojis aren't available
    - Update here, we can fall back to Apple Emojis!
        - https://github.com/signalapp/Signal-Android/issues/13106
        - https://github.com/signalapp/Signal-Android/tree/main/app/src/main/assets/emoji
        - https://github.com/iamcal/emoji-data


  // Future Improvements:
  // TODO: shuffle during intro screen so its done by the time you attempt to ru



Far down the line:
- when the user clicks to start, the text "rolls" into the emoji (teleprompters behind it scrolling across)
- Upvote / downvote ingredients (apply weights to the sorting)


Done:
- swap lock box so it rotates individual items
- Move FoodSpinner to a route and move functions to the page
