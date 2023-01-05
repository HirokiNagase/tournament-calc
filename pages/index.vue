<template>
  <div>
    <div class="variants">
      <span class="label">大会人数</span>
      <el-input-number v-model="playerNum"></el-input-number>
    </div>
    <div class="variants">
      <span class="label">ラウンド数</span>
      <el-input-number v-model="round"></el-input-number>
    </div>
    <div class="variants">
      <span class="label">試行回数</span>
      <el-input-number v-model="trials"></el-input-number>
    </div>
    <table class="decks">
      <thead>
        <tr>
          <th>Deck</th>
          <th>占有率(%)</th>
          <span v-for="(deck, index) in deckList" :key="index">
            <th>{{ deck.deckName }}</th>
          </span>
        </tr>
      </thead>
      <tbody v-for="(deck, index) in deckList" :key="index">
        <tr>
          <td>{{ deck.deckName }}</td>
          <td>{{ deck.share }}</td>
          <span v-for="(_, index) in deckList" :key="index">
            <td>{{ deck.winRate[index] }}</td>
          </span>
        </tr>
      </tbody>
    </table>
    <button
    @click="addDeck"
    >
      デッキ追加
    </button>

      <button
          size="small"
          @click="calclate"
        >
          calclate
        </button>
    <div>
    </div>
  </div>
</template>

<script>
import Worker from '~/assets/scripts/tournament.worker.js'
export default {
  name: 'IndexPage',
  data() {
    return {
      playerNum: 256,
      round: 10,
      trials: 1000,
      deckList: [
        {
          deckId: 1,
          deckName: 'Deck1',
          share: 45,
          winRate: [
            50,
            48,
            55
          ]
        },
        {
          deckId: 2,
          deckName: 'Deck2',
          share: 40,
          winRate: [
            52,
            50,
            48
          ]
        },
        {
          deckId: 3,
          deckName: 'Deck3',
          share: 15,
          winRate: [
            45,
            52,
            50
          ]
        }
      ],
      myDeckRate: [55, 52, 40],
      players: [],
      results:[]
    }
  },
  methods: {
    async calclate() {
      const maxWorkers = navigator.hardwareConcurrency || 4
      const workers = []
      const chunkSize = Math.ceil(this.trials / maxWorkers)
      for (let i = 0; i < maxWorkers; i++) {
        const worker = new Worker()
        const from = Math.max(chunkSize * i, 0)
        const to = Math.min(chunkSize * (i + 1), this.trials)
        const range = to - from
        const promise = new Promise((resolve, reject) => {
          worker.addEventListener('message', (message) => {
              resolve(message.data)
          })
        })
        workers.push(promise)
        worker.postMessage({
          range,
          playerNum: this.playerNum,
          round: this.round,
          deckList: this.deckList,
          myDeckRate: this.myDeckRate
        })
      }
      const result = await Promise.all(workers)
      console.log('fin')
      console.log(result)
    },
    addDeck() {
      // deckId出す
      const deckIds = this.deckList.map(deck => {
        return deck.deckId
      })
      const maxId = Math.max.apply(null, deckIds)
      const newId = maxId + 1
      // deckNameの初期値は Deck${id}
      const deckName = `Deck${newId}`
      // 他のDeckのwinrateとmyDeckRateにも値を追加
      this.deckList = this.deckList.map(deck => {
        deck.winRate.push(50)
        return deck
      })
      this.myDeckRate.push(50)
      // shareの初期値は0
      // winrateの初期値はAll50
      const winRate = []
      for (let i = 0; i <= this.deckList.length; i++) {
        winRate.push(50)
      }
      const newDeck = {
        deckId: newId,
        deckName,
        share: 0,
        winRate
      }
      this.deckList.push(newDeck)
      console.log(this.deckList)

    }
  },
  // filters: {
  //   winRate(deck)
  // }
}
</script>
