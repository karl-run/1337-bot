import * as R from 'remeda'
import { create } from 'zustand'

type PowerUps = {
  'self-sub-10': {
    type: 'power-up'
  }
}

type Attacks = {
  'target-add-100': {
    type: 'attack'
  }
}

type Modifiers = PowerUps & Attacks

type ModifiersVariants = keyof Modifiers

type Leet = {
  playerId: string
  ts: number
  message: string
}

type Modifier = {
  targetId: string
  userId: string
  modifier: ModifiersVariants
}

type LeetDay = {
  leets: Leet[]
  modifiers: Modifier[]
}

type GameMonth = {
  days: LeetDay[]
}

const exampleMonth: GameMonth = {
  days: [
    {
      leets: [
        {
          playerId: '1',
          ts: 1727609820751.779,
          message: '1337',
        },
      ],
      modifiers: [],
    },
  ],
}

const useStore = create<GameMonth>(() => ({
  ...exampleMonth,
}))

function App() {
  const days = useStore((it) => it.days)

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">{JSON.stringify(days, null, 2)}</div>
      <div>{new Date(days[0].leets[0].ts).toISOString()}</div>
      <Players />
    </>
  )
}

function Players() {
  const days = useStore((it) => it.days)

  function inferPlayers(days: LeetDay[]) {
    return R.pipe(
      days,
      R.map((it) => it.leets),
    )
  }

  const players = inferPlayers(days)

  return (
    <div>
      <h1>Players:</h1>
      {JSON.stringify(players, null, 2)}
    </div>
  )
}

export default App
