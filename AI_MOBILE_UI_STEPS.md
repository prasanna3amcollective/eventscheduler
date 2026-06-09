# AI Mobile UI Development Guidelines

This document outlines the standard operating procedure (SOP) for the AI assistant when developing mobile User Interfaces in this project. 

## AI Instructions: Pre-Requisite Steps
**EVERY TIME** the AI is instructed to work on mobile UI development, it MUST follow these steps:

1. **Read this Document:** Acknowledge the guidelines and steps outlined here.
2. **Understand the Goal:** Review the user's prompt to understand the specific UI components or pages that need to be built.

## Core Mobile UI Principles to Follow

When writing code for the mobile UI, the AI must adhere to the following strict principles:

1. **DO NOT Disturb Existing Desktop UI:** The existing desktop interface must remain completely intact. Do not change, break, or delete the UI code that is already written for larger screens.
2. **Mobile-Only Styling:** The UI development phase is strictly for mobile. Use responsive design properly so that any new styles or components apply *only* to mobile devices without affecting the desktop view.
3. **Responsive Additions:** Use CSS media queries or framework breakpoints (e.g., Tailwind's `max-md:` or applying default mobile classes while preserving `md:` / `lg:` classes) to ensure mobile styles do not leak into the desktop view.
4. **Mobile-First (New Components):** If creating entirely new components, design for smaller screens first, then explicitly use responsive breakpoints for larger screens.
5. **Touch-Friendly Targets:** Ensure all buttons, links, and interactive elements have a minimum clickable area of 44x44 pixels for easy tapping on touch screens.
6. **Fluid Layouts:** Utilize Flexbox (`flex`) and CSS Grid (`grid`) to create layouts that adapt smoothly to varying mobile screen sizes.
7. **Avoid Horizontal Scrolling:** Ensure the page content fits within the device width (`100vw`) by utilizing proper overflow handling (`overflow-x-hidden`) and responsive padding.
8. **Legible Typography:** Keep font sizes readable on small screens (minimum 16px for body text) and maintain sufficient color contrast.
9. **Separate UI Layout Control (No Inline Styles):** All layout, positioning, and visual styling MUST be controlled via separate CSS classes in the `*_mobile.css` file rather than using inline `style={{...}}` attributes in the React component. This ensures clean separation of concerns and allows developers to easily tweak element positions and layouts directly from the CSS.
10. **Re-use Existing Data and Functions:** We are just creating the UI. The underlying functions and logic are already created. You can and should get the necessary data and function bindings from the existing files (like the desktop UI) instead of recreating them.
11. **Fully Responsive:** Make all elements responsive to all types of mobile screens. Ensure layouts adapt cleanly across small and large mobile viewports.

## Code Structure & Organization

To guarantee zero disturbance to the existing desktop UI, the AI MUST strictly follow this file isolation strategy for mobile development:

1. **No Separate Folders:** Create the new mobile files in the exact same directory as their desktop counterparts (e.g., inside `src/components/`). Do not create a separate `mobile` folder.
2. **`_mobile` Naming Convention:** Name every new mobile file with the suffix `_mobile` to clearly indicate it is for the mobile UI (e.g., `Home_mobile.tsx`). 
3. **Separate Mobile CSS:** The CSS must be completely different for mobile. Create a separate CSS file for mobile styles (e.g., `Home_mobile.css`). When the mobile component renders, it should simply import its own CSS file. Do not add mobile queries to the existing desktop CSS.
4. **Switchboard Routing (The Only Exception):** The project uses a Middleware (`src/middleware.ts`) that detects the user's device and injects a custom header: `x-device-type: mobile`. To render your new mobile files without breaking desktop, you are permitted to make **one tiny edit** to the main entry files (like `src/app/page.tsx`): You must read this header and add a conditional "switchboard" statement (e.g., `if (isMobile) return <Home_mobile />;`). Besides this specific switchboard logic, the existing desktop `.tsx` and `.css` files must remain completely untouched.
5. **Reference Existing Content:** You MUST read the existing desktop UI files to understand the content, logic, and structure. Use this as a reference to write the new `*_mobile.tsx` files, ensuring the mobile version has the same features.

## Execution Workflow

1. **Plan:** Identify the new `_mobile` files needed for the mobile view.
2. **Implement:** Create the entirely new `*_mobile` files in `src/`, applying mobile-first styling without modifying any existing files.
3. **Verify:** Check that the development server compiles successfully without errors.
4. **Present:** Notify the user that the UI has been implemented and is ready for visual review on their end.

## Neo-Brutalism Design Aesthetics
When styling mobile components, the AI MUST apply Neo-Brutalism design principles unless instructed otherwise. Adhere to these specific visual rules:
1. **Raw, Unrefined Shapes:** Eliminate soft curves. Avoid border radius (`border-radius: 0`) to keep corners sharp and rigid.
2. **Bold Strokes & Hard Shadows:** Use thick, solid black borders (`border: 3px solid #000`) and pure black drop shadows with no blur (`box-shadow: 6px 6px 0px #000;`) at 100% opacity.
3. **Vibrant & Muted Color Blocks:** Use a mix of highly saturated and low saturation (muted) solid background colors instead of traditional whites or grays. Do not tie component backgrounds strictly to a dark/light mode toggle.
4. **No Gradients:** Never use gradients. All backgrounds, borders, and shadows must be flat, solid colors.
5. **Experimental Typography:** Use large, bold font weights (e.g., `800` or `900`), capitalized text for headings and labels (`text-transform: uppercase`), and retain the existing sans-serif font family.
6. **High Contrast Action States:** Active states (like clicking a button or a card) should reduce the shadow offset (e.g., `translate(3px, 3px)` and `box-shadow: 3px 3px 0px #000;`) to create a satisfying, mechanical "pressed" feeling.

---
*Note: This is a temporary file designed to guide the AI during the mobile UI development phase.*
