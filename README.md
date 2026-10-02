# 🎮 Connect Four – Player vs Computer

A modern and interactive **Connect Four web game** built with **React, JavaScript, Three.js, and WebGL**.

The player competes against a computer-controlled opponent on a classic **7 × 6 Connect Four board**. The game includes tactical computer AI, animated disc drops, a 3D-style game board, score tracking, win detection, responsive design, and accessibility support.

🌐 **Live Demo:**  
https://connect-four-game-chi-lemon.vercel.app

## ✨ Features

### 🎮 Connect Four Gameplay

- Classic **7-column × 6-row** Connect Four board
- Player vs Computer gameplay
- Player uses 🔴 **Red discs**
- Computer uses 🟡 **Yellow discs**
- Discs automatically fall to the lowest available position
- Prevents moves in full columns
- Automatic turn switching between player and computer

### 🏆 Win & Draw Detection

The game automatically detects four connected discs in:

- Horizontal direction
- Vertical direction
- Diagonal ↘ direction
- Diagonal ↗ direction
- Full-board draw situations

Winning discs are visually highlighted when a player wins.

### 🤖 Computer AI

The computer uses rule-based tactical logic instead of making completely random moves.

The AI can:

- Detect an immediate winning move
- Block the player's immediate winning move
- Prefer strategically useful positions
- Favor center columns
- Evaluate promising groups of discs
- Select between similarly valued moves

This provides a more challenging experience than a purely random computer opponent.

### 🎨 Modern UI & Visual Effects

- Modern dark game interface
- 3D-style Connect Four board
- Animated disc-drop effects
- Winning-disc highlighting
- Column hover indicators
- Player and computer status display
- Live turn indicator
- Game-result messages
- Interactive board movement / subtle tilt effects
- Responsive game layout

### 🥇 Score Tracking

The game maintains separate scores for:

- 🔴 You
- 🟡 Computer

Two reset options are available:

**Restart Round**
- Clears the board
- Keeps the current scores

**New Game**
- Clears the board
- Resets both scores to zero

> Scores are currently stored in memory. Refreshing the browser resets the scores.

### 📱 Responsive Design

The interface is designed to work across different screen sizes, including:

- Desktop computers
- Laptops
- Tablets
- Mobile devices

### ♿ Accessibility

The game also includes accessibility-focused interactions:

- Keyboard-operable column controls
- `Enter` and `Space` support
- Focus states
- Screen-reader announcements
- Reduced-motion support

### 🖥️ WebGL Fallback

The main game board uses **Three.js/WebGL** for its visual effects.

If WebGL is unavailable, the application can display a CSS-rendered fallback board so the game remains usable.

---

# 🕹️ How to Play

The objective is simple:

> **Connect four of your discs in a row before the computer does.**

You are:

🔴 **Red**

The computer is:

🟡 **Yellow**

### Step 1 — Choose a Column

Move your mouse over one of the seven columns.

A preview indicates where you can place your disc.

### Step 2 — Drop Your Disc

Click the column/down-arrow control.

Your red disc will fall into the **lowest available position** in that column.

Keyboard users can focus a column and press:

```text
Enter
```

or

```text
Space
```

### Step 3 — Computer Turn

After your move, the computer analyzes the board and places a yellow disc.

Wait until the computer finishes its move before selecting your next column.

### Step 4 — Connect Four

Try to create four red discs in a continuous line.

You can win with:

```text
Horizontal
🔴 🔴 🔴 🔴
```

```text
Vertical
🔴
🔴
🔴
🔴
```

```text
Diagonal
🔴
  🔴
    🔴
      🔴
```

### Step 5 — Win the Round

The first player to connect four discs wins.

The game displays the result and updates the score.

You can then select:

```text
Restart Round
```

to play another round while keeping the scores.

Or:

```text
New Game
```

to reset the entire game and scores.

---

# 🛠️ Technologies Used

## Frontend

| Technology | Purpose |
|---|---|
| React 19 | User interface and component-based development |
| JavaScript | Game logic, state management, and interactions |
| HTML5 | Application structure |
| CSS3 | Styling, responsive design, and animations |

## 3D & Graphics

| Technology | Purpose |
|---|---|
| Three.js | Rendering the 3D Connect Four board |
| WebGL | Browser-based hardware-accelerated graphics |
| CSS Animations | Additional UI animations and effects |

## Development & Testing

| Technology | Purpose |
|---|---|
| Create React App | React development/build environment |
| react-scripts | Development and production scripts |
| Testing Library | React component testing |
| Web Vitals | Performance measurement |
| npm | Package management |

## Version Control & Deployment

| Technology | Purpose |
|---|---|
| Git | Version control |
| GitHub | Source-code repository |
| Vercel | Production deployment and hosting |

---

# 🧠 Game Architecture

The application runs completely on the frontend.

```text
                    CONNECT FOUR
                         │
             ┌───────────┴───────────┐
             │                       │
          React UI               Game Logic
             │                       │
      Player Interaction      Win / Draw Detection
             │                       │
             └──────────┬────────────┘
                        │
                 Computer AI
                        │
                 Board State
                        │
              Three.js / WebGL
                        │
                   3D Board
```

# 👩‍💻 Author

**Thushini Jayamaha**

BSc Information Technology Undergraduate

GitHub:  
https://github.com/thushijayamaha

---

## ⭐ Support

If you like this project, consider giving the repository a **star ⭐** on GitHub.

Enjoy playing **Connect Four!** 🎮🔴🟡
