// Destructuring from Matter.js
const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter

// Cells length horizontaly and verticaly
const cellsHorizontal = 16
const cellsVertical = 14

// Declare width and height
const width = window.innerWidth
const height = window.innerHeight

// One cell width and height
const cellLengthX = width / cellsHorizontal
const cellLengthY = height / cellsVertical

// Create world/canvas
const engine = Engine.create()
engine.world.gravity.y = 0
const { world } = engine
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
})
Render.run(render)
Runner.run(Runner.create(), engine)

// Walls array to define world borders so shapes stays inside world
const walls = [
  // Top wall
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  // Bottom wall
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  // Left wall
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  // Right wall
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
]
// Add walls array to the world
World.add(world, walls)

// Generate labyrinth / suffleeighbors n array
const shuffle = array => {
  // Get array length and asign it into 'counter' variable
  let counter = array.length

  while (counter > 0) {
    // Get random index from array
    const index = Math.floor(Math.random() * counter)
    counter--

    // Suffle logic
    const temp = array[counter]
    array[counter] = array[index]
    array[index] = temp
  }

  return array
}

// // Generate labyrinth grid
//const grid = []

// // Create rows
// for (let i = 0; i < 3; i++) {
//   // Push grid row arrays into grid
//   grid.push([])

//   // Fill rows with initial false values
//   for (let j = 0; j < 3; j++) {
//     grid[i].push(false)
//   }
// }

// Generate labyrinth grid - the better way
// 1. Create Array to hold arrays/grid
// 2. Add arrays inside first array, with map, with initial false values
const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))

// Create horizontal row inner walls
const rowWalls = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false))

// Create vertical column inner walls
const columnWalls = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false))

// Pick random start point
const startRow = Math.floor(Math.random() * cellsVertical)
const startColumn = Math.floor(Math.random() * cellsHorizontal)

// Labyrinth drawing algorythm
const doneCells = (row, column) => {
  // If cell is already visited(=true) at [row, column], then return-finish execution
  if (grid[row][column]) {
    return
  }

  // Mark cell as visited
  grid[row][column] = true

  // Assemble randomly-ordered list of neighbors (so labyrinth will be random ordered)
  const neighbors = shuffle([
    // Bottom neighbor
    [row - 1, column, 'up'],
    // Right neighbor
    [row, column + 1, 'right'],
    // Bottom neighbor
    [row + 1, column, 'down'],
    // Left neighbor
    [row, column - 1, 'left'],
  ])

  // For each neighbor
  for (let neighbor of neighbors) {
    // Destructuring from neighbors array - cell that we are thinking to visit next
    const [nextRow, nextColumn, direction] = neighbor

    // See if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue
    }

    // If we have visited that neighbor, continue to next neighbor
    if (grid[nextRow][nextColumn]) {
      continue
    }

    // Remove a wall from either horizontal or vertical array
    if (direction === 'left') {
      columnWalls[row][column - 1] = true
    } else if (direction === 'right') {
      columnWalls[row][column] = true
    } else if (direction === 'up') {
      rowWalls[row - 1][column] = true
    } else if (direction === 'down') {
      rowWalls[row][column] = true
    }

    // Visit that next cell - recursive solution
    doneCells(nextRow, nextColumn)
  }
}
doneCells(startRow, startColumn)

// Horisontal walls
rowWalls.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return
    }

    // Where to draw horisontal walls
    const wall = Bodies.rectangle(
      // Cell wall central point
      columnIndex * cellLengthX + cellLengthX / 2,
      // Cell wall row location
      rowIndex * cellLengthY + cellLengthY,
      // Cell wall length
      cellLengthX,
      // Cell wall height
      2,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red',
        },
      }
    )

    World.add(world, wall)
  })
})

// Vertical walls
columnWalls.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return
    }

    // Where to draw vertical walls
    const wall = Bodies.rectangle(
      columnIndex * cellLengthX + cellLengthX,
      rowIndex * cellLengthY + cellLengthY / 2,
      2,
      cellLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: 'red',
        },
      }
    )

    World.add(world, wall)
  })
})

// Finish point
const finish = Bodies.rectangle(
  // Finish point size inside cell
  width - cellLengthX / 2,
  // Finish point size inside cell
  height - cellLengthY / 2,
  // Finish point size
  cellLengthX * 0.7,
  // Finish point size
  cellLengthY * 0.7,
  // Not static would dro off screen
  {
    isStatic: true,
    label: 'finish',
    render: {
      fillStyle: 'green',
    },
  }
)
World.add(world, finish)

// Player size - radius of ball
const ballRadius = Math.min(cellLengthX, cellLengthY) / 4

// Player location
const player = Bodies.circle(
  // Player location inside cell
  cellLengthX / 2,
  // Player location inside cell
  cellLengthY / 2,
  // Player size - radius of ball
  ballRadius,
  // Options object
  {
    label: 'player',
  }
)
// Add player to the world
World.add(world, player)

// Add key controls
document.addEventListener('keyup', event => {
  // Destructuring
  const { x, y } = player.velocity
  const speedLimit = 5

  if (event.key === 'ArrowUp' && y > -speedLimit) {
    Body.setVelocity(player, { x, y: y - 5 })
  }

  if (event.key === 'ArrowRight' && x < speedLimit) {
    Body.setVelocity(player, { x: x + 5, y })
  }

  if (event.key === 'ArrowDown' && y < speedLimit) {
    Body.setVelocity(player, { x, y: y + 5 })
  }

  if (event.key === 'ArrowLeft' && x > -speedLimit) {
    Body.setVelocity(player, { x: x - 5, y })
  }
})

// Win condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(collision => {
    // Helper array
    const labels = ['player', 'finish']

    // Check if collision is between player(bodyA.label) && finish(bodyB.label)
    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      // Add collapsing animation to walls
      world.gravity.y = 1
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body, false)
        }
      })
    }
  })
})
