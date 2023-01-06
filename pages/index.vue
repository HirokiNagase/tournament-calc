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
          <th>Console</th>
        </tr>
      </thead>
      <tbody v-for="(deck, index) in deckList" :key="index">
        <tr>
          <td>{{ deck.deckName }}</td>
          <td>{{ deck.share }}</td>
          <span v-for="(_, subIndex) in deckList" :key="subIndex">
            <td
            :class="winrateClass(deck.winRate[subIndex])"
            >{{ deck.winRate[subIndex] }}</td>
          </span>
          <td>
            <button
            @click="edit(index)"
            >
              Edit
            </button>
            <button>
              DEL
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <button
    @click="addDeck"
    >
      デッキ追加
    </button>
    <div>
      <table class="myDeck">
        <thead>
          <tr>
            <th>Deck</th>
            <span v-for="(deck, index) in deckList" :key="index">
              <th>{{ deck.deckName }}</th>
            </span>
            <th>Console</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              myDeck
            </td>
            <span v-for="(_, index) in myDeckRate" :key="index">
              <td>{{ myDeckRate[index] }}</td>
            </span>
            <td>
              <button>
              Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <button
        @click="calclate"
      >
        calclate
      </button>
    <div v-show="calclated">
      <el-table
        :data="result"
        style="width: 100%">
        <el-table-column
          prop="deckName"
          label="Deck"
          width="180">
        </el-table-column>
        <el-table-column
          prop="top8Average"
          label="平均8入賞率"
          width="180">
        </el-table-column>
      </el-table>
    </div>

    <el-drawer
      title="デッキ情報修正"
      :visible.sync="drawer"
      direction="rtl"
      close="closeEdit"
      >
      <el-input 
        placeholder="デッキ名"
        v-model="selectDeck.deckName">
      </el-input>
      <span>メタゲーム占有率</span>
      <el-slider
        v-model="selectDeck.share"
        show-input>
      </el-slider>
      <div v-for="(rate, index) in selectDeck.winRate" :key="index" class="block">
        <span>対{{ deckList[index].deckName }}の勝率</span>
        <el-slider
          v-model="selectDeck.winRate[index]"
          :value="rate"
          :disabled="deckList[index].deckId === selectDeck.deckId"
          show-input
          @change="changeRate(rate, selectDeck.deckId, index)"
          >
        </el-slider>
      </div>
    </el-drawer>
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
      result: [],
      calclated: false,
      drawer: false,
      selectDeck:{},
    }
  },
  methods: {
    async calclate() {
      // this.resultの初期化
      this.result = [
        {
          deckId: 0,
          deckName: 'myDeck',
          top8Average: 0,
          sum: 0
        }
      ]
      // this.resultへ各デッキの初期値を追加
      this.deckList.forEach(deck => {
        const deckResult = {
          deckId: deck.deckId,
          deckName: deck.deckName,
          top8Average: 0,
          sum: 0
        }
        this.result.push(deckResult)
      })
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
      const loading = this.$loading({
          lock: true,
          text: '計算中',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
      const result = await Promise.all(workers)
      let concated = []
      result.forEach((workerResult) => {
        concated = concated.concat(workerResult)
      })
      concated.forEach(tournament => {
        const rateByDeck = tournament.top8Rate
        rateByDeck.forEach(({deckId, rate}) => {
          // 対応するthis.resultの中にrateを加算していく
          const index = this.result.findIndex(deck => deck.deckId === deckId)
          this.result[index].sum += rate
        })
        if (tournament.myDeckIn8) {
          const MY_DECK_ID = 0
          const index = this.result.findIndex(deck => deck.deckId === MY_DECK_ID)
          this.result[index].sum += 1
        }
      })
      this.result = this.result.map(deck => {
        const num = this.roundDecimal((deck.sum / concated.length) * 100, 2)
        deck.top8Average = `${num}%`
        return deck
      })
      this.calclated = true
      loading.close()
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
    },
    winrateClass(winrate) {
      if (winrate < 50) {
        return '-disad'
      } else if (winrate === '50') {
        return '-even'
      } else if (winrate > 50) {
        return '-ad'
      }
    },
    roundDecimal(value, n) {
      return Math.round(value * Math.pow(10, n) ) / Math.pow(10, n);
    },
    edit(index) {
      this.drawer = true
      this.selectDeck = this.deckList[index]
    },
    changeRate(rate, selectDeckId,oppIndex) {
      // 勝率の対応する値を入れる
      const opponentRate = 100 - rate
      const selectedindex = this.deckList.findIndex(deck => deck.deckId === selectDeckId)
      this.deckList[oppIndex].winRate[selectedindex] = opponentRate
    }
  }
}
</script>
