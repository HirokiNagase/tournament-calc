<template>
  <div class="button">
    <el-button round type="danger" @click="calculate">計算実行</el-button>
    <div v-show="calculated">
      <el-table class="table -result" :data="result" style="width: 100%">
        <el-table-column
          prop="deckName"
          label="Deck"
          width="180"
        ></el-table-column>
        <el-table-column
          sortable
          prop="top8Average"
          label="平均8入賞率"
          width="180"
        ></el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import Worker from '~/assets/scripts/tournament.worker.js'

export default {
  props: {
    playerNum: Number,
    round: Number,
    trials: Number,
    deckList: Array,
    useMyDeck: Boolean,
  },
  data() {
    return {
      result: [],
      calculated: false,
    }
  },
  methods: {
    async calculate() {
      const shareSum = Object.keys(this.deckList).reduce(
        (sum, key) => sum + this.deckList[key].share,
        0
      )
      // 占有率の合計値を四捨五入して100になっているかどうかの確認
      if (Math.round(shareSum) !== 100)
        return alert('占有率の合計が100でありません')
      // this.resultの初期化
      this.result = this.useMyDeck
        ? [
            {
              deckId: 0,
              deckName: 'myDeck',
              top8Average: 0,
              sum: 0,
            },
          ]
        : []
      // this.resultへ各デッキの初期値を追加
      this.deckList.forEach((deck) => {
        const deckResult = {
          deckId: deck.deckId,
          deckName: deck.deckName,
          top8Average: 0,
          sum: 0,
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
          myDeckRate: this.myDeckRate,
          useMyDeck: this.useMyDeck,
        })
      }
      const loading = this.$loading({
        lock: true,
        text: '計算中',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)',
      })
      const result = await Promise.all(workers)
      let concated = []
      result.forEach((workerResult) => {
        concated = concated.concat(workerResult)
      })
      concated.forEach((tournament) => {
        const rateByDeck = tournament.top8Rate
        rateByDeck.forEach(({ deckId, rate }) => {
          // 対応するthis.resultの中にrateを加算していく
          const index = this.result.findIndex((deck) => deck.deckId === deckId)
          this.result[index].sum += rate
        })
        if (tournament.myDeckIn8) {
          const MY_DECK_ID = 0
          const index = this.result.findIndex(
            (deck) => deck.deckId === MY_DECK_ID
          )
          this.result[index].sum += 1
        }
      })
      this.result = this.result.map((deck) => {
        const num = this.roundDecimal((deck.sum / concated.length) * 100, 2)
        deck.top8Average = `${num}%`
        return deck
      })
      loading.close()

      this.calculated = true
    },
    roundDecimal(value, n) {
      return Math.round(value * Math.pow(10, n)) / Math.pow(10, n)
    },
  },
}
</script>
<style lang="scss" scoped>
.button {
  margin-top: 10px;
}
</style>
