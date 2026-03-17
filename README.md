# Farming Simulation Web Game

![HTML5](https://img.shields.io/badge/Language-HTML5-orange?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/Language-CSS3-blue?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow?logo=javascript&logoColor=black)
![Platform](https://img.shields.io/badge/Platform-Web-lightgrey)
![Status](https://img.shields.io/badge/Project-Completed-brightgreen)

A browser-based **Farming Simulation Game** where players can plant crops, grow them over time, and harvest resources to earn coins while managing their virtual farm.

The game is built using **HTML, CSS, and JavaScript**, demonstrating core web development concepts such as **DOM manipulation, event handling, game logic, and dynamic UI updates**.

This project simulates a simple farming environment and demonstrates how **interactive games can be built directly in the browser using front-end technologies**.

---

# Table of Contents

- [Project Overview](#project-overview)
- [Project Motivation](#project-motivation)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [System Architecture](#system-architecture)
- [Game Workflow](#game-workflow)
- [Project Folder Structure](#project-folder-structure)
- [How to Run the Game](#how-to-run-the-game)
- [Project Preview](#project-preview)
- [Learning Outcomes](#learning-outcomes)
- [Possible Future Improvements](#possible-future-improvements)
- [Author](#author)

---

# Project Overview

The **Farming Simulation Web Game** is an interactive browser-based game where players manage a small farm by planting crops, letting them grow, and harvesting them to earn rewards.

The project demonstrates how **basic simulation mechanics** can be implemented using JavaScript while maintaining a clean and organized front-end project structure.

Players can:

- Plant crops on empty farm tiles
- Watch crops grow through stages
- Harvest crops when fully grown
- Earn coins from harvested crops
- Continuously manage and expand their farm

All gameplay interactions occur directly inside the **web browser**, making the game lightweight and accessible.

---

# Project Motivation

This project was developed to practice **front-end development concepts** and explore how browser technologies can be used to create simple simulation games.

The main goals of this project include:

- Understanding **JavaScript DOM manipulation**
- Implementing **event-driven programming**
- Designing **interactive user interfaces**
- Managing **game state in the browser**

---

# Key Features

## Farm Grid System

The game uses a **grid-based farming layout** where each tile represents a plot of land that players can interact with.

---

## Crop Planting

Players can plant crops on empty farm tiles using simple click interactions.

Once planted, crops begin their growth cycle automatically.

---

## Crop Growth Stages

Crops gradually grow through different stages:


Seed → Growing Crop → Fully Grown Crop


Each stage visually updates on the farm grid.

---

## Harvest System

Once crops reach maturity, players can harvest them.

Harvesting:

- Removes the crop from the tile
- Rewards the player with coins
- Frees the tile for replanting

---

## Coin System

Players earn coins whenever crops are harvested.

Coins can later be expanded to support additional gameplay mechanics such as:

- Buying seeds
- Unlocking new crop types
- Upgrading farms

---

## Interactive User Interface

The game interface dynamically updates based on player actions, providing visual feedback for crop growth and harvesting.

---

# Technologies Used

Frontend Technologies


HTML5
CSS3
JavaScript


Concepts Implemented

- DOM Manipulation
- Event Handling
- Dynamic UI Updates
- Game State Management
- Grid-based Layout System
- Interactive Front-end Design

---

# System Architecture

The project is divided into three main components.

---

## HTML Structure

Defines the layout of the web game including:

- Game title
- Farm grid
- Coin counter
- Interface elements

---

## CSS Styling

Responsible for the visual appearance including:

- Farm tile design
- Crop visuals
- Layout styling
- Game interface

---

## JavaScript Game Logic

Handles all interactive functionality including:

- Handling user interactions
- Managing crop growth timers
- Updating farm tiles
- Managing player coins
- Updating the UI dynamically

---

# Game Workflow

When the game starts:

1. The farm grid is displayed
2. The player clicks an empty tile
3. A crop is planted
4. The crop grows over time
5. The player harvests the crop when ready
6. Coins are rewarded
7. The player can replant crops

Gameplay cycle:


Plant → Grow → Harvest → Earn Coins → Replant


---

# Project Folder Structure

Example repository structure


farming-simulation-web-game              
 ├── index.html   
 ├── style.css   
 ├── script.js   
 ├── README.md   


---

# How to Run the Game

No installation is required.

Step 1 — Download or clone the repository


git clone https://github.com/ShidoStack/farming-simulation-web-game.git


Step 2 — Open the project folder


cd farming-simulation-web-game


Step 3 — Run the game

Open the file:


index.html


in any modern web browser.

---

# Project Preview

Example game interface


FARMING SIMULATION GAME

Coins: 25

[ 🌱 ]  [ 🌱 ]  [ 🌱 ]  [ 🌱 ]

[ 🌱 ]  [ 🌱 ]  [ 🌱 ]  [ 🌱 ]

[ 🌱 ]  [ 🌱 ]  [ 🌱 ]  [ 🌱 ]

[ 🌱 ]  [ 🌱 ]  [ 🌱 ]  [ 🌱 ]


Gameplay cycle


Click Tile → Plant Crop
Wait → Crop Grows
Click Tile → Harvest Crop
Earn Coins


---

# Learning Outcomes

This project helps understand important front-end development concepts:

- Creating interactive web applications
- Handling user events with JavaScript
- Implementing simple game logic
- Managing dynamic UI updates
- Structuring front-end projects
- Designing grid-based interfaces

---

# Possible Future Improvements

Possible enhancements include:

- Multiple crop types
- Seed purchasing system
- Farm upgrades
- Player leveling system
- Weather effects
- Save progress using Local Storage
- Mobile responsive design
- Animations and sound effects
- Multiplayer farming
- Online leaderboard system

---

# Author

Lokendra Joshi
